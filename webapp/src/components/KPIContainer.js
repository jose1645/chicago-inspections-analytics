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
        </div>
    );
};

export default KPIContainer;
