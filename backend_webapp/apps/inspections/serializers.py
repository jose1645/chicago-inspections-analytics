from rest_framework import serializers
from .models import Inspection

class InspectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Inspection
        fields = '__all__'  # Esto serializa todos los campos del modelo
