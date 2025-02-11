from flask import Flask, jsonify, request
import pandas as pd
import boto3
import os
from io import BytesIO
import psycopg2
from datetime import datetime
import pickle
ACCESS_KEY_ID=os.getenv('AWS_ACCESS_KEY_ID')
SECRET_ACCESS_KEY=os.getenv('AWS_SECRET_ACCESS_KEY')
HOST = os.getenv('RELATIONAL_DATABASE_HOST')
DATABASE = os.getenv('DATABASE')
USER = os.getenv('USER_DATABASE')
PASSWORD = os.getenv('DATABASE_PASSWORD')
S3_BUCKET_NAME= os.getenv('S3_BUCKET_NAME')

import boto3
import pandas as pd
import os
import pickle
from dotenv import load_dotenv

# Build paths inside the project like this: BASE_DIR / '
app = Flask(__name__)

import pickle
import pandas as pd
import boto3
import os

def load_pkl_from_s3(file_key):
    load_dotenv()
    try:
        s3_client = boto3.client(
            's3',
            aws_access_key_id=os.getenv(ACCESS_KEY_ID),
            aws_secret_access_key=os.getenv(SECRET_ACCESS_KEY)
        )

        bucket_name = os.getenv('S3_BUCKET_NAME')
        
        obj = s3_client.get_object(Bucket=bucket_name, Key=file_key)
        pkl_data = obj['Body'].read()

        try:
            data = pickle.loads(pkl_data)  # Intentar cargar el objeto desde pickle
        except Exception as e:
            return None


        # Si es un diccionario, intentar convertirlo a DataFrame
        if isinstance(data, dict):
            if 'predictions_labels' in data and isinstance(data['predictions_labels'], (list, tuple, pd.Series)):
                df = pd.DataFrame({'predictions_labels': data['predictions_labels']})
                return df
            else:
                return data

        # Si ya es un DataFrame, regresarlo directamente
        elif isinstance(data, pd.DataFrame):
            return data

        else:
            return None
    except Exception as e:
        return None
    
def get_db_connection():
    try:
        conn = psycopg2.connect(
            host=HOST,
            database=DATABASE,
            user=USER,
            password=PASSWORD
        )
        return conn
    except Exception as e:
        print(f"Error connecting to the database: {e}")
        return None


def save_to_postgres(df):
    conn = get_db_connection()  # Obtener la conexión a la base de datos

    if conn is None:
        return "Error: No se pudo conectar a la base de datos.", 500

    try:
        cursor = conn.cursor()

        # Crear una tabla si no existe
        create_table_query = """
        CREATE TABLE IF NOT EXISTS predictions (
            id SERIAL PRIMARY KEY,
            date TIMESTAMP,
            predictions_score FLOAT,
            predictions_labels INT
        );
        """
        cursor.execute(create_table_query)
        conn.commit()

        # Insertar los datos del DataFrame en la tabla
        for index, row in df.iterrows():
            insert_query = """
            INSERT INTO predictions (date, predictions_score, predictions_labels)
            VALUES (%s, %s, %s);
            """
            cursor.execute(insert_query, (row['date'], row['predictions_score'], row['predictions_labels']))

        conn.commit()
        cursor.close()
        conn.close()

        return "Data inserted successfully", 200

    except Exception as e:
        return f"Error: {e}", 500

@app.route('/prediction_id/<int:id>', methods=['GET'])
def get_prediction_by_id(id):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute('SELECT predictions_labels, date FROM predictions WHERE id = %s ORDER BY date DESC LIMIT 1', (id,))
        result = cur.fetchone()
        cur.close()
        conn.close()

        if result:
            prediction = {
                'inspection_id': id,
                'prediction_labels': result[0],
                'prediction_date': result[1].strftime('%Y-%m-%d')
            }
            return jsonify(prediction), 200
        else:
            return jsonify({'error': 'Prediction not found'}), 404
    except Exception as e:
        print(f"Error fetching prediction: {e}")
        return jsonify({'error': 'Internal server error'}), 500


# Endpoint /predictions_date
@app.route('/predictions_date/<date_str>', methods=['GET'])
def get_predictions_by_date(date_str):
    try:
        # Convertir la fecha de string a objeto datetime
        date = datetime.strptime(date_str, '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400

    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('SELECT id, predictions_labels FROM predictions WHERE date = %s', (date,))
    results = cur.fetchall()
    cur.close()
    conn.close()

    if results:
        predictions = [
            {'inspection_id': row[0], 'prediction_value': row[1]} for row in results
        ]
        return jsonify(predictions), 200
    else:
        return jsonify({'error': 'No predictions found for this date'}), 404

@app.route('/save', methods=['POST'])
def save():
    try:
        # Cargar los archivos .pkl desde S3
        path_predictions_score = 'results/predictions_score.pkl'
        path_predictions_label = 'results/predictions_label.pkl'

        data_score = load_pkl_from_s3(path_predictions_score)
        data_labels = load_pkl_from_s3(path_predictions_label)

        if data_score is None or data_labels is None:
            return jsonify({'message': "Error al cargar los archivos desde S3."}), 500

        # Asegurarsae de que 'predictions_score' esté presente en data_score
        if 'predictions_score' in data_score and data_score['predictions_score'] is not None:
            date = data_score['date']
            predictions = data_score['predictions_score']

            # Crear el DataFrame de las predicciones
            df = pd.DataFrame({
                'date': [date] * len(predictions),  # Repetir la misma fecha para todas las predicciones
                'predictions_score': predictions
            })

            # Concatenar con el DataFrame de etiquetas
            concatenated_df = pd.concat([data_labels, df], axis=1)

            # Guardar el DataFrame concatenado en PostgreSQL
            message, status_code = save_to_postgres(concatenated_df)
            return jsonify({'message': message}), status_code
        else:
            return jsonify({'message': "La clave 'predictions_score' está ausente o tiene un valor None."}), 500

    except Exception as e:
        return jsonify({'message': f"Error: {e}"}), 500
    
    
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
