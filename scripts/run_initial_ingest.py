import os
import pickle
import pandas as pd
import boto3
from sodapy import Socrata

def verificar_archivo(pickle_file_name):
    return os.path.exists(pickle_file_name)

def cargar_datos(pickle_file_name):
    with open(pickle_file_name, 'rb') as f:
        return pickle.load(f)

def obtener_ultimo_inspection_date(data):
    if 'inspection_date' in data.columns:
        return data['inspection_date'].max()
    else:
        raise ValueError("La columna 'inspection_date' no existe en los datos.")

def subir_a_s3(file_name, bucket_name, object_name):
    s3_client = boto3.client(
        's3',             
        aws_access_key_id = os.getenv("AWS_ACCESS_KEY_ID"),    
        aws_secret_access_key = os.getenv("AWS_SECRET_ACCESS_KEY")   
                             )
    s3_client.upload_file(file_name, bucket_name, object_name)
    print(f"Datos subidos a S3 en el bucket '{bucket_name}' con el nombre '{object_name}'.")

def ingest_data():
    s3_bucket = os.getenv("S3_BUCKET_NAME")
    s3_object_name = "data/ingested_data.pkl"
    socrata_username = os.getenv("SOCRATA_USERNAME")
    socrata_password = os.getenv("SOCRATA_PASSWORD")
    socrata_app_token = os.getenv("SOCRATA_APP_TOKEN")

    if not s3_bucket:
        raise ValueError("El nombre del bucket S3 no está definido en las variables de entorno.")

    pickle_file_name = "ingested_data.pkl"
    new_data = pd.DataFrame()

    if verificar_archivo(pickle_file_name):
        existing_data = cargar_datos(pickle_file_name)
        existing_data.columns = existing_data.columns.str.strip().str.lower()
        ultimo_inspection_date = obtener_ultimo_inspection_date(existing_data)

        print("Realizando la ingesta de datos desde la API...")
        client = Socrata('data.cityofchicago.org', socrata_app_token, socrata_username, socrata_password)
        results = client.get("4ijn-s7e5", limit=300000)
        
        # Convertir resultados a DataFrameads
        new_data = pd.DataFrame.from_records(results)
        new_data.columns = new_data.columns.str.strip().str.lower()
        
        # Combinar los datos existentes y nuevos,m.
        combined_data = pd.concat([existing_data, new_data])

    else:
        print("El archivo no existe. Realizando la ingesta de datos desde la API...")
        client = Socrata('data.cityofchicago.org', socrata_app_token, socrata_username, socrata_password)
        results = client.get("4ijn-s7e5", limit=10000)

        # Convertir resultados a DataFrame
        combined_data = pd.DataFrame.from_records(results)
        combined_data.columns = combined_data.columns.str.strip().str.lower()

    # Verificar si 'inspection_date' está en las columnas antes de ordenar
    if 'inspection_date' in combined_data.columns:
        combined_data.sort_values(by='inspection_date', ascending=False, inplace=True)
    else:
        print("La columna 'inspection_date' no se encuentra en combined_data")
        raise KeyError("La columna 'inspection_date' no está presente en los datos.")

    # Guardar el DataFrame combinado en Pickle
    with open(pickle_file_name, 'wb') as f:
        pickle.dump(combined_data, f)

    print(f"Datos descargados y guardados en {pickle_file_name}.")
    subir_a_s3(pickle_file_name, s3_bucket, s3_object_name)

if __name__ == "__main__":
    ingest_data()
