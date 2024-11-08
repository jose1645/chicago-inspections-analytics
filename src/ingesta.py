# src/ingesta.py
import boto3
from src.api_client import APIClient
from src.limpieza import limpiar_datos
from datetime import datetime

def ingesta_inicial(api_client, s3_client, bucket_name):
    data = api_client.get_all_data()
    data_limpia = limpiar_datos(data)
    folder = f"projects/inspections/initial/{datetime.now().strftime('%Y-%m-%d')}/"
    s3_client.upload_data(data_limpia, bucket_name, folder)

def ingesta_secuencial(api_client, s3_client, bucket_name, last_ingest_date):
    data = api_client.get_new_data(last_ingest_date)
    data_limpia = limpiar_datos(data)
    folder = f"projects/inspections/sequential/{datetime.now().strftime('%Y-%m-%d')}/"
    s3_client.upload_data(data_limpia, bucket_name, folder)
