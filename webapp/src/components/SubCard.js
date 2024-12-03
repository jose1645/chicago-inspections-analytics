import React from 'react';
import '../styles/SubCard.css';

const SubCard = ({ icon, title, value, details }) => {
    return (
        <div className="sub-card">
            <div className="title">
                <span>{icon}</span>
                <p className="title-text">{title}</p>
            </div>
            <div className="data">
                <p>{value}</p>
                {details && <p className="details">{details}</p>}
            </div>
        </div>
    );
};

export default SubCard;
