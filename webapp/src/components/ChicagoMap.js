import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';

const ChicagoMap = () => {
    const svgRef = useRef(null);
    const [topoData, setTopoData] = useState(null);

    useEffect(() => {
        const fetchTopoData = async () => {
            try {
                const response = await fetch('https://chicago-inspections-analytics.synteck.org/utils/chicago.json');
                const data = await response.json();
                console.log('TopoData:', data); // Log para verificar la estructura del JSON
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
        console.log('GeoJSON generado:', geoJson);

        const width = 960;
        const height = 600;

        const projection = d3.geoMercator()
            .scale(100000)
            .center([-87.6298, 41.8781])
            .translate([width / 2, height / 2]);

        const path = d3.geoPath(projection);

        const svg = d3.select(svgRef.current)
            .attr("viewBox", [0, 0, width, height])
            .call(
                d3.zoom()
                    .scaleExtent([1, 8])
                    .on("zoom", (event) => {
                        svg.select('g').attr("transform", event.transform);
                    })
            );

        const g = svg.append("g");

        g.append("path")
            .datum(geoJson)
            .attr("fill", "#ddd")
            .attr("stroke", "#333")
            .attr("d", path);
    }, [topoData]);

    return <svg ref={svgRef}></svg>;
};

export default ChicagoMap;
