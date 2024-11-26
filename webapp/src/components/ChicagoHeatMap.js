import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import '../styles/ChicagoHeatMap.css';

const HeatMap = () => {
    const [topoData, setTopoData] = useState(null); // Datos del mapa base
    const [loading, setLoading] = useState(true);
    const [progress, setProgress] = useState(0); // Progreso global de carga
    const [currentYearMonth, setCurrentYearMonth] = useState(''); // Año/mes del lote más reciente
    const [totalLoaded, setTotalLoaded] = useState(0); // Cantidad de datos acumulados
    const [estimatedTimeLeft, setEstimatedTimeLeft] = useState(null); // Tiempo estimado restante
    const [error, setError] = useState(null);
    const svgRef = useRef(null); // Referencia al SVG del mapa
    const projectionRef = useRef(null); // Referencia para la proyección

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const startTime = Date.now(); // Tiempo de inicio
            let totalPages = 0; // Contador de páginas procesadas
            let timeSpent = 0; // Tiempo acumulado

            try {
                // Cargar el mapa base
                const topoResponse = await d3.json('/utils/chicago.json');
                setTopoData(topoResponse);

                // Crear proyección para Chicago
                const projection = d3.geoMercator()
                    .center([-87.6298, 41.8781])
                    .scale(50000)
                    .translate([400, 300]);
                projectionRef.current = projection;

                // Dibujar mapa base
                const svg = d3.select(svgRef.current);
                const zipcodes = topojson.feature(topoResponse, topoResponse.objects.zipcodes);
                svg.selectAll('path')
                    .data(zipcodes.features)
                    .enter()
                    .append('path')
                    .attr('d', d3.geoPath().projection(projection))
                    .attr('fill', '#e8e8e8')
                    .attr('stroke', '#333')
                    .attr('stroke-width', 0.5);

                // Lógica para cargar y acumular datos del backend
                let currentPage = 1;
                let moreData = true;

                while (moreData) {
                    const pageStartTime = Date.now(); // Tiempo de inicio de la página
                    const response = await axios.get(`/api/heatmap?page=${currentPage}`);
                    const data = response.data;

                    // Renderizar puntos de inspección para el lote actual
                    renderInspectionPoints(data.results.inspection_locations);

                    // Actualizar indicadores de progreso
                    const batchTime = (Date.now() - pageStartTime) / 1000; // Tiempo por lote en segundos
                    timeSpent += batchTime;
                    totalPages += 1;

                    // Estimar tiempo restante
                    const remainingPages = Math.ceil(data.count / data.results.inspection_locations.length) - totalPages;
                    const estimatedRemainingTime = (timeSpent / totalPages) * remainingPages;
                    setEstimatedTimeLeft(estimatedRemainingTime);

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

    const renderInspectionPoints = (locations) => {
        // Renderizar puntos de inspección incrementales
        const svg = d3.select(svgRef.current);
        const projection = projectionRef.current;

        svg.selectAll('circle')
            .data(locations)
            .enter()
            .append('circle')
            .attr('cx', d => projection([d.longitude, d.latitude])[0])
            .attr('cy', d => projection([d.longitude, d.latitude])[1])
            .attr('r', 5)
            .attr('fill', d => (d.results === "Pass" ? "green" : d.results === "Fail" ? "red" : "orange"))
            .attr('opacity', 0.8)
            .append('title')
            .text(d => `${d.facility_name} (${d.results}) - ${d.inspection_date}`);
    };

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.round(seconds % 60);
        return `${minutes}m ${remainingSeconds}s`;
    };

    return (
        <div className="heatmap">
            <h2>Mapa de Calor de Inspecciones en Chicago</h2>
            <div className="progress-bar">
                <div className="progress" style={{ width: `${progress}%` }}>
                    {Math.round(progress)}%
                </div>
            </div>
            <p>Datos cargados: {totalLoaded}</p>
            <p>Cargando datos para: {currentYearMonth || 'Calculando...'}</p>
            {estimatedTimeLeft !== null && (
                <p>Tiempo estimado restante: {formatTime(estimatedTimeLeft)}</p>
            )}
            {error && <p className="error">{error}</p>}
            <svg ref={svgRef} id="heatmap-svg" width={800} height={600}></svg>
        </div>
    );
};

export default HeatMap;
