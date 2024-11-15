import boto3
import pandas as pd
import os

def load_file_from_s3(bucket_name, file_key):
    """
    Carga un archivo CSV desde S3 y lo convierte en un DataFrame de pandas.
    
    Args:
        bucket_name (str): El nombre del bucket de S3.
        file_key (str): La clave del archivo dentro del bucket.

    Returns:
        pd.DataFrame: El contenido del archivo como un DataFrame.
    """
    # Crear el cliente de S3
    s3 = boto3.client(
        's3',
        aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
        aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
    )
    
    # Descargar el archivo desde S3
    try:
        response = s3.get_object(Bucket=bucket_name, Key=file_key)
        # Leer el contenido del archivo directamente como un DataFrame
        data = pd.read_csv(response['Body'])
        return data
    except Exception as e:
        raise Exception(f"Error al cargar el archivo desde S3: {str(e)}")
