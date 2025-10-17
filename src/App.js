import React, { useState, useEffect } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import MainLayout from './components/Layout/MainLayout';
import LoginScreen from './components/Auth/LoginScreen';
import ErrorBoundary from './components/Common/ErrorBoundary';
import DataInitializer from './utils/DataInitializer';
import LoadingSpinner from './components/Common/LoadingSpinner';
import { useAuth } from './contexts/AuthContext';
import './App.css';

const AppContent = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <LoadingSpinner message="Loading application..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return <MainLayout />;
};

const App = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState(null);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Initialize sample data if none exists
      await DataInitializer.initialize();
      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize app:', error);
      setInitError(error.message);
    }
  };

  if (initError) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <div className="text-center">
          <div className="text-danger h4 fw-semibold mb-3">
            Application Error
          </div>
          <div className="text-muted mb-3">{initError}</div>
          <button
            onClick={() => window.location.reload()}
            className="btn btn-primary"
          >
            Reload Application
          </button>
        </div>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <LoadingSpinner message="Initializing application..." />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <AuthProvider>
        <DataProvider>
          <div className="App min-vh-100 bg-light">
            <AppContent />
          </div>
        </DataProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;