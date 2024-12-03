import React from 'react';
import '../styles/SubCard.css';

const SubCard = ({ title, value, details }) => {
    return (
        <div className="sub-card">
            <h3>{title}</h3>
            {value !== undefined && <p className="value">{value}</p>}
            {details && Array.isArray(details) && details.length > 0 ? (
                <ul className="details">{details}</ul>
            ) : (
                details && <p className="no-data">{details}</p>
            )}
        </div>
    );
};

export default SubCard;
