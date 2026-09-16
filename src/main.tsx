import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './app/App';
import './styles.css';

const wurzel = document.getElementById('root');
if (!wurzel) {
  // Kein stilles Scheitern (ARCHITEKTUR.md, Stil).
  throw new Error('Zehni: Das Wurzelelement #root fehlt in index.html.');
}

ReactDOM.createRoot(wurzel).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
