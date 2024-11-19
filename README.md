
# Chicago Food Data Analytics

![Project Logo](https://example.com/logo.png)

## Descripción

Este proyecto tiene como objetivo analizar datos de inspecciones de alimentos en la ciudad de Chicago. Utilizamos un enfoque de Ciencia de Datos para procesar, limpiar y visualizar datos clave relacionados con la seguridad alimentaria.

La aplicación está diseñada para ser una **SPA (Single Page Application)**, utilizando **React** para la interfaz, **Django** como backend y **AWS** para la infraestructura.

---

## Tabla de Contenidos

- [Descripción](#descripción)
- [Características](#características)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Configuración](#configuración)
- [Tecnologías Utilizadas](#tecnologías-utilizadas)
- [Contribuciones](#contribuciones)
- [Licencia](#licencia)

---

## Características

- **Ingesta de Datos Automatizada**:
  - Ingesta inicial de hasta 300,000 registros.
  - Ingestas consecutivas automatizadas mediante cron.
- **Limpieza de Datos**:
  - Archivos clasificados como `sucios` y `limpios`.
  - Validación para evitar procesos duplicados.
- **Dashboard de KPIs**:
  - Visualizaciones interactivas utilizando **React** y **D3.js**.
- **Infraestructura AWS**:
  - Datos almacenados en S3.
  - Procesamiento en una instancia EC2.
- **Subdominio**:
  - Implementado en `chicago-inspections-analytics.synteck.org`.

---

## Estructura del Proyecto

```
root/
├── backend/         # Código Django
├── webapp/          # Frontend React
├── scripts/         # Scripts de ingesta y limpieza
├── Dockerfile       # Configuración Docker
├── docker-compose.yml (opcional)
├── README.md        # Este archivo
```

---

## Configuración

### Requisitos Previos

- **Docker**
- **Python 3.10+**
- **Node.js**

### Instalación

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/synteck428/chicago-food-data.git
   cd chicago-food-data
   ```

2. Construir los contenedores:
   ```bash
   docker-compose up --build
   ```

3. Acceder a la aplicación:
   - Frontend: `http://localhost:3000`
   - Backend: `http://localhost:8000`

4. Configurar las credenciales de AWS:
   - Agregar un archivo `.env` con tus credenciales de AWS:
     ```env
     AWS_ACCESS_KEY_ID=your_access_key
     AWS_SECRET_ACCESS_KEY=your_secret_key
     S3_BUCKET_NAME=chicago-inspections-analytics
     ```

---

## Tecnologías Utilizadas

- **Backend**:
  - Django + Django REST Framework
- **Frontend**:
  - React + D3.js
- **Infraestructura**:
  - AWS S3, EC2
- **Base de Datos**:
  - Amazon RDS (PostgreSQL)

---

## Notebooks

Los notebooks en este proyecto son utilizados para realizar análisis exploratorios de datos (EDA) y desarrollar modelos de machine learning. Todos los notebooks se encuentran en el directorio `notebooks/`.

### Lista de Notebooks

1. **`eda.ipynb`**: Exploración inicial de los datos y generación de visualizaciones descriptivas.
2. **`data_cleaning.ipynb`**: Desarrollo y pruebas de rutinas de limpieza de datos.
3. **`ml_model.ipynb`**: Entrenamiento y validación de modelos de machine learning.


---

## Contribuciones

¡Las contribuciones son bienvenidas! Por favor, abre un *issue* o envía un *pull request* con tus propuestas.

---

## Licencia

Este proyecto está bajo la Licencia MIT. Consulta el archivo [LICENSE](./LICENSE) para más detalles.
