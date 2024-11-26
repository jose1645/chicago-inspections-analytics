from django.urls import path
from .views import KPIs, HeatMap

urlpatterns = [
    path('kpis/', KPIs.as_view(), name='kpis'),
    path('heatmap/', HeatMap.as_view(), name='heatmap'),

]
