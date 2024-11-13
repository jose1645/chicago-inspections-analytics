import os
import boto3
import pandas as pd
import numpy as np
from datetime import datetime
import pickle
import time
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
socrata_username = os.getenv("SOCRATA_USERNAME")
socrata_password = os.getenv("SOCRATA_PASSWORD")
socrata_app_token = os.getenv("SOCRATA_APP_TOKEN")
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

def transformar_ingesta(data):
    logging.info("Transformando datos de ingesta.")
    df = pd.DataFrame(data)
    return df

def faltantes(df):
    logging.info("Verificando valores faltantes.")
    missing_data = df.isnull().sum()
    logging.info(f"Valores faltantes por columna:\n{missing_data}")

def elimina_faltantes_latitud_longitud(df, columnas):
    logging.info(f"Eliminando filas con valores nulos en las columnas {columnas}.")
    before_rows = len(df)
    df = df.dropna(subset=columnas)
    after_rows = len(df)
    logging.info(f"Filas eliminadas: {before_rows - after_rows}")
    return df

def imputar_faltantes(df, columna, valor_imputar):
    logging.info(f"Imputando valores faltantes en la columna {columna}.")
    df[columna].fillna(valor_imputar)
    return df

def transformar_enteros(df, columnas):
    logging.info(f"Transformando columnas {columnas} a enteros.")
    for columna in columnas:
        df[columna] = df[columna].astype('Int64')
    return df

def transformar_flotantes(df, columnas):
    logging.info(f"Transformando columnas {columnas} a flotantes.")
    for columna in columnas:
        df[columna] = df[columna].astype(float)
    return df

def transformar_fechas(df, columnas):
    logging.info(f"Transformando columnas {columnas} a fechas.")
    for columna in columnas:
        df[columna] = pd.to_datetime(df[columna], errors='coerce')
    return df

def existe_archivo_limpio(bucket, ruta_limpia, etag):
    archivo_limpio = f"{ruta_limpia}/datos_limpios/datos_limpios_{datetime.today().strftime('%Y-%m-%d')}_{etag}.pkl"
    try:
        response = s3.list_objects_v2(Bucket=bucket, Prefix=archivo_limpio)
        if 'Contents' in response:
            logging.info(f"El archivo limpio {archivo_limpio} ya existe en S3.")
            return True
        return False
    except Exception as e:
        logging.error(f"Error al verificar la existencia del archivo limpio: {e}")
        return False

def guardar_datos_s3(bucket, ruta, df, etag):
    fecha = datetime.today().strftime('%Y-%m-%d')
    archivo = f"{ruta}/datos_limpios/datos_limpios_{fecha}_{etag}.pkl"
    
    # Guardar el DataFrame en un archivo temporal
    with tempfile.NamedTemporaryFile(delete=False) as temp_file:
        pickle.dump(df, temp_file)
        temp_file_path = temp_file.name  # Ruta al archivo temporal
    
    # Subir directamente el archivo temporal a S3
    try:
        s3.upload_file(temp_file_path, bucket, archivo)
        logging.info(f"Archivo limpio guardado en S3: {archivo}")
    except Exception as e:
        logging.error(f"Error al guardar el archivo limpio en S3: {e}")

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
            faltantes(df)
            df = elimina_faltantes_latitud_longitud(df, ['latitude', 'longitude'])
            
            for columna in ['license_', 'zip', 'state', 'facility_type', 'risk']:
                df = imputar_faltantes(df, columna, df[columna].mode()[0])
                
            df = transformar_enteros(df, ['inspection_id'])
            df = transformar_flotantes(df, ['latitude', 'longitude'])
            df = transformar_fechas(df, ['inspection_date'])
            
            guardar_datos_s3(bucket, ruta_limpia, df, etag)
            logging.info(f"Limpieza realizada y guardada para el archivo con ETag {etag}")

# Ejecución en bucle con espera de un día
if __name__ == "__main__":
    rutas_ingesta = ['ingesta/inicial', 'ingesta/consecutiva']
    logging.info("Inicio de la ejecución de limpieza diaria")
    procesar_archivos(s3_bucket, rutas_ingesta)    
    logging.info("Limpieza completada. Esperando 24 horas para la próxima ejecución.")
