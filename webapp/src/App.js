// src/App.js
import React from 'react';
import ProjectDescription from './components/ProjectDescription';
import Dashboard from './components/Dashboard';
import MLModels from './components/MLModels';
import './styles/App.css';

function App() {
    return (
        <div className="App">
            <header className="app-header">
                <h1>Proyecto de Análisis y Predicción de Inspecciones Sanitarias</h1>
                <nav className="app-nav">
                    <button onClick={() => document.getElementById('description').scrollIntoView({ behavior: 'smooth' })}>Descripción</button>
                    <button onClick={() => document.getElementById('dashboard').scrollIntoView({ behavior: 'smooth' })}>Dashboard</button>
                    <button onClick={() => document.getElementById('mlmodels').scrollIntoView({ behavior: 'smooth' })}>Modelos de ML</button>
                </nav>
            </header>
            <main className="app-main">
                <section id="description"><ProjectDescription /></section>
                <section id="dashboard"><Dashboard /></section>
                <section id="mlmodels"><MLModels /></section>
            </main>
        </div>
    );
}

export default App;
