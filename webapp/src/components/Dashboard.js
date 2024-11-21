// src/components/Dashboard.js
import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import '../styles/Dashboard.css';
import ChicagoMap from './ChicagoMap';

const Dashboard = () => {
    const [kpis, setKpis] = useState(null); // KPIs principales
    const [loading, setLoading] = useState(true); // Indicador de carga
    const [error, setError] = useState(null); // Manejo de errores
    const [topoData, setTopoData] = useState(null); // TopoJSON de Chicago
    const [inspectionLocations, setInspectionLocations] = useState([]); // Ubicaciones de inspecciones
    const [nextPage, setNextPage] = useState('/api/kpis?page=1'); // Siguiente página para inspecciones
    const [loadingMore, setLoadingMore] = useState(false); // Indicador de carga para más ubicaciones

    // Cargar KPIs y TopoJSON al inicio
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Cargar KPIs desde el backend
                const response = await axios.get('/api/kpis');
                setKpis(response.data);

                // Cargar el archivo TopoJSON desde utils/chicago.json
                const topoResponse = await d3.json('/utils/chicago.json');
                setTopoData(topoResponse);

                // Extraer las ubicaciones iniciales
                setInspectionLocations(response.data.inspection_locations);
                setNextPage(response.data.next); // Configurar el enlace a la siguiente página
            } catch (err) {
                setError('Error al obtener los datos del servidor o el mapa.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Función para cargar más ubicaciones de inspecciones
    const loadMoreLocations = useCallback(async () => {
        if (!nextPage || loadingMore) return;

        setLoadingMore(true);
        try {
            const response = await axios.get(nextPage);
            setInspectionLocations(prev => [...prev, ...response.data.inspection_locations]);
            setNextPage(response.data.next); // Actualiza el enlace a la siguiente página
        } catch (err) {
            console.error('Error al cargar más ubicaciones:', err);
        } finally {
            setLoadingMore(false);
        }
    }, [nextPage, loadingMore]);

    // Configurar scroll infinito para cargar más ubicaciones
    useEffect(() => {
        const handleScroll = () => {
            if (
                window.innerHeight + document.documentElement.scrollTop
                >= document.documentElement.offsetHeight - 200
            ) {
                loadMoreLocations();
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [loadMoreLocations]);

    if (loading) return <div className="dashboard">Cargando datos...</div>;
    if (error) return <div className="dashboard error">{error}</div>;

    return (
        <div className="dashboard">
            <h2>Dashboard de KPIs</h2>
            <div className="dashboard-charts">
                <div className="chart">
                    <h3>Total de Inspecciones</h3>
                    <p>{kpis?.total_inspections || 'N/A'}</p>
                </div>
                <div className="chart">
                    <h3>Inspecciones Aprobadas</h3>
                    <p>{kpis?.passed_inspections || 'N/A'}</p>
                </div>
                <div className="chart">
                    <h3>Inspecciones Rechazadas</h3>
                    <p>{kpis?.failed_inspections || 'N/A'}</p>
                </div>
                <div className="chart">
                    <h3>Inspecciones por Mes</h3>
                    <ul>
                        {kpis?.inspections_by_month &&
                            Object.entries(kpis.inspections_by_month).map(([month, count]) => (
                                <li key={month}>
                                    Mes {month}: {count} inspecciones
                                </li>
                            ))}
                    </ul>
                </div>

                <div className="chart">
                    <h3>Distribución de Riesgo</h3>
                    <ul>
                        {kpis?.risk_distribution &&
                            Object.entries(kpis.risk_distribution).map(([risk, count]) => (
                                <li key={risk}>
                                    {risk}: {count} inspecciones
                                </li>
                            ))}
                    </ul>
                </div>
                <div className="chart">
                    <h3>Mapa de Inspecciones en Chicago</h3>
                    <ChicagoMap topoData={topoData} inspectionLocations={inspectionLocations} />
                    {loadingMore && <p>Cargando más ubicaciones...</p>}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
