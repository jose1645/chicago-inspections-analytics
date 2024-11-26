import React, { useEffect, useState } from 'react';
import axios from 'axios';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import '../styles/ChicagoHeatMap.css';

const HeatMap = () => {
    const [topoData, setTopoData] = useState(null); // Datos del mapa base
    const [inspectionLocations, setInspectionLocations] = useState([]); // Acumulación de ubicaciones de inspecciones
    const [loading, setLoading] = useState(true);
    const [progress, setProgress] = useState(0); // Progreso global de carga
    const [currentYearMonth, setCurrentYearMonth] = useState(''); // Año/mes del lote más reciente
    const [totalLoaded, setTotalLoaded] = useState(0); // Cantidad de datos acumulados
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);

            try {
                const topoResponse = await d3.json('/utils/chicago.json');
                setTopoData(topoResponse);

                // Lógica para cargar y acumular datos del backend
                let currentPage = 1;
                let moreData = true;

                while (moreData) {
                    const response = await axios.get(`/api/heatmap?page=${currentPage}`);
                    const data = response.data;

                    // Actualizar ubicaciones acumuladas
                    setInspectionLocations((prev) => [...prev, ...data.results.inspection_locations]);

                    // Extraer el año y mes del lote más reciente
                    const latestInspection = data.results.inspection_locations[data.results.inspection_locations.length - 1];
                    if (latestInspection && latestInspection.inspection_date) {
                        const date = new Date(latestInspection.inspection_date);
                        const yearMonth = date.toLocaleString('default', { year: 'numeric', month: 'long' });
                        setCurrentYearMonth(yearMonth);
                    }

                    // Actualizar progreso
                    setTotalLoaded((prev) => prev + data.results.inspection_locations.length);
                    setProgress((prev) => (totalLoaded / data.count) * 100);

                    // Verificar si hay más datos
                    moreData = !!data.next; // Si `data.next` es nulo, no hay más datos
                    currentPage += 1;
                }
            } catch (err) {
                setError('Error al obtener los datos del servidor.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="heatmap">
                <h2>Cargando...</h2>
                <div className="progress-bar">
                    <div className="progress" style={{ width: `${progress}%` }}>
                        {Math.round(progress)}%
                    </div>
                </div>
                <p>Datos cargados: {totalLoaded}</p>
                <p>Cargando datos para: {currentYearMonth || 'Calculando...'}</p>
            </div>
        );
    }

    if (error) return <div className="heatmap error">{error}</div>;

    return (
        <div className="heatmap">
            <h2>Mapa de Calor de Inspecciones en Chicago</h2>
            <p>Total de inspecciones cargadas: {inspectionLocations.length}</p>
            <p>Último lote de datos cargados: {currentYearMonth}</p>
            <div id="map-container">
                {topoData && (
                    <svg id="heatmap-svg" width={800} height={600}>
                        {/* Renderizar mapa base */}
                        {topojson.feature(topoData, topoData.objects.zipcodes).features.map((feature, i) => (
                            <path
                                key={i}
                                d={d3.geoPath()(feature)}
                                fill="#e8e8e8"
                                stroke="#333"
                                strokeWidth={0.5}
                            />
                        ))}

                        {/* Renderizar puntos acumulados */}
                        {inspectionLocations.map((location, i) => {
                            const [x, y] = d3.geoMercator()
                                .center([-87.6298, 41.8781])
                                .scale(50000)
                                .translate([400, 300])([location.longitude, location.latitude]);

                            return (
                                <circle
                                    key={i}
                                    cx={x}
                                    cy={y}
                                    r={5}
                                    fill={location.results === "Pass" ? "green" : location.results === "Fail" ? "red" : "orange"}
                                    opacity={0.8}
                                >
                                    <title>
                                        {location.facility_name} ({location.results}) - {location.inspection_date}
                                    </title>
                                </circle>
                            );
                        })}
                    </svg>
                )}
            </div>
        </div>
    );
};

export default HeatMap;
