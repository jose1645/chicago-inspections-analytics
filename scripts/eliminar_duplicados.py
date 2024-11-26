import boto3
import logging
from collections import defaultdict

s3 = boto3.client('s3')

def eliminar_duplicados_por_etag(bucket, directorio):
    """
    Identifica y elimina duplicados basados en el `etag` en un directorio de S3.

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
            logging.info(f"No se encontraron objetos en el directorio {directorio}.")
            return

        # Agrupar objetos por etag
        etag_to_keys = defaultdict(list)
        for obj in response['Contents']:
            etag_to_keys[obj['ETag']].append(obj['Key'])

        # Identificar duplicados (más de un archivo con el mismo etag)
        duplicados = {etag: keys for etag, keys in etag_to_keys.items() if len(keys) > 1}

        if not duplicados:
            logging.info(f"No se encontraron duplicados en el directorio {directorio}.")
            return

        # Eliminar todos los duplicados excepto uno por etag
        for etag, keys in duplicados.items():
            # Mantener el primer archivo y eliminar los demás
            archivos_a_eliminar = [{"Key": key} for key in keys[1:]]  # Todos excepto el primero

            # Eliminar los archivos duplicados
            eliminar_response = s3.delete_objects(
                Bucket=bucket,
                Delete={"Objects": archivos_a_eliminar}
            )

            eliminados = eliminar_response.get("Deleted", [])
            logging.info(f"Eliminados {len(eliminados)} duplicados para el etag {etag}.")
            
            errores = eliminar_response.get("Errors", [])
            if errores:
                logging.warning(f"Errores al eliminar duplicados: {errores}")

    except Exception as e:
        logging.error(f"Error al eliminar duplicados: {e}")



if __name__ == "__main__":

    bucket_name = "chicago-inspections-analytics"
    directorio = "datos_limpios/"
    eliminar_duplicados_por_etag(bucket_name,directorio)
