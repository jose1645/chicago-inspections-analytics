import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import '../styles/ChicagoMap.css';

const ChicagoMap = ({ topoData, inspectionLocations }) => {
    const mapRef = useRef(null);
    const [currentDate, setCurrentDate] = useState(null); // Estado para mostrar la fecha dinámica

    useEffect(() => {
        if (!topoData) {
            console.error("TopoJSON no cargado.");
            return;
        }

        // Dimensiones del mapa para el `viewBox`
        const width = 800;
        const height = 600;

        const svg = d3.select(mapRef.current)
            .attr('viewBox', `0 0 ${width} ${height}`) // Agrega el atributo `viewBox`
            .attr('preserveAspectRatio', 'xMidYMid meet') // Mantiene la proporción
            .classed('responsive-svg', true); // Clase opcional para estilo adicional

        svg.selectAll("*").remove(); // Limpia cualquier render anterior

        const projection = d3.geoMercator()
            .center([-87.6298, 41.8781]) // Centra en Chicago
            .scale(50000) // Ajusta el nivel de zoom
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
            .attr('fill', '#e8e8e8') // Color base de los ZIP codes
            .attr('stroke', '#333') // Borde de los ZIP codes
            .attr('stroke-width', 0.5)
            .append('title') // Tooltip para mostrar el ZIP
            .text(d => `ZIP: ${d.properties.ZIP}`);

        // Escala de colores basada en resultados
        const colorScale = d3.scaleOrdinal()
            .domain(["Pass", "Fail", "Pass w/ Conditions"])
            .range(["green", "red", "orange"]); // Asignar colores según el valor de 'results'

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
            .attr('fill', d => colorScale(d.results)) // Color dinámico basado en 'results'
            .attr('opacity', 0); // Invisible al inicio

        // Animar los puntos para que aparezcan uno por uno
        points.transition()
            .duration(100) // Duración de la animación
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
                    .text(d => `Resultado: ${d.results}\nFecha: ${d.inspection_date}`);
            });
    }, [topoData, inspectionLocations]);

    return (
        <div style={{ position: 'relative', width: '100%', height: '0', paddingBottom: '75%' }}>
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

            {/* Leyenda para los colores */}
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
                    fontWeight: 'bold'
                }}
            >
                <div>
                    <span style={{ color: 'green', marginRight: '10px' }}>●</span> Aprobado
                </div>
                <div>
                    <span style={{ color: 'red', marginRight: '10px' }}>●</span> Rechazado
                </div>
                <div>
                    <span style={{ color: 'orange', marginRight: '10px' }}>●</span> Aprobado con condiciones
                </div>
            </div>
        </div>
    );
};

export default ChicagoMap;
