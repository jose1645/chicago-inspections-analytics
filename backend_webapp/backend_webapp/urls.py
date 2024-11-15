from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('inspections/', include('apps.inspections.urls')),  # Incluye las rutas de la aplicación 'inspections'
]
