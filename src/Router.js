import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// Layout Components
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';

// Page Components
import LoginScreen from './components/Auth/LoginScreen';
import Dashboard from './components/Dashboard/Dashboard';
import AddView from './components/Add/AddView';
import KanbanView from './components/Kanban/KanbanView';
import ListView from './components/List/ListView';
import DetailView from './components/Detail/DetailView';
import UserManagement from './components/Admin/UserManagement';

// Common Components
import LoadingSpinner from './components/Common/LoadingSpinner';

const Router = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [selectedOpportunityId, setSelectedOpportunityId] = useState(null);

  // Handle hash-based routing for detail view
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      const detailMatch = hash.match(/#\/detail\/(.+)/);
      if (detailMatch) {
        setSelectedOpportunityId(detailMatch[1]);
      } else {
        setSelectedOpportunityId(null);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleCloseDetail = () => {
    setSelectedOpportunityId(null);
    window.location.hash = '#/dashboard';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner message="Loading..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  // Detail view overlay
  if (selectedOpportunityId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DetailView
          opportunityId={selectedOpportunityId}
          onClose={handleCloseDetail}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/add" element={<AddView />} />
            <Route path="/kanban" element={<KanbanView />} />
            <Route path="/list/:stage?" element={<ListViewWrapper />} />
            <Route 
              path="/users" 
              element={
                user?.role === 'Admin' ? <UserManagement /> : <Navigate to="/dashboard" />
              } 
            />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

// Wrapper to handle stage parameter for ListView
const ListViewWrapper = () => {
  const params = new URLSearchParams(window.location.search);
  const stage = window.location.pathname.split('/list/')[1] || 'all';
  return <ListView stage={stage} />;
};

export default Router;