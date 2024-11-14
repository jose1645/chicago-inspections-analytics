from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Count, Avg
from .models import Inspection

class KPIs(APIView):
    def get(self, request, *args, **kwargs):
        # Calculamos los KPIs
        total_inspections = Inspection.objects.count()
        passed_inspections = Inspection.objects.filter(results='Pass').count()
        failed_inspections = Inspection.objects.filter(results='Fail').count()
        avg_score = Inspection.objects.aggregate(Avg('score'))['score__avg']

        kpis = {
            'total_inspections': total_inspections,
            'passed_inspections': passed_inspections,
            'failed_inspections': failed_inspections,
            'avg_score': avg_score,
        }

        return Response(kpis)
