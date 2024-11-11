def ingest_data():
    # Código anterior para configurar el cliente y el archivo Pickle

    if verificar_archivo(pickle_file_name):
        # Código de verificación de archivo y carga de datos previos
        results = client.get("4ijn-s7e5", limit=200)
        new_data = pd.DataFrame.from_records(results)
        
        print("Columnas de new_data:", new_data.columns)  # Verifica las columnas

        # Limitar la ingesta a 300,000 registros
        new_data = new_data.head(300000)

        # Combinar los datos existentes y nuevos
        combined_data = pd.concat([existing_data, new_data])
    else:
        # Ingesta inicial
        url = "https://sandbox.demo.socrata.com/api/views/tu_endpoint.csv"
        response = requests.get(url, auth=(socrata_username, socrata_password))
        
        print("Contenido de response.text:", response.text)  # Depurar el contenido de la respuesta
        
        combined_data = pd.read_csv(io.StringIO(response.text))
        print("Columnas de combined_data después de cargar CSV:", combined_data.columns)  # Verificar columnas
        
        # Limitar la ingesta a 300,000 registros
        combined_data = combined_data.head(300000)

    # Verificar si 'inspection_date' está en las columnas antes de ordenar
    if 'inspection_date' in combined_data.columns:
        combined_data.sort_values(by='inspection_date', ascending=False, inplace=True)
    else:
        print("La columna 'inspection_date' no se encuentra en combined_data")
        raise KeyError("La columna 'inspection_date' no está presente en los datos.")

    # Resto del código para guardar el archivo y subirlo a S3
