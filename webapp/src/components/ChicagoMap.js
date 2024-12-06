import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import '../styles/ChicagoMap.css';

const ChicagoMap = ({ topoData, inspectionLocations }) => {
    const mapRef = useRef(null);
    const [tooltipContent, setTooltipContent] = useState(null);
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        if (!topoData) {
            console.error("TopoJSON no cargado.");
            return;
        }

        const width = 800;
        const height = 600;

        const svg = d3.select(mapRef.current)
            .attr('viewBox', `0 0 ${width} ${height}`)
            .attr('preserveAspectRatio', 'xMidYMid meet')
            .classed('responsive-svg', true);

        svg.selectAll("*").remove();

        const projection = d3.geoMercator()
            .center([-87.6298, 41.8781])
            .scale(50000)
            .translate([width / 2, height / 2]);

        const path = d3.geoPath().projection(projection);

        const zipcodes = topojson.feature(topoData, topoData.objects.zipcodes);

        svg.append('g')
            .selectAll('path')
            .data(zipcodes.features)
            .enter()
            .append('path')
            .attr('d', path)
            .attr('fill', '#e8e8e8')
            .attr('stroke', '#333')
            .attr('stroke-width', 0.5);

        const colorScale = d3.scaleOrdinal()
            .domain(["Pass", "Fail", "Pass w/ Conditions"])
            .range(["green", "red", "orange"]);

        const points = svg.append('g')
            .selectAll('circle')
            .data(inspectionLocations)
            .enter()
            .append('circle')
            .attr('cx', d => projection([d.longitude, d.latitude])[0])
            .attr('cy', d => projection([d.longitude, d.latitude])[1])
            .attr('r', 0) // Comienza con radio 0
            .attr('fill', d => colorScale(d.results))
            .attr('opacity', 0)
            .transition() // Animación
            .duration(1000)
            .delay((d, i) => i * 100)
            .attr('r', 8)
            .attr('opacity', 0.8);

        points
            .on('mouseenter', (event, d) => {
                setTooltipContent(`Resultado: ${d.results}<br>Fecha: ${d.inspection_date}`);
                setTooltipPosition({ x: event.pageX, y: event.pageY });
            })
            .on('mouseleave', () => setTooltipContent(null));
    }, [topoData, inspectionLocations]);

    return (
        <div style={{ position: 'relative' }}>
            <svg ref={mapRef} className="chicago-map"></svg>

            {tooltipContent && (
                <div
                    className="tooltip visible"
                    style={{
                        left: `${tooltipPosition.x}px`,
                        top: `${tooltipPosition.y}px`
                    }}
                    dangerouslySetInnerHTML={{ __html: tooltipContent }}
                />
            )}

            <div className="legend">
                <div className="legend-item">
                    <span style={{ backgroundColor: 'green' }}></span> Aprobado
                </div>
                <div className="legend-item">
                    <span style={{ backgroundColor: 'red' }}></span> Reprobado
                </div>
                <div className="legend-item">
                    <span style={{ backgroundColor: 'orange' }}></span> Aprobado con condiciones
                </div>
            </div>
        </div>
    );
};

export default ChicagoMap;
