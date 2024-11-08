# src/limpieza.py
import pandas as pd

def limpiar_datos(data):
    # Convierte a DataFrame para facilitar la limpieza
    df = pd.DataFrame(data)

    # Elimina duplicados
    df = df.drop_duplicates()

    # Manejo de valores faltantes (ejemplo: eliminar filas con NaN)
    df = df.dropna()

    # Normalización de texto y formatos
    # (Agrega aquí más reglas de limpieza según sea necesario)

    return df.to_dict(orient='records')  # Retorna los datos en formato dict
