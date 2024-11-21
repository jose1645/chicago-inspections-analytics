// src/components/ChicagoMap.js
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import '../styles/ChicagoMap.css';

const ChicagoMap = ({ inspectionLocations }) => {
    const mapRef = useRef(null);

    useEffect(() => {
        if (inspectionLocations.length === 0) return;

        // Ordenar las inspecciones por fecha (cronológicamente)
        const sortedLocations = [...inspectionLocations].sort(
            (a, b) => new Date(a.inspection_date) - new Date(b.inspection_date)
        );

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

        // Dibujar puntos de inspección con animación
        const points = svg.append('g')
            .selectAll('circle')
            .data(sortedLocations) // Usamos los datos ordenados
            .enter()
            .append('circle')
            .attr('cx', width / 2) // Comienza desde el centro del mapa
            .attr('cy', height / 2) // Comienza desde el centro del mapa
            .attr('r', 5) // Tamaño inicial del punto
            .attr('fill', 'blue') // Color del marcador
            .attr('opacity', 0);

        // Animación para mover los puntos en orden cronológico
        points.transition()
            .duration(1000) // Duración de la animación (1 segundo)
            .delay((d, i) => i * 500) // Retraso basado en la posición del punto en el array ordenado
            .attr('cx', d => projection([d.longitude, d.latitude])[0])
            .attr('cy', d => projection([d.longitude, d.latitude])[1])
            .attr('opacity', 0.8) // Los puntos se vuelven visibles gradualmente
            .attr('r', 8) // Tamaño final del punto
            .ease(d3.easeBounceOut) // Efecto de rebote
            .on('end', function () {
                d3.select(this)
                    .append('title') // Agregar tooltip al final de la animación
                    .text(d => `Fecha: ${d.inspection_date}`);
            });
    }, [inspectionLocations]);

    return <svg ref={mapRef} className="chicago-map"></svg>;
};

export default ChicagoMap;
