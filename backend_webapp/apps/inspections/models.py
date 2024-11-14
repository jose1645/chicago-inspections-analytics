from django.db import models

class Inspection(models.Model):
    inspection_id = models.IntegerField()
    dba_name = models.CharField(max_length=255)
    aka_name = models.CharField(max_length=255)
    license_ = models.CharField(max_length=50)
    facility_type = models.CharField(max_length=100)
    risk = models.CharField(max_length=50)
    address = models.CharField(max_length=255)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=50)
    zip = models.CharField(max_length=10)
    inspection_date = models.DateField()
    inspection_type = models.CharField(max_length=50)
    results = models.CharField(max_length=20)
    violations = models.TextField()
    latitude = models.FloatField()
    longitude = models.FloatField()

    def __str__(self):
        return self.dba_name
