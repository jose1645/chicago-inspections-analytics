import pandas as pd
import numpy as np
import pickle
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, roc_auc_score
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.layers import Dropout, LeakyReLU, BatchNormalization
from tensorflow.keras.callbacks import EarlyStopping
from tensorflow.keras.layers import Dropout, LeakyReLU
import boto3
import pickle
from dotenv import load_dotenv
import os
load_dotenv()

def load(bucket_name, model_path):
    s3_client = boto3.client(
        's3',
        aws_access_key_id=os.getenv('NOTEBOOK_ACCESS_KEY'),
        aws_secret_access_key=os.getenv('NOTEBOOK_ACCESS_KEY_SECRET')
    )   
    response = s3_client.get_object(Bucket=bucket_name, Key=model_path)
    model = pickle.loads(response['Body'].read())
    return model





bucket_name="chicago-inspections-analytics"
model_path="selected-model/select_model.pkl"
test_dataset_path="dataset/test/test_dataset.pkl"
test_target_path="dataset/test/test_target.pkl"
train_dataset_path='dataset/train/train_dataset.pkl'
train_target_path='dataset/train/train_target.pkl'
model=load(bucket_name, model_path)# Carga el modelo desde S3.
test_dataset=load(bucket_name,test_dataset_path)
test_target=load(bucket_name,test_target_path)



def train_evaluate_nn_v3(X_train, X_test, y_train, y_test, normalize=False):
    if normalize:
        scaler = StandardScaler()
        X_train = scaler.fit_transform(X_train)
        X_test = scaler.transform(X_test)

    model = Sequential()

    model.add(Dense(128, input_dim=X_train.shape[1]))
    model.add(BatchNormalization())  # 🔹 Normalización por lotes
    model.add(LeakyReLU(alpha=0.1))
    model.add(Dropout(0.3))

    model.add(Dense(64))
    model.add(BatchNormalization())  # 🔹 Normalización por lotes
    model.add(LeakyReLU(alpha=0.1))
    model.add(Dropout(0.3))

    model.add(Dense(32))
    model.add(BatchNormalization())  # 🔹 Normalización por lotes
    model.add(LeakyReLU(alpha=0.1))
    model.add(Dropout(0.3))

    model.add(Dense(1, activation='sigmoid'))

    model.compile(optimizer=Adam(learning_rate=0.0005),  # 🔹 Learning Rate más bajo
                  loss='binary_crossentropy',
                  metrics=['accuracy'])

    early_stopping = EarlyStopping(monitor='val_loss', patience=5, restore_best_weights=True)

    model.fit(X_train, y_train, epochs=30, batch_size=32, verbose=1, validation_split=0.2, callbacks=[early_stopping])

    y_pred = (model.predict(X_test) > 0.5).astype("int32")
    y_prob = model.predict(X_test)

    accuracy = accuracy_score(y_test, y_pred)
    auc = roc_auc_score(y_test, y_prob)

    return accuracy, auc

# Evaluación con el modelo mejorado

# 📌 Evaluación sin normalización
X_train = load(bucket_name, train_dataset_path)  # Carga el dataset desde S3.
y_train = load(bucket_name, train_target_path)  # Carga el target desde S3.
X_test = load(bucket_name, test_dataset_path)  # Carga el dataset de prueba desde S3.
y_test = load(bucket_name, test_target_path)  # Carga el target de prueba desde S3.

# Reemplazar 'pass' por 1 y 'fail' por 0, y convertir el tipo de datos a entero
y_train = y_train.replace({'pass': 1, 'fail': 0}).astype(int)
y_test = y_test.replace({'pass': 1, 'fail': 0}).astype(int)


# Codificar las columnas categóricas a valores numéricos utilizando One-Hot Encoding
categorical_columns = [
    'facility_type__facility_type_BANQUET HALL', 'facility_type__facility_type_Bakery', 
    'facility_type__facility_type_Catering', 'facility_type__facility_type_Children\'s Services Facility', 
    'facility_type__facility_type_GAS STATION', 'facility_type__facility_type_Golden Diner',
    'facility_type__facility_type_Grocery Store', 'facility_type__facility_type_Hospital', 
    'facility_type__facility_type_Liquor', 'facility_type__facility_type_Long Term Care', 
    'facility_type__facility_type_School', 'facility_type__facility_type_Shared Kitchen', 
    'facility_type__facility_type_Shared Kitchen User (Long Term)', 'facility_type__facility_type_Special Event', 
    'facility_type__facility_type_TAVERN', 'facility_type__facility_type_Wholesale', 
    'facility_type__facility_type_daycare', 'facility_type__facility_type_mobile food', 
    'facility_type__facility_type_other', 'facility_type__facility_type_restaurant',
    'risk__risk_all', 'risk__risk_high', 'risk__risk_low', 'risk__risk_medium', 
    'remainder__week_of_year', 'remainder__week_day', 'remainder__day_of_week'
]


for col in categorical_columns:
    X_train[col] = X_train[col].astype('int64')
    X_test[col] = X_test[col].astype('int64')

# Verificar si las dimensiones de X_train y X_test coinciden después de One-Hot Encoding
X_train, X_test = X_train.align(X_test, join='left', axis=1)

# Convertir las columnas numéricas a tipo adecuado (int64, float64)
X_train['remainder__latitude'] = pd.to_numeric(X_train['remainder__latitude'], errors='coerce')
X_train['remainder__longitude'] = pd.to_numeric(X_train['remainder__longitude'], errors='coerce')
X_test['remainder__latitude'] = pd.to_numeric(X_test['remainder__latitude'], errors='coerce')
X_test['remainder__longitude'] = pd.to_numeric(X_test['remainder__longitude'], errors='coerce')

# Asegurarse de que no hay valores faltantes
X_train = X_train.fillna(0)
X_test = X_test.fillna(0)

# Convertir las columnas numéricas a tipo int64
columns_to_convert = ['remainder__month', 'remainder__year', 'remainder__day_of_month', 'remainder__weekend']

for col in columns_to_convert:
    X_train[col] = X_train[col].astype('int64')
    X_test[col] = X_test[col].astype('int64')

# Verificar las primeras filas para asegurarse de que todo esté bien
print(X_train.dtypes)
print(X_test.dtypes)
print(y_train.dtypes)
print(y_test.dtypes)


accuracy_no_norm_v2, auc_no_norm_v2 = train_evaluate_nn_v3(X_train, X_test, y_train, y_test)
accuracy_norm_v2, auc_norm_v2 = train_evaluate_nn_v3(X_train, X_test, y_train, y_test)

# 📊 Comparativa de resultados
print("🔹 Sin Normalización:")
print(f"   - Precisión: {accuracy_no_norm_v2:.4f}")
print(f"   - AUC: {auc_no_norm_v2:.4f}")

print("\n🔹 Con Normalización:")
print(f"   - Precisión: {accuracy_norm_v2:.4f}")
print(f"   - AUC: {auc_norm_v2:.4f}")
