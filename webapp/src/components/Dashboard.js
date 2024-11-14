// src/components/Dashboard.js
import React from 'react';
import '../styles/Dashboard.css';

const Dashboard = () => (
    <div className="dashboard">
        <h2>Dashboard de KPIs</h2>
        <div className="dashboard-charts">
            <div className="chart-placeholder">[Gráfico de Tasa de Fallos]</div>
            <div className="chart-placeholder">[Gráfico de Cumplimiento en el Tiempo]</div>
            {/* Agrega más contenedores de gráficos según los KPIs */}
        </div>
    </div>
);

export default Dashboard;
