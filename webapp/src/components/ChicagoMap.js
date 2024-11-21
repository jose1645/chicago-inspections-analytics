// src/components/ChicagoMap.js
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import '../styles/ChicagoMap.css';

const ChicagoMap = ({ inspectionLocations }) => {
    const mapRef = useRef(null);

    useEffect(() => {
        if (inspectionLocations.length === 0) return;

        // Configuración del mapa
        const width = 800;
        const height = 600;

        // Crear un SVG para el mapa
        const svg = d3.select(mapRef.current)
            .attr('width', width)
            .attr('height', height);

        svg.selectAll("*").remove(); // Limpia cualquier mapa anterior

        // Proyección y escalas
        const projection = d3.geoMercator()
            .center([-87.6298, 41.8781]) // Centra en Chicago
            .scale(50000) // Escala del mapa
            .translate([width / 2, height / 2]);

        const path = d3.geoPath().projection(projection);

        // Dibujar puntos de inspección
        svg.append('g')
            .selectAll('circle')
            .data(inspectionLocations)
            .enter()
            .append('circle')
            .attr('cx', d => projection([d.longitude, d.latitude])[0])
            .attr('cy', d => projection([d.longitude, d.latitude])[1])
            .attr('r', 5) // Tamaño del punto
            .attr('fill', 'blue') // Color del marcador
            .attr('opacity', 0.7)
            .append('title') // Agregar tooltip
            .text(d => `Fecha: ${d.inspection_date}`);

    }, [inspectionLocations]);

    return <svg ref={mapRef} className="chicago-map"></svg>;
};

export default ChicagoMap;
