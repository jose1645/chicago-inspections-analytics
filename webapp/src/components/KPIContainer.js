import React from 'react';
import MainCard from './MainCard';
import SubCard from './SubCard';
import '../styles/KPIContainer.css';

const KPIContainer = ({ kpis }) => {
    return (
        <div className="kpi-container">
            <MainCard title="KPIs" subtitle="Resumen General" />
            <div className="sub-card-container">
                {kpis.map((kpi, index) => (
                    <SubCard
                        key={index}
                        icon={<svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" /></svg>}
                        title={kpi.title}
                        value={kpi.value}
                        details={kpi.details}
                    />
                ))}
            </div>
        </div>
    );
};

export default KPIContainer;
