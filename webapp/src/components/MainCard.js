import React, { useState } from 'react';
import '../styles/MainCard.css';

const MainCard = ({ totalInspections, passedInspections, failedInspections, inspectionsByMonth, riskDistribution }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div 
            className="main-card-container" 
            onMouseEnter={() => setIsHovered(true)} 
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Tarjeta principal */}
            <div className="main-card">
                <h2>Resumen de Inspecciones</h2>
                <div className="main-card-content">
                    <div className="main-card-item">
                        <h3>Total de Inspecciones</h3>
                        <p>{totalInspections}</p>
                    </div>
                    <div className="main-card-item">
                        <h3>Inspecciones Aprobadas</h3>
                        <p>{passedInspections}</p>
                    </div>
                    <div className="main-card-item">
                        <h3>Inspecciones Rechazadas</h3>
                        <p>{failedInspections}</p>
                    </div>
                </div>
            </div>

            {/* Tarjeta secundaria (visible al hover) */}
            <div className={`secondary-card ${isHovered ? 'expanded' : ''}`}>
                <h3>Detalles Adicionales</h3>
                <div className="secondary-card-content">
                    <div className="secondary-card-section">
                        <h4>Inspecciones por Mes</h4>
                        <ul>
                            {Object.entries(inspectionsByMonth).map(([month, count]) => (
                                <li key={month}>
                                    Mes {month}: {count} inspecciones
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="secondary-card-section">
                        <h4>Distribución de Riesgo</h4>
                        <ul>
                            {Object.entries(riskDistribution).map(([risk, count]) => (
                                <li key={risk}>
                                    {risk}: {count} inspecciones
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MainCard;
