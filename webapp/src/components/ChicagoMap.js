import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';

const ChicagoMap = () => {
    const svgRef = useRef(null);
    const [topoData, setTopoData] = useState(null);

    useEffect(() => {
        const fetchTopoData = async () => {
            try {
                const response = await fetch('/utils/chicago.json');
                const data = await response.json();
                console.log('TopoData:', data);
                setTopoData(data);
            } catch (err) {
                console.error('Error cargando TopoJSON:', err);
            }
        };
        fetchTopoData();
    }, []);

    useEffect(() => {
        if (!topoData || !topoData.objects || !topoData.objects.zipcodes) {
            console.error('Datos de TopoJSON no válidos:', topoData);
            return;
        }

        const geoJson = topojson.feature(topoData, topoData.objects.zipcodes);
        console.log('GeoJSON:', geoJson);

        const width = 960;
        const height = 600;

        const projection = d3.geoMercator()
            .scale(100000)
            .center([-87.6298, 41.8781]) // Centrar en Chicago
            .translate([width / 2, height / 2]);

        const path = d3.geoPath(projection);

        const svg = d3.select(svgRef.current)
            .attr("viewBox", [0, 0, width, height])
            .call(
                d3.zoom()
                    .scaleExtent([1, 8]) // Permitir zoom entre 1x y 8x
                    .on("zoom", (event) => {
                        g.attr("transform", event.transform); // Aplicar transformaciones de zoom
                    })
            );

        // Limpia el contenido previo del <g>
        svg.selectAll("g").remove();

        const g = svg.append("g");

        // Dibujar polígonos del GeoJSON
        g.selectAll("path")
            .data(geoJson.features) // Asegúrate de pasar geoJson.features
            .join("path")
            .attr("fill", "#ddd")
            .attr("stroke", "#333")
            .attr("stroke-width", 0.5)
            .attr("d", path);

    }, [topoData]);

    return <svg ref={svgRef}></svg>;
};

export default ChicagoMap;
