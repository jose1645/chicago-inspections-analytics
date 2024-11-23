import React, { useEffect, useState } from 'react';
import axios from 'axios';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import '../styles/Dashboard.css';
import ChicagoMap from './ChicagoMap';

const Dashboard = () => {
    const [kpis, setKpis] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [topoData, setTopoData] = useState(null); // Almacenar el TopoJSON
    const [inspectionLocations, setInspectionLocations] = useState([]); // Ubicaciones de inspecciones

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Cargar KPIs desde el backend
                const response = await axios.get('/api/kpis');
                setKpis(response.data);

                // Cargar el archivo TopoJSON desde utils/chicago.jsona
                const topoResponse = await d3.json('/utils/chicago.json');
                setTopoData(topoResponse);

                // Extraer ubicaciones de inspección
                setInspectionLocations(response.data.inspection_locations);
            } catch (err) {
                setError('Error al obtener los datos del servidor o el mapa.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) return <div className="dashboard">Cargando datos...</div>;
    if (error) return <div className="dashboard error">{error}</div>;

    return (
        <div className="dashboard">
            <h2>Dashboard de KPIs</h2>
            <div className="dashboard-charts">
                {/* KPIs */}
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

                {/* Mapa sin filtro dinámico */}
                <div className="chart">
                    <h3>Mapa de Inspecciones en Chicago</h3>
                    <ChicagoMap topoData={topoData} inspectionLocations={inspectionLocations} />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;

