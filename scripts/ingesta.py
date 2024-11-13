import os
import pickle
import pandas as pd
import boto3
from sodapy import Socrata
from datetime import datetime
import logging
import subprocess

# Configurar el logger para mostrar el tiempo, nivel, nombre de archivo y línea de cada mensaje
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(filename)s:%(lineno)d - %(message)s"
)

# Variables de entorno y configuración
s3_bucket = os.getenv("S3_BUCKET_NAME")
socrata_username = os.getenv("SOCRATA_USERNAME")
socrata_password = os.getenv("SOCRATA_PASSWORD")
socrata_app_token = os.getenv("SOCRATA_APP_TOKEN")
aws_access_key_id = os.getenv("AWS_ACCESS_KEY_ID")
aws_secret_access_key = os.getenv("AWS_SECRET_ACCESS_KEY")

# Archivo de estado para la última fecha procesada en S3
estado_file_name = "estado/last_processed_date.pkl"

# Función para obtener un cliente de la API de Socrata
def get_client():
    logging.info("Creando cliente de Socrata para la API.")
    return Socrata('data.cityofchicago.org', socrata_app_token, socrata_username, socrata_password)

# Función para crear el recurso de S3
def get_s3_resource():
    logging.info("Obteniendo recurso S3.")
    return boto3.resource(
        "s3",
        aws_access_key_id=aws_access_key_id,
        aws_secret_access_key=aws_secret_access_key
    )

# Función para subir datos al bucket de S3
def guardar_ingesta(bucket_name, ruta, data_frame):
    logging.info(f"Guardando datos en {bucket_name}/{ruta}")
    s3 = get_s3_resource()
    pickle_data = pickle.dumps(data_frame)
    s3.Object(bucket_name, ruta).put(Body=pickle_data)
    logging.info(f"Datos guardados exitosamente en {bucket_name}/{ruta}")

# Función para la ingesta inicial
def ingesta_inicial(client, limit=300000):
    logging.info("Realizando la ingesta de datos inicial hasta el año 2022.")
    query = "inspection_date < '2023-01-01T00:00:00'"
    results = client.get("4ijn-s7e5", where=query, limit=limit)
    logging.info("Ingesta inicial completada.")
    return pd.DataFrame.from_records(results)

# Función para la ingesta consecutiva de datos
def ingesta_consecutiva(client, fecha_inicio, limit=1000):
    logging.info(f"Realizando ingesta incremental desde {fecha_inicio}.")
    query = f"inspection_date > '{fecha_inicio}'"
    results = client.get("4ijn-s7e5", where=query, limit=limit)
    logging.info("Ingesta consecutiva completada.")
    return pd.DataFrame.from_records(results)

# Función para verificar acceso a S3
def verificar_acceso_s3(bucket_name):
    logging.info(f"Verificando acceso al bucket S3 {bucket_name}.")
    try:
        s3 = get_s3_resource()
        for obj in s3.Bucket(bucket_name).objects.all():
            logging.debug(f"Acceso confirmado. Objeto encontrado: {obj.key}")
        return True
    except Exception as e:
        logging.error(f"Error al acceder a S3: {e}")
        return False

# Función para cargar la última fecha procesada desde el archivo de estado en S3
def cargar_fecha_ultimo_proceso():
    logging.info("Cargando la última fecha procesada desde el archivo de estado en S3.")
    s3 = get_s3_resource()
    try:
        obj = s3.Object(s3_bucket, estado_file_name)
        with obj.get()['Body'] as f:
            fecha = pickle.load(f)
            logging.info(f"Última fecha procesada cargada: {fecha}")
            return fecha
    except s3.meta.client.exceptions.NoSuchKey:
        logging.warning("Archivo de estado no encontrado. Se realizará una ingesta completa.")
        return None

# Función para guardar la última fecha procesada en el archivo de estado en S3
def guardar_fecha_ultimo_proceso(fecha):
    logging.info(f"Guardando la última fecha procesada: {fecha}")
    s3 = get_s3_resource()
    pickle_data = pickle.dumps(fecha)
    s3.Object(s3_bucket, estado_file_name).put(Body=pickle_data)
    logging.info(f"Fecha procesada actualizada exitosamente a {fecha}")

# Función principal para la ingesta y almacenamiento
def ingest_data():
    client = get_client()
    fecha_hoy = datetime.today().strftime('%Y-%m-%dT%H-%M-%S')

    # Verificar acceso a S3
    if not verificar_acceso_s3(s3_bucket):
        logging.error("No se pudo acceder a S3. Deteniendo el proceso de ingesta.")
        return

    # Verificar si es una ingesta inicial o consecutiva
    fecha_ultimo_proceso = cargar_fecha_ultimo_proceso()

    if fecha_ultimo_proceso:
        # Ingesta consecutiva
        new_data = ingesta_consecutiva(client, fecha_ultimo_proceso)
        new_data.columns = new_data.columns.str.strip().str.lower()

        # Verificar si hay datos nuevos antes de guardar en S3
        if not new_data.empty:
            s3_object_name = f"ingesta/consecutiva/inspecciones-consecutivas-{fecha_hoy}.pkl"
            guardar_ingesta(s3_bucket, s3_object_name, new_data)

            if 'inspection_date' in new_data.columns:
                ultima_fecha = new_data['inspection_date'].max()
                guardar_fecha_ultimo_proceso(ultima_fecha)
        else:
            logging.info("No hay datos nuevos desde la última ingesta. No se generará un archivo.")
    else:
        # Ingesta inicial
        initial_data = ingesta_inicial(client)
        initial_data.columns = initial_data.columns.str.strip().str.lower()

        s3_object_name = f"ingesta/inicial/inspecciones-historicas-{fecha_hoy}.pkl"
        guardar_ingesta(s3_bucket, s3_object_name, initial_data)

        if 'inspection_date' in initial_data.columns:
            ultima_fecha = initial_data['inspection_date'].max()
            guardar_fecha_ultimo_proceso(ultima_fecha)

    # Ejecutar el script de limpieza tras completar la ingesta
    logging.info("Ejecutando proceso de limpieza...")
    subprocess.run(["python", "/app/limpieza.py"])
    logging.info("Proceso de limpieza completado.")
