import React, { useRef, useEffect } from "react";
import * as d3 from "d3";
import * as topojson from "topojson-client";

const ChicagoMap = () => {
    const svgRef = useRef(null);

    useEffect(() => {
        const renderMap = async () => {
            try {
                // Cargar el archivo TopoJSON
                const topoData = await d3.json("/utils/chicago.json");
                console.log("TopoJSON cargado:", topoData);

                const zipcodes = topojson.feature(topoData, topoData.objects.zipcodes);
                console.log("GeoJSON generado:", zipcodes);

                const width = 960;
                const height = 600;

                const svg = d3.select(svgRef.current)
                    .attr("viewBox", [0, 0, width, height])
                    .style("background", "#f0f0f0");

                const projection = d3.geoMercator()
                    .scale(100000)
                    .center([-87.6298, 41.8781])
                    .translate([width / 2, height / 2]);

                const path = d3.geoPath(projection);

                // Dibujar las áreas del mapa
                svg.append("g")
                    .selectAll("path")
                    .data(zipcodes.features)
                    .join("path")
                    .attr("d", path)
                    .attr("fill", "#ddd")
                    .attr("stroke", "#333")
                    .attr("stroke-width", 0.5);

                // Agregar puntos de inspecciones
                const inspectionLocations = [
                    { latitude: 41.686017, longitude: -87.620976 },
                    { latitude: 41.924043, longitude: -87.769032 },
                    { latitude: 41.876965, longitude: -87.633443 },
                ];

                svg.append("g")
                    .selectAll("circle")
                    .data(inspectionLocations)
                    .join("circle")
                    .attr("cx", d => projection([d.longitude, d.latitude])[0])
                    .attr("cy", d => projection([d.longitude, d.latitude])[1])
                    .attr("r", 4)
                    .attr("fill", "red")
                    .attr("opacity", 0.7);

            } catch (error) {
                console.error("Error al renderizar el mapa:", error);
            }
        };

        renderMap();
    }, []);

    return <svg ref={svgRef}></svg>;
};

export default ChicagoMap;
