import React from 'react';
import '../styles/MainCard.css';

const MainCard = ({ totalInspections, passedInspections, failedInspections }) => {
    return (
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
    );
};

export default MainCard;
