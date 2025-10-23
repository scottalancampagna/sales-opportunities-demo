import React, { useState, useEffect } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { ScoringProvider } from './components/Scoring/ScoreComponents';
import { RBACProvider } from './components/RBAC/RBACComponents';
import MainLayout from './components/Layout/MainLayout';
import LoginScreen from './components/Auth/LoginScreen';
import ErrorBoundary from './components/Common/ErrorBoundary';
import DataInitializer from './utils/DataInitializer';
import dataService from './services/DataService';
import LoadingSpinner from './components/Common/LoadingSpinner';
import { useAuth } from './contexts/AuthContext';
import { cloudApi, migrateFromLocalStorage } from './services/cloudApi';
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

  // Test cloud API connectivity
  useEffect(() => {
    const testCloudApi = async () => {
      console.log('Testing cloud API connectivity...');
      try {
        const opportunities = await cloudApi.getOpportunities();
        const users = await cloudApi.getUsers();
        console.log('Cloud opportunities:', opportunities.length);
        console.log('Cloud users:', users.length);
        console.log('Cloud API working!');
      } catch (error) {
        console.log('Cloud API error, will use localStorage fallback:', error);
      }
    };
    
    testCloudApi();
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
        <RBACProvider>
          <ScoringProvider>
            <DataProvider>
              <div className="App min-vh-100 bg-light">
                <AppContent />
              </div>
            </DataProvider>
          </ScoringProvider>
        </RBACProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;