// src/components/Dashboard.js
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
    const [filterResult, setFilterResult] = useState("Pass"); // Filtro dinámico por resultado

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Cargar KPIs desde el backend
                const response = await axios.get('/api/kpis');
                setKpis(response.data);

                // Cargar el archivo TopoJSON desde utils/chicago.json
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

    // Aplicar filtro dinámico a las ubicaciones
    const filteredLocations = inspectionLocations.filter(location => location.results === filterResult);

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

                {/* Mapa con filtro dinámico */}
                <div className="chart">
                    <h3>Mapa de Inspecciones en Chicago</h3>
                    <div style={{ marginBottom: '10px' }}>
                        <label htmlFor="filter-result">Filtrar por resultado: </label>
                        <select
                            id="filter-result"
                            value={filterResult}
                            onChange={(e) => setFilterResult(e.target.value)}
                        >
                            <option value="Pass">Aprobadas</option>
                            <option value="Fail">Rechazadas</option>
                            <option value="Pass w/ Conditions">Aprobadas con condiciones</option>
                        </select>
                    </div>
                    <ChicagoMap topoData={topoData} inspectionLocations={filteredLocations} />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
