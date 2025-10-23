import React from 'react';
import ReactDOM from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import App from './App';
import './index.css';

// ... rest of your index.js code stays the same

// Performance monitoring
const startTime = performance.now();

// Error handling for uncaught errors
window.addEventListener('error', (event) => {
  console.error('Uncaught error:', event.error);
  
  // Log to storage for debugging
  try {
    const errorLogs = JSON.parse(localStorage.getItem('errorLogs') || '[]');
    errorLogs.push({
      timestamp: new Date().toISOString(),
      type: 'uncaught',
      message: event.error?.message || 'Unknown error',
      stack: event.error?.stack,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      url: window.location.href
    });
    
    if (errorLogs.length > 10) {
      errorLogs.splice(0, errorLogs.length - 10);
    }
    
    localStorage.setItem('errorLogs', JSON.stringify(errorLogs));
  } catch (e) {
    console.error('Failed to log error:', e);
  }
});

// Performance metrics
window.addEventListener('load', () => {
  const loadTime = performance.now() - startTime;
  console.log(`🚀 Application loaded in ${loadTime.toFixed(2)}ms`);
  
  try {
    const metrics = JSON.parse(localStorage.getItem('performanceMetrics') || '{}');
    metrics.loadTimes = metrics.loadTimes || [];
    metrics.loadTimes.push(loadTime);
    
    if (metrics.loadTimes.length > 50) {
      metrics.loadTimes.splice(0, metrics.loadTimes.length - 50);
    }
    
    metrics.lastLoadTime = loadTime;
    metrics.averageLoadTime = metrics.loadTimes.reduce((a, b) => a + b, 0) / metrics.loadTimes.length;
    metrics.sessionCount = (metrics.sessionCount || 0) + 1;
    
    localStorage.setItem('performanceMetrics', JSON.stringify(metrics));
  } catch (e) {
    console.error('Failed to track performance metrics:', e);
  }
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);