import os
import pickle
import pandas as pd
import requests
import boto3
import io  # Importa el módulo io que contiene StringIO

def verificar_archivo(pickle_file_name):
    return os.path.exists(pickle_file_name)

def cargar_datos(pickle_file_name):
    # Leer el archivo Pickle
    with open(pickle_file_name, 'rb') as f:
        return pickle.load(f)

def obtener_ultimo_inspection_date(data):
    # Obtener el último valor de la columna 'inspection_date'
    if 'inspection Date' in data.columns:
        return data['inspection Date'].max()  # Devuelve la fecha más reciente
    else:
        raise ValueError("La columna 'inspection Date' no existe en los datos.")

def subir_a_s3(file_name, bucket_name, object_name):
    # Inicializa el cliente S3
    s3_client = boto3.client('s3')
    # Sube el archivo a S3
    s3_client.upload_file(file_name, bucket_name, object_name)
    print(f"Datos subidos a S3 en el bucket '{bucket_name}' con el nombre '{object_name}'.")

def ingest_data():
    # Leer las variables de entorno
    s3_bucket = os.getenv("S3_BUCKET_NAME")  # Nombre del bucket S3
    s3_object_name = "data/ingested_data.pkl"  # Nombre del objeto en S3
    socrata_username = os.getenv("SOCRATA_USERNAME")
    socrata_password = os.getenv("SOCRATA_PASSWORD")
    socrata_app_token = os.getenv("SOCRATA_APP_TOKEN")

    # Verifica si el bucket está definido
    if not s3_bucket:
        raise ValueError("El nombre del bucket S3 no está definido en las variables de entorno.")

    pickle_file_name = "ingested_data.pkl"  # Nombre del archivo Pickle

    # Inicializar un DataFrame vacío para nuevos datos
    new_data = pd.DataFrame()

    if verificar_archivo(pickle_file_name):
        # Si el archivo existe, cargar los datos existentes
        existing_data = cargar_datos(pickle_file_name)
        print("Archivo existente encontrado.")
        ultimo_inspection_date = obtener_ultimo_inspection_date(existing_data)
        print(f"Última fecha de inspección: {ultimo_inspection_date}")

        # Realizar la ingesta de datos desde la API
        print("Realizando la ingesta de datos desde la API...")
        url = "https://sandbox.demo.socrata.com/api/views/tu_endpoint.csv"  # Cambia esto al endpoint deseado
        response = requests.get(url, auth=(socrata_username, socrata_password))

        # Convertir la respuesta a un DataFrame
        new_data = pd.read_csv(io.StringIO(response.text))

        # Limitar la ingesta a 300,000 registros
        new_data = new_data.head(300000)

        # Combinar los datos existentes y nuevos
        combined_data = pd.concat([existing_data, new_data])

    else:
        # Si el archivo no existe, realizar la ingesta por primera vez
        print("El archivo no existe. Realizando la ingesta de datos desde la API...")
        url = "https://sandbox.demo.socrata.com/api/views/tu_endpoint.csv"  # Cambia esto al endpoint deseado
        response = requests.get(url, auth=(socrata_username, socrata_password))

        # Convertir la respuesta a un DataFrame
        combined_data = pd.read_csv(io.StringIO(response.text))

        # Limitar la ingesta a 300,000 registros
        combined_data = combined_data.head(300000)

    # Asegurarse de que los datos estén ordenados por 'inspection_date'
    combined_data.sort_values(by='inspection Date', ascending=False, inplace=True)

    # Guardar el DataFrame combinado en Pickle
    with open(pickle_file_name, 'wb') as f:
        pickle.dump(combined_data, f)

    print(f"Datos descargados y guardados en {pickle_file_name}.")

    # Subir el archivo Pickle a S3
    subir_a_s3(pickle_file_name, s3_bucket, s3_object_name)

if __name__ == "__main__":
    ingest_data()
