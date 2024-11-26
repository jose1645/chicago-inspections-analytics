import os
import boto3
import pandas as pd
import numpy as np
from datetime import datetime
import pickle
import tempfile
import logging
from logging.handlers import TimedRotatingFileHandler

# Configuración de logging con rotación mensual
log_filename = "limpieza_log.log"
log_handler = TimedRotatingFileHandler(log_filename, when="M", interval=1, backupCount=12)
log_handler.suffix = "%Y-%m"
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(filename)s:%(lineno)d - %(message)s',
    handlers=[log_handler]
)

# Carga de variables de entorno
aws_access_key_id = os.getenv("AWS_ACCESS_KEY_ID")
aws_secret_access_key = os.getenv("AWS_SECRET_ACCESS_KEY")
s3_bucket = os.getenv("S3_BUCKET_NAME")

# Inicializa el cliente de S3 utilizando las credenciales de AWS
s3 = boto3.client(
    's3',
    aws_access_key_id=aws_access_key_id,
    aws_secret_access_key=aws_secret_access_key
)

def cargar_datos_s3(bucket, ruta):
    logging.info(f"Cargando archivos desde {bucket}/{ruta}")
    archivos = []
    try:
        response = s3.list_objects_v2(Bucket=bucket, Prefix=ruta)
        for obj in response.get('Contents', []):
            if obj['Key'].endswith('.pkl'):
                archivos.append(obj)
        logging.info(f"{len(archivos)} archivos encontrados.")
    except Exception as e:
        logging.error(f"Error al cargar archivos desde S3: {e}")
    return archivos

def descargar_archivo_s3(bucket, archivo_obj):
    archivo = archivo_obj['Key']
    logging.info(f"Descargando archivo {archivo} de S3.")
    try:
        archivo_obj_data = s3.get_object(Bucket=bucket, Key=archivo)
        data = pickle.load(archivo_obj_data['Body'])
        etag = archivo_obj['ETag'].strip('"')
        logging.info(f"Archivo {archivo} descargado con éxito.")
        return data, etag
    except Exception as e:
        logging.error(f"Error al descargar el archivo {archivo} de S3: {e}")
        return None, None

def existe_archivo_limpio(bucket, ruta_limpia, etag):
    """
    Verifica si ya existe un archivo limpio con el mismo ETag en el bucket S3.
    """
    try:
        response = s3.list_objects_v2(Bucket=bucket, Prefix=ruta_limpia)

        if 'Contents' in response:
            # Buscar si el ETag ya está en el nombre del archivo
            for obj in response['Contents']:
                if etag in obj['Key']:
                    logging.info(f"El archivo {obj['Key']} con etag {etag} ya existe en S3.")
                    return True

        logging.info(f"No se encontró un archivo con el etag {etag} en el bucket {bucket}.")
        return False
    except s3.exceptions.NoSuchBucket as e:
        logging.error(f"El bucket {bucket} no existe: {e}")
    except s3.exceptions.ClientError as e:
        logging.error(f"Error de cliente al verificar el archivo: {e}")
    except Exception as e:
        logging.error(f"Error inesperado al verificar el archivo: {e}")
    
    return False

def transformar_ingesta(data):
    logging.info("Transformando datos de ingesta.")
    df = pd.DataFrame(data)
    return df

def guardar_datos_s3(bucket, ruta, df, etag):
    """
    Guarda el DataFrame en S3 si no existe ya un archivo con el mismo ETag.
    """
    fecha = datetime.today().strftime('%Y-%m-%d')
    archivo = f"{ruta}/datos_limpios/datos_limpios_{fecha}_{etag}.pkl"

    # Verificar si ya existe un archivo con este ETag
    if existe_archivo_limpio(bucket, ruta, etag):
        logging.info(f"El archivo {archivo} con etag {etag} ya existe. No se guardará.")
        return

    # Guardar el DataFrame en un archivo temporal
    with tempfile.NamedTemporaryFile(delete=False) as temp_file:
        pickle.dump(df, temp_file)
        temp_file_path = temp_file.name  # Ruta al archivo temporal

    # Subir el archivo temporal a S3
    try:
        s3.upload_file(temp_file_path, bucket, archivo)
        logging.info(f"Archivo limpio guardado en S3: {archivo}")
    except Exception as e:
        logging.error(f"Error al guardar el archivo limpio en S3: {e}")
    finally:
        # Eliminar el archivo temporal
        os.remove(temp_file_path)

def procesar_archivos(bucket, rutas):
    ruta_limpia = 'datos_limpios'
    for ruta in rutas:
        archivos = cargar_datos_s3(bucket, ruta)
        for archivo_obj in archivos:
            data, etag = descargar_archivo_s3(bucket, archivo_obj)
            
            if data is None:
                continue
            
            # Validación: si el archivo limpio ya existe, salta a la siguiente iteración
            if existe_archivo_limpio(bucket, ruta_limpia, etag):
                logging.info(f"El archivo con ETag {etag} ya fue limpiado. Saltando...")
                continue
            
            df = transformar_ingesta(data)
            guardar_datos_s3(bucket, ruta_limpia, df, etag)
            logging.info(f"Limpieza realizada y guardada para el archivo con ETag {etag}")

# Ejecución en bucle con espera de un día
if __name__ == "__main__":
    rutas_ingesta = ['ingesta/inicial', 'ingesta/consecutiva']
    logging.info("Inicio de la ejecución de limpieza diaria")
    procesar_archivos(s3_bucket, rutas_ingesta)    
    logging.info("Limpieza completada. Esperando 24 horas para la próxima ejecución.")
