// src/components/Dashboard.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../styles/Dashboard.css';

const Dashboard = () => {
    const [kpis, setKpis] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchKPIs = async () => {
            try {
                const response = await axios.get('/api/kpis'); // Automáticamente dirigido al backend a través de NGINX
                setKpis(response.data);
            } catch (err) {
                setError('Error al obtener los datos del servidor.');
            } finally {
                setLoading(false);
            }
        };

        fetchKPIs();
    }, []);

    if (loading) return <div className="dashboard">Cargando datos...</div>;
    if (error) return <div className="dashboard error">{error}</div>;

    return (
        <div className="dashboard">
            <h2>Dashboard de KPIs</h2>
            <div className="dashboard-charts">
                <div className="chart">
                    <h3>Total de Inspecciones</h3>
                    <p>{kpis.total_inspections}</p>
                </div>
                <div className="chart">
                    <h3>Inspecciones Aprobadas</h3>
                    <p>{kpis.passed_inspections}</p>
                </div>
                <div className="chart">
                    <h3>Inspecciones Rechazadas</h3>
                    <p>{kpis.failed_inspections}</p>
                </div>
                <div className="chart">
                    <h3>Inspecciones por Mes</h3>
                    <ul>
                        {Object.entries(kpis.inspections_by_month).map(([month, count]) => (
                            <li key={month}>
                                Mes {month}: {count} inspecciones
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="chart">
                    <h3>Distribución de Riesgo</h3>
                    <ul>
                        {Object.entries(kpis.risk_distribution).map(([risk, count]) => (
                            <li key={risk}>
                                {risk}: {count} inspecciones
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
