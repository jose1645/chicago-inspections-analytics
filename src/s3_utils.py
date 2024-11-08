# src/s3_utils.py
import boto3
from botocore.exceptions import BotoCoreError, ClientError

def upload_data(data, bucket_name, folder):
    s3 = boto3.client('s3')
    try:
        # Convierte los datos a un formato adecuado (por ejemplo, CSV o JSON) y súbelos
        # Aquí podrías implementar la lógica para guardar los datos en S3
        s3.put_object(Bucket=bucket_name, Key=f"{folder}data.json", Body=str(data))  # Ejemplo
    except (BotoCoreError, ClientError) as e:
        print(f"Error subiendo a S3: {e}")
