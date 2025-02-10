from flask import Flask, jsonify, request
import pandas as pd
import boto3
import os
from io import BytesIO
import psycopg2
from datetime import datetime


ACCESS_KEY_ID=os.getenv('AWS_ACCESS_KEY_ID')
SECRET_ACCESS_KEY=os.getenv('AWS_SECRET_ACCESS_KEY')
HOST = os.getenv('RELATIONAL_DATABASE_HOST')
DATABASE = os.getenv('DATABASE')
USER = os.getenv('USER_DATABASE')
PASSWORD = os.getenv('DATABASE_PASSWORD')
# Build paths inside the project like this: BASE_DIR / '
app = Flask(__name__)


def load_pkl_from_s3():
    try:
        s3_client = boto3.client(
            's3',
            aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
            aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY')
        )
        
        obj = s3_client.get_object(Bucket=os.getenv('S3_BUCKET_NAME'), Key='results/predictions_label.pkl')
        pkl_data = obj['Body'].read()
        
        data = pickle.loads(pkl_data)  # Cargar el diccionario
        
        print(f"Tipo de datos cargado: {type(data)}")  # Depuración
        
        if isinstance(data, dict) and 'predictions_score' in data:
            df = pd.DataFrame({'predictions_score': data['predictions_score']})
            return df  # Convertir a DataFrame antes de regresarlo
        elif isinstance(data, pd.DataFrame):
            return data
        else:
            print(f"Error: Tipo inesperado {type(data)} en el archivo .pkl")
            return None
    except Exception as e:
        print(f"Error loading .pkl file from S3: {e}")
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


# Endpoint /prediction_id
@app.route('/prediction_id/<int:id>', methods=['GET'])
def get_prediction_by_id(id):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('SELECT prediction_value, prediction_date FROM predictions WHERE inspection_id = %s ORDER BY prediction_date DESC LIMIT 1', (id,))
    result = cur.fetchone()
    cur.close()
    conn.close()
    
    if result:
        prediction = {
            'inspection_id': id,
            'prediction_value': result[0],
            'prediction_date': result[1].strftime('%Y-%m-%d')
        }
        return jsonify(prediction), 200
    else:
        return jsonify({'error': 'Prediction not found'}), 404

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
    cur.execute('SELECT inspection_id, prediction_value FROM predictions WHERE prediction_date = %s', (date,))
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

# Endpoint /eda
@app.route('/eda', methods=['GET'])
def get_eda():
    try:
        # Cargar el archivo pkl desde S3 y transformarlo en DataFrame
        df = load_pkl_from_s3()
        
        if df is None:
            return jsonify({'error': 'Failed to load .pkl file from S3'}), 500
        
        # Realizar el análisis exploratorio básico
        eda=df.head()
        return jsonify(eda), 200
    except Exception as e:
        return jsonify({'error': f'Failed to process the .pkl file: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True)
