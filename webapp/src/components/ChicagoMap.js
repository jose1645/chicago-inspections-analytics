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

        const zipcodes = topojson.feature(topoData, topoData.objects.zipcodes);

        // Dibujar ZIP codes
        svg.append('g')
            .selectAll('path')
            .data(zipcodes.features)
            .enter()
            .append(
