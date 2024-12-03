import React from 'react';
import Loader from '../styles/Loader.css';
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
