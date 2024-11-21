// src/components/Dashboard.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import '../styles/Dashboard.css';

const Dashboard = () => {
    const [kpis, setKpis] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [topoData, setTopoData] = useState(null); // Almacenar el TopoJSON
    const [inspectionLocations, setInspectionLocations] = useState([]); // Ubicaciones de inspecciones

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Cargar KPIs desde el backend
                const response = await axios.get('/api/kpis');
                setKpis(response.data);

                // Cargar el archivo TopoJSON desde utils/chicago.json
               // const topoResponse = await d3.json('/utils/chicago.json');
                //setTopoData(topoResponse);

                // Extraer ubicaciones de inspección
                setInspectionLocations(response.data.inspection_locations);
            } catch (err) {
                setError('Error al obtener los datos del servidor o el mapa.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) return <div className="dashboard">Cargando datos...</div>;
    if (error) return <div className="dashboard error">{error}</div>;

    return (
        <div className="dashboard">
            <h2>Dashboard de KPIs</h2>
            <div className="dashboard-charts">
                <div className="chart">
                    <h3>Total de Inspecciones</h3>
                    <p>{kpis.total_inspections}</p>
                </div>
                <div className="chart">
                    <h3>Inspecciones Aprobadas</h3>
                    <p>{kpis.passed_inspections}</p>
                </div>
                <div className="chart">
                    <h3>Inspecciones Rechazadas</h3>
                    <p>{kpis.failed_inspections}</p>
                </div>
                <div className="chart">
                    <h3>Inspecciones por Mes</h3>
                    <ul>
                        {Object.entries(kpis.inspections_by_month).map(([month, count]) => (
                            <li key={month}>
                                Mes {month}: {count} inspecciones
                            </li>
                        ))}
                    </ul>
                </div>
                
                <div className="chart">
                    <h3>Distribución de Riesgo</h3>
                    <ul>
                        {Object.entries(kpis.risk_distribution).map(([risk, count]) => (
                            <li key={risk}>
                                {risk}: {count} inspecciones
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="chart">
                    <h3>Mapa de Inspecciones en Chicago</h3>
                    <ChicagoMap topoData={topoData} inspectionLocations={inspectionLocations} />
                </div>
            </div>
        </div>
    );
};

// Componente ChicagoMap
const ChicagoMap = ({ topoData, inspectionLocations }) => {
    const svgRef = React.useRef(null);

    useEffect(() => {
        const width = 960;
        const height = 600;

        const projection = d3.geoMercator()
            .scale(100000) // Escala para Chicago
            .center([-87.6298, 41.8781]) // Centrar en Chicago
            .translate([width / 2, height / 2]);

        const path = d3.geoPath(projection);

        const svg = d3.select(svgRef.current)
            .attr("viewBox", [0, 0, width, height])
            .call(
                d3.zoom()
                    .scaleExtent([1, 8])
                    .on("zoom", (event) => {
                        g.attr("transform", event.transform);
                    })
            );

        const g = svg.append("g");

        // Dibujar límites de Chicago
        g.append("path")
            .datum(topojson.feature(topoData, topoData.objects.chicago))
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

export default Dashboard;
