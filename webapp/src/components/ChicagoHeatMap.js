import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import '../styles/ChicagoHeatMap.css';

const ChoroplethMap = () => {
    const [topoData, setTopoData] = useState(null); // Datos del mapa base
    const [inspectionData, setInspectionData] = useState(null); // Datos agregados por ZIP
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const svgRef = useRef(null); // Referencia al SVG del mapa

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Cargar el mapa base
                const topoResponse = await d3.json('/utils/chicago.json');
                setTopoData(topoResponse);

                // Cargar datos agregados desde el backend
                const response = await axios.get('/api/heatmap'); // Endpoint del backend con datos agregados por ZIP
                setInspectionData(response.data);

                setLoading(false);
            } catch (err) {
                setError('Error al obtener los datos del servidor.');
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        if (topoData && inspectionData) {
            renderChoropleth();
        }
    }, [topoData, inspectionData]);

    const renderChoropleth = () => {
        const width = 800;
        const height = 600;
        const svg = d3.select(svgRef.current);

        // Limpiar contenido previo
        svg.selectAll('*').remove();

        // Crear proyección para Chicago
        const projection = d3.geoMercator()
            .center([-87.6298, 41.8781])
            .scale(50000)
            .translate([width / 2, height / 2]);

        const path = d3.geoPath().projection(projection);

        // Validar datos de inspección
        const inspectionValues = Object.values(inspectionData || {});
        if (inspectionValues.length === 0) {
            console.error('No hay datos de inspección disponibles.');
            return;
        }

        // Escala de colores para el choropleth
        const maxInspections = d3.max(inspectionValues, d => (typeof d?.total_inspections === 'number' ? d.total_inspections : 0));
        const colorScale = d3.scaleSequential(d3.interpolateBlues).domain([0, maxInspections || 1]);

        // Extraer ZIP codes del TopoJSON
        const zipcodes = topojson.feature(topoData, topoData.objects.zipcodes);

        // Dibujar el mapa
        svg.selectAll('path')
            .data(zipcodes.features)
            .enter()
            .append('path')
            .attr('d', path)
            .attr('fill', d => {
                const zip = d.properties.ZIP;
                const data = inspectionData[zip];
                const totalInspections = typeof data?.total_inspections === 'number' ? data.total_inspections : 0;
                return colorScale(totalInspections);
            })
            .attr('stroke', '#333')
            .attr('stroke-width', 0.5)
            .on('mouseover', (event, d) => {
                const zip = d.properties.ZIP;
                const data = inspectionData[zip] || {};
                const tooltipData = `
                    <strong>ZIP: ${zip}</strong><br/>
                    Total Inspections: ${data.total_inspections || 'N/A'}<br/>
                    Passed: ${data.passed_inspections || 'N/A'}<br/>
                    Failed: ${data.failed_inspections || 'N/A'}
                `;
                showTooltip(event.pageX, event.pageY, tooltipData);
            })
            .on('mouseout', hideTooltip);

        // Tooltip
        const tooltip = d3.select('#tooltip');
        const showTooltip = (x, y, content) => {
            tooltip.style('left', `${x + 10}px`)
                .style('top', `${y + 10}px`)
                .style('display', 'block')
                .html(content);
        };
        const hideTooltip = () => {
            tooltip.style('display', 'none');
        };
    };

    if (loading) return <div className="choropleth-map">Cargando datos...</div>;
    if (error) return <div className="choropleth-map error">{error}</div>;

    return (
        <div className="choropleth-map">
            <h2>Mapa Coroplético de Inspecciones en Chicago</h2>
            <svg ref={svgRef} width={800} height={600}></svg>
            <div id="tooltip" className="tooltip"></div>
        </div>
    );
};

export default ChoroplethMap;
