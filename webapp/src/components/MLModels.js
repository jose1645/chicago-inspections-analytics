// src/components/MLModels.js
import React from 'react';
import '../styles/MLModels.css';

const MLModels = () => (
    <div className="mlmodels">
        <h2>Modelos de Machine Learning</h2>
        <p>Explicación de los modelos y su rendimiento en la predicción...</p>

        {/* Mostrar Notebook como HTML */}
        <div className="notebook-container">
            <iframe
                src="/notebooks/Investigar_correlaciones_con_results.html" // Cambia la ruta al archivo HTML de tu notebook
                title="Notebook de Modelos"
                style={{
                    width: '100%',
                    height: '600px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    overflow: 'hidden',
                }}
            ></iframe>
        </div>
    </div>
);

export default MLModels;
