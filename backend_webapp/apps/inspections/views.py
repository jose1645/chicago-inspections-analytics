import os
import pandas as pd
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from .utils import load_file_from_s3  # Función para cargar archivos desde S3

class InspectionPagination(PageNumberPagination):
    page_size = 100  # Número de registros por página
    page_size_query_param = 'page_size'
    max_page_size = 1000

class KPIs(APIView):
    def get(self, request, *args, **kwargs):
        bucket_name = os.getenv("S3_BUCKET_NAME")
        file_key = 'datos_limpios/datos_limpios/datos_limpios_2024-11-13_08e32f34859ab66384461bbea8b811ce.pkl '
        
        try:
            # Cargar el archivo desde S3 como DataFrame
            data_from_s3 = load_file_from_s3(bucket_name, file_key)
            if not isinstance(data_from_s3, pd.DataFrame):
                raise ValueError("El archivo cargado no es un DataFrame válido.")

            # Validar que las columnas necesarias existan
            required_columns = {'latitude', 'longitude', 'inspection_date', 'results', 'risk'}
            if not required_columns.issubset(data_from_s3.columns):
                raise ValueError(f"Faltan columnas necesarias en los datos: {required_columns - set(data_from_s3.columns)}")

            # Asegurar que 'inspection_date' sea de tipo datetime
            if not pd.api.types.is_datetime64_any_dtype(data_from_s3['inspection_date']):
                data_from_s3['inspection_date'] = pd.to_datetime(data_from_s3['inspection_date'])

            # Calcular los KPIs
            total_inspections = len(data_from_s3)
            passed_inspections = len(data_from_s3[data_from_s3['results'] == 'Pass'])
            failed_inspections = len(data_from_s3[data_from_s3['results'] == 'Fail'])
            inspections_by_month = data_from_s3.groupby(data_from_s3['inspection_date'].dt.month).size()
            risk_distribution = data_from_s3['risk'].value_counts()

            # Configurar paginación para las ubicaciones
            paginator = InspectionPagination()
            inspection_locations = data_from_s3[['latitude', 'longitude', 'inspection_date']].to_dict(orient='records')
            paginated_locations = paginator.paginate_queryset(inspection_locations, request)

            # Convertir los resultados a JSON-friendly
            kpis = {
                'total_inspections': total_inspections,
                'passed_inspections': passed_inspections,
                'failed_inspections': failed_inspections,
                'inspections_by_month': inspections_by_month.to_dict(),
                'risk_distribution': risk_distribution.to_dict(),
                'inspection_locations': paginated_locations
            }

        except Exception as e:
            return Response({"error": f"Error al calcular KPIs: {str(e)}"}, status=500)

        # Usar el paginador para la respuesta
        return paginator.get_paginated_response(kpis)
