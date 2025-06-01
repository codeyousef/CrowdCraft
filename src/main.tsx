import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { useGameStore } from './store/gameStore'

// Development helper - reset world and localStorage
if (import.meta.env.DEV) {
  (window as any).resetDev = () => {
    useGameStore.getState().resetForDevelopment();
    window.location.reload();
  };
  console.log('Development mode: Use resetDev() to reset world and reload');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)