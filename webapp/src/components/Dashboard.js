import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Loader from './Loader'; // Componente para mostrar carga
import KPIContainer from './KPIContainer'; // Contenedor de KPIs
import ChicagoMap from './ChicagoMap'; // Mapa con puntos de inspección
import ChicagoHeatMap from './ChicagoHeatMap'; // Mapa de calor
import '../styles/Dashboard.css'; // Estilos específicos para el dashboard

const Dashboard = () => {
    const [kpis, setKpis] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [topoData, setTopoData] = useState(null); // Almacenar el TopoJSON
    const [inspectionLocations, setInspectionLocations] = useState([]); // Ubicaciones de inspecciones
    const [heatmapData, setHeatmapData] = useState([]); // Datos para el mapa de calor

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Cargar KPIs desde el backend
                const kpisResponse = await axios.get('/api/kpis');
                setKpis(kpisResponse.data);

                // Cargar el archivo TopoJSON para el mapa
                const topoResponse = await axios.get('/utils/chicago.json');
                setTopoData(topoResponse.data);

                // Extraer ubicaciones de inspección
                if (kpisResponse.data?.inspection_locations) {
                    setInspectionLocations(kpisResponse.data.inspection_locations);
                }

                // Cargar datos para el mapa de calor
                const heatmapResponse = await axios.get('/api/heatmap');
                setHeatmapData(heatmapResponse.data.inspection_locations);
            } catch (err) {
                console.error('Error al obtener los datos:', err);
                setError('Error al obtener los datos del servidor o el mapa.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) return <Loader />;
    if (error) return <div className="dashboard error">{error}</div>;

    return (
        <div className="dashboard">
            <h2>Dashboard de KPIs - Mes Corriente</h2>

            {/* Contenedor de KPIs */}
            {kpis && <KPIContainer kpis={kpis} />}

            {/* Mapas */}
            <div className="dashboard-maps">
                {Array.isArray(inspectionLocations) && inspectionLocations.length > 0 && (
                    <div className="map-container">
                        <h3>Mapa de Inspecciones en Chicago</h3>
                        <ChicagoMap topoData={topoData} inspectionLocations={inspectionLocations} />
                    </div>
                )}

                {Array.isArray(heatmapData) && heatmapData.length > 0 && (
                    <div className="map-container">
                        <h3>Mapa de Calor de Inspecciones</h3>
                        <ChicagoHeatMap topoData={topoData} backendData={{ inspection_locations: heatmapData }} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
