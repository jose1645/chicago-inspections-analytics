import React from 'react';
import MainCard from './MainCard';
import SubCard from './SubCard';
import '../styles/KPIContainer.css';

const KPIContainer = ({ kpis }) => {
    return (
        <div className="kpi-container">
            {/* MainCard muestra el resumen principal */}
            <MainCard
                totalInspections={kpis.total_inspections}
                passedInspections={kpis.passed_inspections}
                failedInspections={kpis.failed_inspections}
                inspectionsByMonth={kpis.inspections_by_month}
                riskDistribution={kpis.risk_distribution}
            />

            {/* SubCards muestran detalles adicionales */}
            <div className="sub-card-container">
                <SubCard
                    title="Inspecciones por Mes"
                    details={Object.entries(kpis.inspections_by_month).map(([month, count]) => (
                        <li key={month}>Mes {month}: {count} inspecciones</li>
                    ))}
                />
                <SubCard
                    title="Distribución de Riesgo"
                    details={Object.entries(kpis.risk_distribution).map(([risk, count]) => (
                        <li key={risk}>{risk}: {count} inspecciones</li>
                    ))}
                />
            </div>
        </div>
    );
};

export default KPIContainer;
