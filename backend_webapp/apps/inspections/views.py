import os
import pandas as pd
from rest_framework.views import APIView
from rest_framework.response import Response
from .utils import load_file_from_s3  # Importar función para cargar archivos desde S3
import boto3

class KPIs(APIView):
    def get(self, request, *args, **kwargs):
        bucket_name = os.getenv("S3_BUCKET_NAME")
        file_key = 'datos_limpios/datos_limpios/datos_limpios_2024-11-13_08e32f34859ab66384461bbea8b811ce.pkl'
        
        try:
            # Cargar el archivo desde S3 como DataFrame
            data_from_s3 = load_file_from_s3(bucket_name, file_key)
            if not isinstance(data_from_s3, pd.DataFrame):
                raise ValueError("El archivo cargado no es un DataFrame válido.")

            # Realizar las transformaciones necesarias
            total_inspections = len(data_from_s3)
            passed_inspections = len(data_from_s3[data_from_s3['results'] == 'Pass'])
            failed_inspections = len(data_from_s3[data_from_s3['results'] == 'Fail'])
            inspections_by_month = data_from_s3.groupby(data_from_s3['inspection_date'].dt.month).size()
            risk_distribution = data_from_s3['risk'].value_counts()

            # Convertir los resultados a JSON-friendly
            kpis = {
                'total_inspections': total_inspections,
                'passed_inspections': passed_inspections,
                'failed_inspections': failed_inspections,
                'inspections_by_month': inspections_by_month.to_dict(),
                'risk_distribution': risk_distribution.to_dict(),
                'inspection_locations': data_from_s3[['latitude', 'longitude', 'inspection_date','results']].to_dict(orient='records'),
            }

        except Exception as e:
            return Response({"error": f"Error al calcular KPIs: {str(e)}"}, status=500)

        return Response(kpis)
    




class HeatMap(APIView):
    """
    Vista para calcular y devolver los KPIs basados en los datos de inspecciones.
    """

    def get(self, request, *args, **kwargs):
        s3 = boto3.client(
              's3',
        aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
        aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
                          )

        # Obtener configuración del bucket y el prefijo del directorio
        bucket_name = os.getenv("S3_BUCKET_NAME")
        directory_prefix = 'datos_limpios/datos_limpios/'

        try:
            # Listar todos los archivos .pkl en el directorio
            response = s3.list_objects_v2(Bucket=bucket_name, Prefix=directory_prefix)
            if 'Contents' not in response:
                raise FileNotFoundError(f"No se encontraron archivos en el directorio {directory_prefix}")

            # Filtrar los archivos .pkl
            pkl_files = [obj['Key'] for obj in response['Contents'] if obj['Key'].endswith('.pkl')]
            if not pkl_files:
                raise FileNotFoundError(f"No se encontraron archivos .pkl en el directorio {directory_prefix}")

            # Cargar y concatenar los archivos .pkl
            dataframes = []
            for file_key in pkl_files:
                data = load_file_from_s3(bucket_name, file_key)
                if not isinstance(data, pd.DataFrame):
                    raise ValueError(f"El archivo {file_key} no contiene un DataFrame válido.")
                dataframes.append(data)

            # Concatenar todos los DataFrames
            data_from_s3 = pd.concat(dataframes, ignore_index=True)

            # Convertir columna de fechas a formato datetime si no lo está
            if not pd.api.types.is_datetime64_any_dtype(data_from_s3['inspection_date']):
                data_from_s3['inspection_date'] = pd.to_datetime(data_from_s3['inspection_date'])

            # KPIs básicos
            total_inspections = len(data_from_s3)
            passed_inspections = len(data_from_s3[data_from_s3['results'] == 'Pass'])
            failed_inspections = len(data_from_s3[data_from_s3['results'] == 'Fail'])

            # Inspecciones por mes
            inspections_by_month = data_from_s3.groupby(data_from_s3['inspection_date'].dt.strftime('%Y-%m')).size()

            # Distribución de riesgo
            risk_distribution = data_from_s3['risk'].value_counts()

            # Lista de ubicaciones de inspección
            inspection_locations = data_from_s3[[
                'facility_name', 'address', 'latitude', 'longitude',
                'inspection_date', 'results'
            ]].to_dict(orient='records')

            # Construcción del diccionario de KPIs
            kpis = {
                'total_inspections': total_inspections,
                'passed_inspections': passed_inspections,
                'failed_inspections': failed_inspections,
                'inspections_by_month': inspections_by_month.to_dict(),
                'risk_distribution': risk_distribution.to_dict(),
                'inspection_locations': inspection_locations,
            }

        except FileNotFoundError as fnf_error:
            return Response({"error": str(fnf_error)}, status=404)
        except ValueError as ve:
            return Response({"error": f"Error de validación: {str(ve)}"}, status=400)
        except Exception as e:
            return Response({"error": f"Error al calcular KPIs: {str(e)}"}, status=500)

        # Retornar KPIs
        return Response(kpis)