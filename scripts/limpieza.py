import os
import boto3
import pandas as pd
import pickle
import tempfile
import logging
from datetime import datetime
from logging.handlers import TimedRotatingFileHandler

# Configuración de logging con rotación mensual
log_filename = "limpieza_log.log"
log_handler = TimedRotatingFileHandler(log_filename, when="M", interval=1, backupCount=12)
log_handler.suffix = "%Y-%m"
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[log_handler]
)

# Carga de variables de entorno
aws_access_key_id = os.getenv("AWS_ACCESS_KEY_ID")
aws_secret_access_key = os.getenv("AWS_SECRET_ACCESS_KEY")
s3_bucket = os.getenv("S3_BUCKET_NAME")

# Inicializa el cliente de S3
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
    try:
        response = s3.list_objects_v2(Bucket=bucket, Prefix=ruta_limpia)
        if 'Contents' in response:
            for obj in response['Contents']:
                if etag in obj['Key']:
                    logging.info(f"El archivo {obj['Key']} con etag {etag} ya existe en S3.")
                    return True
        return False
    except Exception as e:
        logging.error(f"Error al verificar archivo limpio: {e}")
        return False

def transformar_ingesta(data):
    logging.info("Iniciando transformación de datos.")
    try:
        # Convertir los datos en un DataFrame
        df = pd.DataFrame(data)

        # Asegurar nombres de columnas uniformes
        df.columns = df.columns.str.strip().str.lower()

        # Conversión de fechas
        if 'inspection_date' in df.columns:
            df['inspection_date'] = pd.to_datetime(df['inspection_date'], errors='coerce')

        # Eliminar duplicados
        df = df.drop_duplicates()

        # Eliminar filas con valores nulos en columnas relevantes
        columnas_relevantes = ['inspection_date', 'results']
        df = df.dropna(subset=columnas_relevantes)

        logging.info(f"Transformación completada: {df.shape[0]} filas, {df.shape[1]} columnas.")
        return df
    except Exception as e:
        logging.error(f"Error durante la transformación: {e}")
        return None

def guardar_datos_s3(bucket, ruta, df, etag):
    fecha = datetime.today().strftime('%Y-%m-%d')
    archivo = f"{ruta}/datos_limpios/datos_limpios_{fecha}_{etag}.pkl"

    if existe_archivo_limpio(bucket, ruta, etag):
        logging.info(f"El archivo {archivo} ya existe. No se guardará.")
        return

    with tempfile.NamedTemporaryFile(delete=False) as temp_file:
        pickle.dump(df, temp_file)
        temp_file_path = temp_file.name

    try:
        s3.upload_file(temp_file_path, bucket, archivo)
        logging.info(f"Archivo limpio guardado en S3: {archivo}")
    except Exception as e:
        print(e)
        logging.error(f"Error al guardar archivo limpio: {e}")
    finally:
        os.remove(temp_file_path)

def procesar_archivos(bucket, rutas):
    ruta_limpia = 'datos_limpios'
    archivos_procesados = 0
    errores = 0

    for ruta in rutas:
        archivos = cargar_datos_s3(bucket, ruta)
        for archivo_obj in archivos:
            data, etag = descargar_archivo_s3(bucket, archivo_obj)
            if data is None:
                errores += 1
                continue

            if existe_archivo_limpio(bucket, ruta_limpia, etag):
                logging.info(f"El archivo con ETag {etag} ya fue procesado.")
                continue

            df = transformar_ingesta(data)
            if df is not None:
                guardar_datos_s3(bucket, ruta_limpia, df, etag)
                archivos_procesados += 1
            else:
                errores += 1

    logging.info(f"Archivos procesados: {archivos_procesados}. Errores: {errores}.")

# Ejecución principal
if __name__ == "__main__":
    rutas_ingesta = ['ingesta/inicial', 'ingesta/consecutiva']
    logging.info("Inicio de la ejecución de limpieza diaria.")
    procesar_archivos(s3_bucket, rutas_ingesta)
    logging.info("Limpieza completada.")
