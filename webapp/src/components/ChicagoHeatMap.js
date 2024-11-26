import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import '../styles/ChicagoMap.css';

const ChicagoHeatMap = ({ topoData, backendData }) => {
    const mapRef = useRef(null);

    useEffect(() => {
        if (!topoData || !backendData) {
            console.error("TopoJSON o datos del backend no cargados.");
            return;
        }

        // Extraer las ubicaciones de inspección del backend
        const inspectionLocations = backendData.inspection_locations;

        // Configuración del mapa
        const width = 800;
        const height = 600;

        const svg = d3.select(mapRef.current)
            .attr('width', width)
            .attr('height', height);

        svg.selectAll("*").remove(); // Limpia cualquier render anterior

        const projection = d3.geoMercator()
            .center([-87.6298, 41.8781]) // Centra en Chicago
            .scale(50000)
            .translate([width / 2, height / 2]);

        const path = d3.geoPath().projection(projection);

        const zipcodes = topojson.feature(topoData, topoData.objects.zipcodes);

        // Dibujar ZIP codes
        svg.append('g')
            .selectAll('path')
            .data(zipcodes.features)
            .enter()
            .append('path')
            .attr('d', path)
            .attr('fill', '#e8e8e8')
            .attr('stroke', '#333')
            .attr('stroke-width', 0.5);

        // Preparar datos para el heatmap
        const points = inspectionLocations.map(d => ({
            x: projection([d.longitude, d.latitude])[0],
            y: projection([d.longitude, d.latitude])[1],
        }));

        // Crear escala de colores para el heatmap
        const colorScale = d3.scaleSequential(d3.interpolateYlOrRd)
            .domain([0, d3.max(points, d => d.count || 1)]); // Ajustar dominio basado en la densidad

        // Generar heatmap con densidad
        const density = d3.contourDensity()
            .x(d => d.x)
            .y(d => d.y)
            .size([width, height])
            .bandwidth(30) // Controla la suavidad
            (points);

        // Dibujar el heatmap
        svg.append('g')
            .selectAll('path')
            .data(density)
            .enter()
            .append('path')
            .attr('d', d3.geoPath())
            .attr('fill', d => colorScale(d.value))
            .attr('stroke', "none")
            .attr('opacity', 0.8);

    }, [topoData, backendData]);

    return (
        <div style={{ position: 'relative', width: '800px', height: '600px' }}>
            {/* Contenedor del SVG */}
            <svg ref={mapRef} className="chicago-map"></svg>

            {/* Leyenda del Heatmap */}
            <div
                style={{
                    position: 'absolute',
                    bottom: '10px',
                    left: '10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    padding: '10px',
                    borderRadius: '5px',
                    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.2)',
                    fontSize: '14px',
                }}
            >
                <div><span style={{ color: '#ffffcc', marginRight: '10px' }}>●</span> Baja Densidad</div>
                <div><span style={{ color: '#ffeda0', marginRight: '10px' }}>●</span> Media Densidad</div>
                <div><span style={{ color: '#f03b20', marginRight: '10px' }}>●</span> Alta Densidad</div>
            </div>
        </div>
    );
};

export default ChicagoHeatMap;
