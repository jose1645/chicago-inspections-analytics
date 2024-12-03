import React from 'react';
import SubCard from './SubCard';
import '../styles/KPIContainer.css';

const KPIContainer = ({ kpis }) => {
    return (
        <div className="kpi-container">
            <SubCard title="Total de Inspecciones" value={kpis.total_inspections} />
            <SubCard title="Inspecciones Aprobadas" value={kpis.passed_inspections} />
            <SubCard title="Inspecciones Rechazadas" value={kpis.failed_inspections} />
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
    );
};

export default KPIContainer;
