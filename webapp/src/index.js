import React from 'react';
import ReactDOM from 'react-dom/client'; // A partir de React 18, usamos `react-dom/client` para crear el root
//import './index.css'; // Aquí puedes importar tu archivo de estilos globales
import App from './App'; // El componente principal
import reportWebVitals from './reportWebVitals'; // (Opcional) para medir el rendimiento

// Crear el "root" del DOM donde se montará la aplicación React
const root = ReactDOM.createRoot(document.getElementById('root'));

// Renderizar la aplicación
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Si quieres empezar a medir el rendimiento, puedes pasar una función a `reportWebVitals`
reportWebVitals();
