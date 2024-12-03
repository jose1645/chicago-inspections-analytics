// src/components/Loader.js
import React from 'react';
import './Loader.css'; // Asegúrate de que el CSS esté en el mismo directorio o ajusta la ruta

const Loader = () => (
    <div className="loader">
        <div className="circle">
            <div className="dot"></div>
            <div className="outline"></div>
        </div>
        <div className="circle">
            <div className="dot"></div>
            <div className="outline"></div>
        </div>
        <div className="circle">
            <div className="dot"></div>
            <div className="outline"></div>
        </div>
        <div className="circle">
            <div className="dot"></div>
            <div className="outline"></div>
        </div>
    </div>
);

export default Loader;
