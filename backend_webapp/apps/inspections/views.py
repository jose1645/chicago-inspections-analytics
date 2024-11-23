import os
import pandas as pd
from rest_framework.views import APIView
from rest_framework.response import Response
from .utils import load_file_from_s3  # Importar función para cargar archivos desde S3

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
            results= data_from_s3[results]

            # Convertir los resultados a JSON-friendly
            kpis = {
                'total_inspections': total_inspections,
                'passed_inspections': passed_inspections,
                'failed_inspections': failed_inspections,
                'inspections_by_month': inspections_by_month.to_dict(),
                'risk_distribution': risk_distribution.to_dict(),
                'inspection_locations': data_from_s3[['latitude', 'longitude', 'inspection_date']].to_dict(orient='records'),
                'results': results
            }

        except Exception as e:
            return Response({"error": f"Error al calcular KPIs: {str(e)}"}, status=500)

        return Response(kpis)
