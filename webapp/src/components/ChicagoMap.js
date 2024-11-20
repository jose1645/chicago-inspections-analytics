import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';

const ChicagoMap = ({ topoData, inspectionLocations }) => {
    const svgRef = useRef(null);

    useEffect(() => {
        const width = 960;
        const height = 600;

        const projection = d3.geoMercator()
            .scale(100000) // Escala para Chicago
            .center([-87.6298, 41.8781]) // Centrado en Chicago
            .translate([width / 2, height / 2]);

        const path = d3.geoPath(projection);

        const svg = d3.select(svgRef.current)
            .attr("viewBox", [0, 0, width, height])
            .call(
                d3.zoom()
                    .scaleExtent([1, 8]) // Configurar el zoom
                    .on("zoom", (event) => {
                        g.attr("transform", event.transform); // Aplicar transformaciones
                    })
            );

        const g = svg.append("g");

        // Dibujar límites de Chicago
        g.append("path")
            .datum(topojson.feature(topoData, topoData.objects.chicago)) // Cambia 'chicago' si el objeto tiene otro nombre
            .attr("fill", "#ddd")
            .attr("stroke", "#333")
            .attr("stroke-linejoin", "round")
            .attr("d", path);

        // Dibujar ubicaciones de inspección
        g.selectAll("circle")
            .data(inspectionLocations)
            .join("circle")
            .attr("cx", d => projection([d.longitude, d.latitude])[0])
            .attr("cy", d => projection([d.longitude, d.latitude])[1])
            .attr("r", 3)
            .attr("fill", "blue")
            .attr("opacity", 0.7);

    }, [topoData, inspectionLocations]);

    return <svg ref={svgRef}></svg>;
};

export default ChicagoMap;
