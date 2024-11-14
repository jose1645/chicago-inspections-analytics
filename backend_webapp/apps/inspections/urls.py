from django.urls import path
from .views import KPIs

urlpatterns = [
    path('api/kpis/', KPIs.as_view(), name='kpis'),
]
