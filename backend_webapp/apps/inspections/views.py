from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Count, Avg
from .models import Inspection
from .utils import load_file_from_s3  # Importa la función para cargar archivos de S3

class KPIs(APIView):
    def get(self, request, *args, **kwargs):
        # KPIs Generales de la base de datos
        total_inspections = Inspection.objects.count()
        passed_inspections = Inspection.objects.filter(results='Pass').count()
        failed_inspections = Inspection.objects.filter(results='Fail').count()
        avg_score = Inspection.objects.aggregate(Avg('score'))['score__avg']

        # KPIs adicionales basados en el archivo de S3 (por ejemplo, inspecciones por mes)
        bucket_name = settings.AWS_STORAGE_BUCKET_NAME
        file_key = 'data/inspections.csv'  # Asegúrate de usar la clave correcta del archivo en S3
        
        # Cargar y transformar los datos desde S3
        try:
            data_from_s3 = load_file_from_s3(bucket_name, file_key)
            
            # Calcular KPIs adicionales usando los datos de S3
            inspections_by_month = data_from_s3.groupby(data_from_s3['inspection_date'].dt.month).size()
            risk_distribution = data_from_s3['risk'].value_counts()

        except Exception as e:
            return Response({"error": f"Error al cargar los datos desde S3: {str(e)}"}, status=500)

        # Responder con todos los KPIs
        kpis = {
            'total_inspections': total_inspections,
            'passed_inspections': passed_inspections,
            'failed_inspections': failed_inspections,
            'avg_score': avg_score,
            'inspections_by_month': inspections_by_month.to_dict(),  # Convertir a diccionario para el JSON
            'risk_distribution': risk_distribution.to_dict(),  # Convertir a diccionario para el JSON
        }

        return Response(kpis)
