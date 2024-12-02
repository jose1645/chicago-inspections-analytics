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


                <nav class="navigation">
    <button class="button" onClick="document.getElementById('description').scrollIntoView({ behavior: 'smooth' })" data-text="Descripción">
        <span class="actual-text">&nbsp;Descripción&nbsp;</span>
        <span aria-hidden="true" class="hover-text">&nbsp;Descripción&nbsp;</span>
    </button>
    <button class="button" onClick="document.getElementById('dashboard').scrollIntoView({ behavior: 'smooth' })" data-text="Dashboard">
        <span class="actual-text">&nbsp;Dashboard&nbsp;</span>
        <span aria-hidden="true" class="hover-text">&nbsp;Dashboard&nbsp;</span>
    </button>
    <button class="button" onClick="document.getElementById('mlmodels').scrollIntoView({ behavior: 'smooth' })" data-text="Modelos de ML">
        <span class="actual-text">&nbsp;Modelos de ML&nbsp;</span>
        <span aria-hidden="true" class="hover-text">&nbsp;Modelos de ML&nbsp;</span>
    </button>
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
