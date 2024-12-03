import React from 'react';
import '../styles/MainCard.css';

const MainCard = ({ title, subtitle }) => {
    return (
        <div className="main-card">
            <svg className="weather-icon" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="#10B981" />
            </svg>
            <div className="main-title">{title}</div>
            <div className="main-subtitle">{subtitle}</div>
        </div>
    );
};

export default MainCard;
