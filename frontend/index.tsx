import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Register the service worker for background notifications
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Construct an absolute URL manually to avoid issues with `new URL()` in some sandboxed environments.
    const swUrl = `${window.location.protocol}//${window.location.host}/service-worker.js`;
    navigator.serviceWorker.register(swUrl)
      .then(registration => {
        console.log('Service Worker registered successfully:', registration);
      })
      .catch(error => {
        console.log('Service Worker registration failed:', error);
      });
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);