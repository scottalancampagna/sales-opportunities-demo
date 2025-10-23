import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from './Sidebar';
import Header from './Header';
import AddOpportunity from '../Opportunities/AddOpportunity';
import Dashboard from '../Dashboard/Dashboard';
import KanbanView from '../Kanban/KanbanView';
import ListView from '../List/ListView';
import UserManagement from '../Admin/UserManagement';
import DetailView from '../Detail/DetailView';

const MainLayout = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedOpportunityId, setSelectedOpportunityId] = useState(null);
  const { user } = useAuth();

  // Handle hash-based routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash || '#/dashboard';
      console.log('Hash changed to:', hash);
      
      // Check for detail view
      const detailMatch = hash.match(/#\/detail\/(.+)/);
      if (detailMatch) {
        setSelectedOpportunityId(detailMatch[1]);
        return;
      } else {
        setSelectedOpportunityId(null);
      }

      // Set active tab based on hash
      if (hash.startsWith('#/dashboard')) {
        setActiveTab('dashboard');
      } else if (hash.startsWith('#/add')) {
        setActiveTab('add');
      } else if (hash.startsWith('#/kanban')) {
        setActiveTab('kanban');
      } else if (hash.startsWith('#/list')) {
        setActiveTab('list');
      } else if (hash.startsWith('#/users')) {
        setActiveTab('users');
      } else {
        setActiveTab('dashboard');
      }
    };

    // Set initial route
    handleHashChange();
    
    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleCloseDetail = () => {
    setSelectedOpportunityId(null);
    window.location.hash = '#/dashboard';
  };

  // If viewing opportunity detail, show detail view
  if (selectedOpportunityId) {
    return (
      <div className="min-vh-100 bg-light">
        <DetailView
          opportunityId={selectedOpportunityId}
          onClose={handleCloseDetail}
        />
      </div>
    );
  }

  const renderContent = () => {
    console.log('Rendering content for activeTab:', activeTab);
    switch (activeTab) {
      case 'add':
        return <AddOpportunity />;
      case 'dashboard':
        return <Dashboard />;
      case 'kanban':
        return <KanbanView />;
      case 'list':
        return <ListView />;
      case 'users':
        return user?.role === 'Admin' ? <UserManagement /> : <Dashboard />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="d-flex vh-100 bg-light">
      {/* Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />
      
      {/* Main content area */}
      <div className="flex-grow-1 d-flex flex-column overflow-hidden" style={{marginLeft:'16rem'}}>
        {/* Header */}
        <Header setSidebarOpen={setSidebarOpen} />
        
        {/* Main content */}
        <main className="flex-grow-1 overflow-auto bg-white px-3 py-4">
          <div className="container-fluid">
            {renderContent()}
          </div>
        </main>
      </div>
      
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-75"
          style={{zIndex:20}}
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default MainLayout;