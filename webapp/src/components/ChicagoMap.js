// src/components/ChicagoMap.js
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import '../styles/ChicagoMap.css';

const ChicagoMap = ({ topoData, inspectionLocations }) => {
    const mapRef = useRef(null);
    const [currentDate, setCurrentDate] = useState(null); // Estado para mostrar la fecha dinámica

    useEffect(() => {
        // Validación de datos de entrada
        if (!topoData || !topoData.objects || !topoData.objects.zipcodes) {
            console.error("TopoJSON no tiene la estructura esperada o está vacío.");
            return;
        }

        if (!Array.isArray(inspectionLocations) || inspectionLocations.length === 0) {
            console.error("inspectionLocations no es un array válido o está vacío.");
            return;
        }

        // Configuración del mapa
        const width = 800;
        const height = 600;

        const svg = d3.select(mapRef.current)
            .attr('width', width)
            .attr('height', height);

        svg.selectAll("*").remove(); // Limpia cualquier render anterior

        const projection = d3.geoMercator()
            .center([-87.6298, 41.8781]) // Centra en Chicago
            .scale(50000) // Ajusta el nivel de zoom
            .translate([width / 2, height / 2]);

        const path = d3.geoPath().projection(projection);

        // Convertir TopoJSON a GeoJSON
        const zipcodes = topojson.feature(topoData, topoData.objects.zipcodes);

        // Validar si las features existen en el TopoJSON
        if (!zipcodes.features || !Array.isArray(zipcodes.features)) {
            console.error("El archivo TopoJSON no contiene features válidas.");
            return;
        }

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
            .text(d => `ZIP: ${d.properties.ZIP || 'Desconocido'}`);

        // Ordenar inspecciones por fecha (cronológicamente)
        const sortedLocations = [...inspectionLocations].sort(
            (a, b) => new Date(a.inspection_date) - new Date(b.inspection_date)
        );

        // Dibujar puntos de inspección con animación
        const points = svg.append('g')
            .selectAll('circle')
            .data(sortedLocations)
            .enter()
            .append('circle')
            .attr('cx', width / 2) // Comienza desde el centro del mapa
            .attr('cy', height / 2) // Comienza desde el centro del mapa
            .attr('r', 5) // Tamaño inicial del punto
            .attr('fill', 'blue') // Color inicial del marcador
            .attr('opacity', 0); // Invisible al inicio

        // Animar los puntos para que aparezcan uno por uno
        points.transition()
            .duration(100) // Duración de la animación (100 ms por punto)
            .delay((d, i) => i * 50) // Retraso basado en la posición del punto en el array ordenado
            .attr('cx', d => projection([d.longitude, d.latitude])[0]) // Posición final X
            .attr('cy', d => projection([d.longitude, d.latitude])[1]) // Posición final Y
            .attr('opacity', 0.8) // Los puntos se vuelven visibles gradualmente
            .attr('r', 8) // Tamaño final del punto
            .ease(d3.easeBounceOut) // Efecto de rebote
            .on('start', function (d) {
                // Cambiar la fecha mostrada dinámicamente
                const date = new Date(d.inspection_date);
                const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
                setCurrentDate(monthYear); // Actualiza el estado con el mes y año
            })
            .on('end', function () {
                d3.select(this)
                    .append('title') // Agregar tooltip al final de la animación
                    .text(d => `Fecha: ${d.inspection_date}`);
            });
    }, [topoData, inspectionLocations]);

    return (
        <div style={{ position: 'relative', width: '800px', height: '600px' }}>
            {/* Contenedor del SVG */}
            <svg ref={mapRef} className="chicago-map"></svg>
            {/* Fecha dinámica en la esquina superior derecha */}
            {currentDate && (
                <div
                    style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        padding: '5px 10px',
                        borderRadius: '5px',
                        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.2)',
                        fontWeight: 'bold',
                        fontSize: '14px'
                    }}
                >
                    {currentDate}
                </div>
            )}
        </div>
    );
};

export default ChicagoMap;
