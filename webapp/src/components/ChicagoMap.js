import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';

const ChicagoMap = ({ topoData, inspectionLocations }) => {
    const svgRef = useRef(null);

    useEffect(() => {
        // Dimensiones del mapa
        const width = 960;
        const height = 600;

        // Configuración de la proyección para Chicago
        const projection = d3.geoMercator()
            .scale(100000) // Escala ajustada para Chicago
            .center([-87.6298, 41.8781]) // Centrado en Chicago
            .translate([width / 2, height / 2]);

        const path = d3.geoPath(projection);

        // Selección y configuración del SVG
        const svg = d3.select(svgRef.current)
            .attr("viewBox", [0, 0, width, height])
            .call(
                d3.zoom()
                    .scaleExtent([1, 8]) // Configuración del zoom
                    .on("zoom", (event) => {
                        g.attr("transform", event.transform); // Aplicar transformaciones
                    })
            );

        // Grupo principal para elementos del mapa
        const g = svg.append("g");

        // Validar si topoData tiene la estructura esperada
        if (topoData && topoData.objects && topoData.objects.zipcodes) {
            // Dibujar los límites de Chicago
            g.append("path")
                .datum(topojson.feature(topoData, topoData.objects.zipcodes))
                .attr("fill", "#ddd")
                .attr("stroke", "#333")
                .attr("stroke-linejoin", "round")
                .attr("d", path);
        } else {
            console.error("Datos de TopoJSON no válidos o faltantes.");
        }

        // Validar y dibujar ubicaciones de inspección
        if (inspectionLocations && inspectionLocations.length > 0) {
            g.selectAll("circle")
                .data(inspectionLocations)
                .join("circle")
                .attr("cx", d => {
                    const projected = projection([d.longitude, d.latitude]);
                    return projected ? projected[0] : null; // Validar proyección
                })
                .attr("cy", d => {
                    const projected = projection([d.longitude, d.latitude]);
                    return projected ? projected[1] : null; // Validar proyección
                })
                .attr("r", 3)
                .attr("fill", "blue")
                .attr("opacity", 0.7)
                .on("mouseover", (event, d) => {
                    d3.select(event.target).attr("fill", "red"); // Cambiar color al pasar el mouse
                })
                .on("mouseout", (event) => {
                    d3.select(event.target).attr("fill", "blue"); // Restaurar color
                });
        } else {
            console.error("Ubicaciones de inspección no válidas o faltantes.");
        }

        // Limpiar al desmontar el componente
        return () => {
            svg.selectAll("*").remove();
        };
    }, [topoData, inspectionLocations]);

    return <svg ref={svgRef}></svg>;
};

export default ChicagoMap;
