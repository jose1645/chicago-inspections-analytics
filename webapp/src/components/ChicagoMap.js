// src/components/ChicagoMap.js
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import '../styles/ChicagoMap.css';

const ChicagoMap = ({ topoData, inspectionLocations }) => {
    const mapRef = useRef(null);

    useEffect(() => {
        if (!topoData) {
            console.error("TopoJSON no cargado.");
            return;
        }

        // Configuración del mapa
        const width = 800;
        const height = 600;

        const svg = d3.select(mapRef.current)
            .attr('width', width)
            .attr('height', height);

        svg.selectAll("*").remove(); // Limpia cualquier render anterior

        // Proyección y path
        const projection = d3.geoMercator()
            .center([-87.6298, 41.8781]) // Centra en Chicago
            .scale(50000) // Ajusta el nivel de zoom
            .translate([width / 2, height / 2]);

        const path = d3.geoPath().projection(projection);

        // Convertir TopoJSON a GeoJSON
        const zipcodes = topojson.feature(topoData, topoData.objects.zipcodes);

        // Dibujar ZIP codes
        svg.append('g')
            .selectAll('path')
            .data(zipcodes.features)
            .enter()
            .append('path')
            .attr('d', path)
            .attr('fill', '#e8e8e8') // Color base de los ZIP codes
            .attr('stroke', '#333') // Borde de los ZIP codes
            .attr('stroke-width', 0.5)
            .append('title') // Tooltip para mostrar el ZIP
            .text(d => `ZIP: ${d.properties.ZIP}`);

        // Dibujar puntos de inspección
        svg.append('g')
            .selectAll('circle')
            .data(inspectionLocations)
            .enter()
            .append('circle')
            .attr('cx', d => projection([d.longitude, d.latitude])[0])
            .attr('cy', d => projection([d.longitude, d.latitude])[1])
            .attr('r', 5)
            .attr('fill', 'blue')
            .attr('opacity', 0.8)
            .append('title')
            .text(d => `Fecha: ${d.inspection_date}`);
    }, [topoData, inspectionLocations]);

    return <svg ref={mapRef} className="chicago-map"></svg>;
};

export default ChicagoMap;
