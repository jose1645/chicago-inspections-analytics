# src/api_client.py
import requests

class APIClient:
    def __init__(self, base_url):
        self.base_url = base_url

    def get_all_data(self):
        response = requests.get(f"{self.base_url}/inspections")  # Ajusta el endpoint según tu API
        response.raise_for_status()  # Levanta un error si la solicitud falla
        return response.json()  # Retorna los datos en formato JSON

    def get_new_data(self, since):
        response = requests.get(f"{self.base_url}/inspections?since={since}")  # Ajusta el endpoint
        response.raise_for_status()
        return response.json()
