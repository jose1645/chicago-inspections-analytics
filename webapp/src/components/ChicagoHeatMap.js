import React, { useEffect, useState } from 'react';
import axios from 'axios';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import '../styles/ChicagoHeatMap.css';

const HeatMap = () => {
    const [topoData, setTopoData] = useState(null); // Almacena el TopoJSON
    const [inspectionLocations, setInspectionLocations] = useState([]); // Ubicaciones de inspecciones
    const [currentPage, setCurrentPage] = useState(1); // Página actual
    const [totalPages, setTotalPages] = useState(0); // Total de páginas
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Cargar datos paginados del backend
                const response = await axios.get(`/api/heatmap?page=${currentPage}`);
                const data = response.data;

                // Actualizar datos de paginación
                setInspectionLocations(data.results.inspection_locations);
                setTotalPages(Math.ceil(data.count / data.results.length));

                // Cargar el archivo TopoJSON si no está cargado
                if (!topoData) {
                    const topoResponse = await d3.json('/utils/chicago.json');
                    setTopoData(topoResponse);
                }
            } catch (err) {
                setError('Error al obtener los datos del servidor.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [currentPage]); // Cambia los datos al cambiar de página

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const handlePrevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    if (loading) return <div className="heatmap">Cargando datos...</div>;
    if (error) return <div className="heatmap error">{error}</div>;

    return (
        <div className="heatmap">
            <h2>Mapa de Calor de Inspecciones en Chicago</h2>
            <div id="map-container">
                {topoData && (
                    <svg id="heatmap-svg" width={800} height={600}>
                        {/* Renderizar mapa base */}
                        {topojson.feature(topoData, topoData.objects.zipcodes).features.map((feature, i) => (
                            <path
                                key={i}
                                d={d3.geoPath()(feature)}
                                fill="#e8e8e8"
                                stroke="#333"
                                strokeWidth={0.5}
                            />
                        ))}

                        {/* Renderizar puntos de inspección */}
                        {inspectionLocations.map((location, i) => {
                            const [x, y] = d3.geoMercator()
                                .center([-87.6298, 41.8781])
                                .scale(50000)
                                .translate([400, 300])([location.longitude, location.latitude]);

                            return (
                                <circle
                                    key={i}
                                    cx={x}
                                    cy={y}
                                    r={5}
                                    fill={location.results === "Pass" ? "green" : location.results === "Fail" ? "red" : "orange"}
                                    opacity={0.8}
                                >
                                    <title>
                                        {location.facility_name} ({location.results}) - {location.inspection_date}
                                    </title>
                                </circle>
                            );
                        })}
                    </svg>
                )}
            </div>

            {/* Controles de paginación */}
            <div className="pagination">
                <button onClick={handlePrevPage} disabled={currentPage === 1}>
                    Página Anterior
                </button>
                <span>
                    Página {currentPage} de {totalPages}
                </span>
                <button onClick={handleNextPage} disabled={currentPage === totalPages}>
                    Página Siguiente
                </button>
            </div>
        </div>
    );
};

export default HeatMap;
