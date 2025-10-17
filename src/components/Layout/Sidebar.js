import React, { useState } from 'react';
import { LayoutDashboard, Plus, Trello, List, Users, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar = ({ activeTab, setActiveTab, isOpen, setIsOpen }) => {
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '#/dashboard' },
    { id: 'add', label: 'Add Opportunity', icon: Plus, path: '#/add' },
    { id: 'kanban', label: 'Kanban View', icon: Trello, path: '#/kanban' },
    { id: 'list', label: 'List View', icon: List, path: '#/list' },
  ];

  if (user?.role === 'Admin') {
    navigationItems.push(
      { id: 'users', label: 'User Management', icon: Users, path: '#/users' }
    );
  }

  const getCurrentPath = () => {
    return window.location.hash || '#/dashboard';
  };

  const isActive = (path) => {
    const currentPath = getCurrentPath();
    if (path === '#/dashboard') {
      return currentPath === '#/dashboard' || currentPath === '#/' || currentPath === '';
    }
    return currentPath.startsWith(path);
  };

  return (
    <div className={`bg-white border-end transition-all ${isCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded'}`} style={{width: isCollapsed ? '4rem' : '16rem', minHeight: '100vh', position: 'relative'}}>
      {/* Header */}
      <div className="p-3 border-bottom">
        <div className="d-flex align-items-center justify-content-between">
          {!isCollapsed && (
            <div className="h5 mb-0 fw-bold text-dark">
              Sales Pipeline
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="btn btn-light p-1"
          >
            {isCollapsed ? (
              <ChevronRight />
            ) : (
              <ChevronLeft />
            )}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-3 d-flex flex-column gap-2">
        {navigationItems.map(item => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <a
              key={item.id}
              href={item.path}
              className={`d-flex align-items-center gap-2 px-2 py-2 rounded ${active ? 'bg-primary text-white' : 'text-dark'}`}
              title={isCollapsed ? item.label : undefined}
              style={{textDecoration:'none'}}
            >
              <Icon className="me-2" />
              {!isCollapsed && (
                <span className="fw-medium">{item.label}</span>
              )}
            </a>
          );
        })}
      </nav>

      {/* User Info */}
      {!isCollapsed && (
        <div className="position-absolute bottom-0 start-0 w-100 p-3">
          <div className="bg-light rounded p-2">
            <div className="fw-bold">{user?.name}</div>
            <div className="text-muted small">{user?.role}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;