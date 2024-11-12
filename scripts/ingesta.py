import os
import pickle
import pandas as pd
import boto3
from sodapy import Socrata
from datetime import datetime, timedelta

# Obtener las variables de entorno
s3_bucket = os.getenv("S3_BUCKET_NAME")
socrata_username = os.getenv("SOCRATA_USERNAME")
socrata_password = os.getenv("SOCRATA_PASSWORD")
socrata_app_token = os.getenv("SOCRATA_APP_TOKEN")
aws_access_key_id = os.getenv("AWS_ACCESS_KEY_ID")
aws_secret_access_key = os.getenv("AWS_SECRET_ACCESS_KEY")

# Verificación de variables de entorno
if not s3_bucket or not aws_access_key_id or not aws_secret_access_key:
    raise ValueError("Las variables de entorno necesarias para S3 no están establecidas correctamente.")

if not socrata_app_token or not socrata_username or not socrata_password:
    raise ValueError("Las variables de entorno necesarias para Socrata no están establecidas correctamente.")

# Función para verificar si existe el archivo Pickle
def verificar_archivo(pickle_file_name):
    return os.path.exists(pickle_file_name)

# Función para cargar datos desde el archivo Pickle
def cargar_datos(pickle_file_name):
    with open(pickle_file_name, 'rb') as f:
        return pickle.load(f)

# Función para obtener la última fecha de inspección en los datos
def obtener_ultimo_inspection_date(data):
    if 'inspection_date' in data.columns:
        return data['inspection_date'].max()
    else:
        raise ValueError("La columna 'inspection_date' no existe en los datos.")

# Función para obtener un cliente de la API de Socrata
def get_client():
    return Socrata('data.cityofchicago.org', socrata_app_token, socrata_username, socrata_password)

# Función para crear el recurso de S3
def get_s3_resource():
    return boto3.resource(
        "s3",
        aws_access_key_id=aws_access_key_id,
        aws_secret_access_key=aws_secret_access_key
    )

# Función para subir datos al bucket de S3
def guardar_ingesta(bucket_name, ruta, data_frame):
    s3 = get_s3_resource()
    pickle_data = pickle.dumps(data_frame)  # Convertir a Pickle
    s3.Object(bucket_name, ruta).put(Body=pickle_data)
    print(f"Datos guardados en {bucket_name}/{ruta}")

# Función para la ingesta inicial
def ingesta_inicial(client, limit=300000):
    print("Realizando la ingesta de datos inicial desde la API...")
    results = client.get("4ijn-s7e5", limit=limit)
    return pd.DataFrame.from_records(results)

# Función para la ingesta consecutiva de datos
def ingesta_consecutiva(client, fecha_inicio, limit=1000):
    print("Realizando la ingesta de datos incrementales desde la API...")
    query = f"inspection_date >= '{fecha_inicio}'"
    results = client.get("4ijn-s7e5", where=query, limit=limit)
    return pd.DataFrame.from_records(results)

# Función principal para la ingesta y almacenamiento
def ingest_data():
    # Nombre del archivo Pickle local
    pickle_file_name = "ingested_data.pkl"
    client = get_client()
    fecha_hoy = datetime.today().strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3]

    # Verificar si es ingesta inicial o consecutiva
    if verificar_archivo(pickle_file_name):
        existing_data = cargar_datos(pickle_file_name)
        existing_data.columns = existing_data.columns.str.strip().str.lower()
        
        # Obtener la última fecha de inspección y aplicar un "buffer" de 2 días
        ultimo_inspection_date = obtener_ultimo_inspection_date(existing_data)
        buffer_date = (datetime.strptime(ultimo_inspection_date, '%Y-%m-%d') - timedelta(days=2)).strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3]

        # Realizar ingesta consecutiva
        new_data = ingesta_consecutiva(client, buffer_date)
        new_data.columns = new_data.columns.str.strip().str.lower()

        # Combinar los datos existentes y nuevos, eliminando duplicados y valores nulos
        combined_data = pd.concat([existing_data, new_data]).drop_duplicates().dropna()

        # Ruta para la ingesta consecutiva en S3
        s3_object_name = f"ingesta/consecutiva/inspecciones-consecutivas-{fecha_hoy}.pkl"
    
    else:
        # Realizar ingesta inicial
        combined_data = ingesta_inicial(client)
        combined_data.columns = combined_data.columns.str.strip().str.lower()

        # Ruta para la ingesta inicial en S3
        s3_object_name = f"ingesta/inicial/inspecciones-historicas-{fecha_hoy}.pkl"

    # Verificar si 'inspection_date' está en las columnas antes de ordenar
    if 'inspection_date' in combined_data.columns:
        combined_data.sort_values(by='inspection_date', ascending=False, inplace=True)
    else:
        raise KeyError("La columna 'inspection_date' no está presente en los datos.")

    # Guardar el DataFrame combinado en Pickle
    with open(pickle_file_name, 'wb') as f:
        pickle.dump(combined_data, f)
    
    print(f"Datos descargados y guardados en {pickle_file_name}.")
    
    # Guardar en S3
    guardar_ingesta(s3_bucket, s3_object_name, combined_data)

if __name__ == "__main__":
    ingest_data()
