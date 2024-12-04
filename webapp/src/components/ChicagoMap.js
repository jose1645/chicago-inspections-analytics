import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import '../styles/ChicagoMap.css';

const ChicagoMap = ({ topoData, inspectionLocations }) => {
    const mapRef = useRef(null);
    const [currentDate, setCurrentDate] = useState(null); // Fecha dinámica
    const [tooltipContent, setTooltipContent] = useState(null); // Contenido del tooltip
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 }); // Posición del tooltip

    useEffect(() => {
        if (!topoData) {
            console.error("TopoJSON no cargado.");
            return;
        }

        // Dimensiones del mapa
        const width = 800;
        const height = 600;

        const svg = d3.select(mapRef.current)
            .attr('viewBox', `0 0 ${width} ${height}`)
            .attr('preserveAspectRatio', 'xMidYMid meet')
            .classed('responsive-svg', true);

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

        // Escala de colores basada en resultados
        const colorScale = d3.scaleOrdinal()
            .domain(["Pass", "Fail", "Pass w/ Conditions"])
            .range(["green", "red", "orange"]);

        // Ordenar inspecciones por fecha
        const sortedLocations = [...inspectionLocations].sort(
            (a, b) => new Date(a.inspection_date) - new Date(b.inspection_date)
        );

        // Dibujar puntos de inspección
        const points = svg.append('g')
            .selectAll('circle')
            .data(sortedLocations)
            .enter()
            .append('circle')
            .attr('cx', d => projection([d.longitude, d.latitude])[0])
            .attr('cy', d => projection([d.longitude, d.latitude])[1])
            .attr('r', 8)
            .attr('fill', d => colorScale(d.results))
            .attr('opacity', 0.8);

        // Interacción: Hover en escritorio, click/touch en móviles
        points
            .on('mouseenter', function (event, d) {
                if (!isMobile()) {
                    showTooltip(event, d);
                }
            })
            .on('mouseleave', function () {
                if (!isMobile()) {
                    hideTooltip();
                }
            })
            .on('click touchstart', function (event, d) {
                event.preventDefault(); // Evita el zoom en móviles
                toggleMobileTooltip(event, d);
            });
    }, [topoData, inspectionLocations]);

    // Función para detectar si es móvil
    const isMobile = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    // Mostrar tooltip
    const showTooltip = (event, data) => {
        setTooltipContent(`Resultado: ${data.results}<br>Fecha: ${data.inspection_date}`);
        setTooltipPosition({ x: event.pageX, y: event.pageY });
    };

    // Ocultar tooltip
    const hideTooltip = () => {
        setTooltipContent(null);
    };

    // Alternar tooltip en móviles
    const toggleMobileTooltip = (event, data) => {
        const { pageX, pageY } = event.touches ? event.touches[0] : event;
        if (tooltipContent) {
            setTooltipContent(null);
        } else {
            setTooltipContent(`Resultado: ${data.results}<br>Fecha: ${data.inspection_date}`);
            setTooltipPosition({ x: pageX, y: pageY });
        }
    };

    return (
        <div style={{ position: 'relative', width: '100%', height: '0', paddingBottom: '75%' }}>
            {/* Contenedor del SVG */}
            <svg ref={mapRef} className="chicago-map"></svg>

            {/* Tooltip */}
            {tooltipContent && (
                <div
                    className="tooltip"
                    style={{
                        position: 'absolute',
                        left: `${tooltipPosition.x}px`,
                        top: `${tooltipPosition.y}px`,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        color: '#fff',
                        padding: '10px',
                        borderRadius: '5px',
                        fontSize: '12px',
                        pointerEvents: 'none',
                        transform: 'translate(-50%, -120%)',
                        zIndex: 1000
                    }}
                    dangerouslySetInnerHTML={{ __html: tooltipContent }}
                />
            )}

            {/* Fecha dinámica */}
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
