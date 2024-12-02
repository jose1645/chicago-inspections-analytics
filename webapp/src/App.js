import React from 'react';
import ProjectDescription from './components/ProjectDescription';
import Dashboard from './components/Dashboard';
import MLModels from './components/MLModels';
import './styles/App.css';

function App() {
    return (
        <div className="App">
            {/* Header */}
            <header className="app-header">
             <h1>Proyecto de Análisis y Predicción de Inspecciones Sanitarias</h1>
                <div className="header-content">
                    {/* Navegación */}
                    <nav className="app-nav">
                        <button
                            className="button"
                            onClick={() =>
                                document
                                    .getElementById('description')
                                    .scrollIntoView({ behavior: 'smooth' })
                            }
                            data-text="Descripción"
                        >
                            <span className="actual-text">&nbsp;Descripción&nbsp;</span>
                            <span aria-hidden="true" className="hover-text">
                                &nbsp;Descripción&nbsp;
                            </span>
                        </button>
                        <button
                            className="button"
                            onClick={() =>
                                document
                                    .getElementById('dashboard')
                                    .scrollIntoView({ behavior: 'smooth' })
                            }
                            data-text="Dashboard"
                        >
                            <span className="actual-text">&nbsp;Dashboard&nbsp;</span>
                            <span aria-hidden="true" className="hover-text">
                                &nbsp;Dashboard&nbsp;
                            </span>
                        </button>
                        <button
                            className="button"
                            onClick={() =>
                                document
                                    .getElementById('mlmodels')
                                    .scrollIntoView({ behavior: 'smooth' })
                            }
                            data-text="ML"
                        >
                            <span className="actual-text">&nbsp;ML&nbsp;</span>
                            <span aria-hidden="true" className="hover-text">
                                &nbsp;ML&nbsp;
                            </span>
                        </button>
                    </nav>
                </div>
                <div className="header-animation"></div>
            </header>
            {/* Contenido principal */}
            <main className="app-main">
                <section id="description">
                    <ProjectDescription />
                </section>
                <section id="dashboard">
                    <Dashboard />
                </section>
                <section id="mlmodels">
                    <MLModels />
                </section>
            </main>
        </div>
    );
}

export default App;
