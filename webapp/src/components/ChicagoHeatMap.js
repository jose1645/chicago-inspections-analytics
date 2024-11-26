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
    const [error, setError] = useState(null);
    const svgRef = useRef(null); // Referencia al SVG del mapa
    const projectionRef = useRef(null); // Referencia para la proyección

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);

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
                    const response = await axios.get(`/api/heatmap?page=${currentPage}`);
                    const data = response.data;

                    // Extraer y renderizar ubicaciones
                    const locations = data.results.inspection_locations;
                    renderInspectionPoints(locations);

                    // Extraer el año y mes del lote más reciente
                    const latestInspection = locations[locations.length - 1];
                    if (latestInspection && latestInspection.inspection_date) {
                        const date = new Date(latestInspection.inspection_date);
                        const yearMonth = date.toLocaleString('default', { year: 'numeric', month: 'long' });
                        setCurrentYearMonth(yearMonth);
                    }

                    // Actualizar progreso
                    setTotalLoaded((prev) => prev + locations.length);
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
            <p>Total de inspecciones cargadas: {totalLoaded}</p>
            <p>Último lote de datos cargados: {currentYearMonth}</p>
            <div id="map-container">
                <svg ref={svgRef} id="heatmap-svg" width={800} height={600}></svg>
            </div>
        </div>
    );
};

export default HeatMap;
