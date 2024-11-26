import boto3
import os
from collections import defaultdict

# Obtener credenciales de AWS desde las variables de entorno
aws_access_key_id = os.getenv("AWS_ACCESS_KEY_ID")
aws_secret_access_key = os.getenv("AWS_SECRET_ACCESS_KEY")

# Inicializar cliente de S3 con credenciales explícitas
s3 = boto3.client(
    's3',
    aws_access_key_id=aws_access_key_id,
    aws_secret_access_key=aws_secret_access_key
)

def eliminar_duplicados_por_nombre_etag(bucket, directorio):
    """
    Mantiene solo un archivo único por ETag (extraído del nombre del archivo)
    en un directorio de S3, eliminando cualquier archivo duplicado.

    Args:
        bucket (str): Nombre del bucket de S3.
        directorio (str): Directorio en el bucket (simulado mediante prefijo).

    Returns:
        None
    """
    try:
        # Listar todos los objetos en el directorio
        response = s3.list_objects_v2(Bucket=bucket, Prefix=directorio)

        if 'Contents' not in response:
            print(f"No se encontraron objetos en el directorio {directorio}.")
            return

        print(f"Objetos encontrados en el directorio {directorio}: {len(response['Contents'])}")

        # Agrupar archivos por el ETag extraído del nombre del archivo
        etag_to_keys = defaultdict(list)
        for obj in response['Contents']:
            key = obj['Key']
            # Extraer el ETag del nombre del archivo
            if key.endswith(".pkl"):
                etag = key.split('_')[-1].replace('.pkl', '')
                etag_to_keys[etag].append(key)

        # Procesar duplicados y eliminar todos excepto uno por ETag
        for etag, keys in etag_to_keys.items():
            if len(keys) > 1:
                # Mantener el primer archivo y eliminar el resto
                archivos_a_eliminar = [{"Key": key} for key in keys[1:]]
                
                eliminar_response = s3.delete_objects(
                    Bucket=bucket,
                    Delete={"Objects": archivos_a_eliminar}
                )

                # Mostrar los archivos eliminados
                eliminados = eliminar_response.get("Deleted", [])
                print(f"Eliminados {len(eliminados)} archivos con el ETag (nombre) {etag}.")
                
                # Mostrar errores si los hay
                errores = eliminar_response.get("Errors", [])
                if errores:
                    print(f"Errores al eliminar archivos con el ETag (nombre) {etag}: {errores}")
            else:
                print(f"El archivo con ETag (nombre) {etag} es único y no se elimina.")

    except Exception as e:
        print(f"Error al procesar duplicados: {e}")

# Llamar la función principal
if __name__ == "__main__":
    bucket_name = "chicago-inspections-analytics"
    ruta_directorio = "datos_limpios/datos_limpios/"
    eliminar_duplicados_por_nombre_etag(bucket_name, ruta_directorio)