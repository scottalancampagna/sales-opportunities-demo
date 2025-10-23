import React, { useState } from 'react';
import { Bell, Settings, User, LogOut, HelpCircle, Database } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import SalesforceImport from '../Opportunities/SalesforceImport';

const Header = () => {
  const { user, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSalesforceImport, setShowSalesforceImport] = useState(false);

  const handleLogout = () => {
    logout();
    setShowProfileMenu(false);
  };

  const handleImportComplete = () => {
    // Trigger a page refresh or data reload
    window.location.reload();
  };

  return (
    <header className="bg-white border-bottom px-4 py-3">
      <div className="d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center gap-3">
          <h1 className="h4 mb-0 fw-bold text-dark">
            Sales Opportunities
          </h1>
        </div>

        <div className="d-flex align-items-center gap-3">
          {/* Salesforce Import */}
          {(user?.role === 'Admin' || user?.role === 'GTMLead') && (
            <button 
              onClick={() => setShowSalesforceImport(true)}
              className="btn btn-outline-primary d-flex align-items-center gap-2" 
              title="Import from Salesforce"
            >
              <Database size={16} />
              <span className="d-none d-md-inline">SF Import</span>
            </button>
          )}

          {/* Notifications */}
          <button className="btn btn-light p-2" title="Notifications">
            <Bell className="me-1" />
          </button>

          {/* Help */}
          <button className="btn btn-light p-2" title="Help">
            <HelpCircle className="me-1" />
          </button>

          {/* Profile Menu */}
          <div className="position-relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="d-flex align-items-center gap-2 btn btn-light"
            >
              <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center" style={{width:32,height:32}}>
                <span className="fw-bold">
                  {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                </span>
              </div>
              <span className="fw-medium">{user?.name}</span>
            </button>

            {showProfileMenu && (
              <>
                <div
                  className="position-fixed top-0 start-0 w-100 h-100"
                  style={{zIndex:10}}
                  onClick={() => setShowProfileMenu(false)}
                />
                <div className="position-absolute end-0 mt-2 card shadow border-0" style={{width:'16rem',zIndex:20}}>
                  <div className="card-body border-bottom pb-2">
                    <div className="fw-bold">{user?.name}</div>
                    <div className="text-muted small">{user?.email}</div>
                    <div className="text-muted small text-capitalize">{user?.role}</div>
                  </div>
                  <button className="w-100 d-flex align-items-center px-3 py-2 btn btn-link text-dark">
                    <User className="me-2" />
                    Profile Settings
                  </button>
                  <button className="w-100 d-flex align-items-center px-3 py-2 btn btn-link text-dark">
                    <Settings className="me-2" />
                    Preferences
                  </button>
                  <div className="border-top mt-2 pt-2">
                    <button
                      onClick={handleLogout}
                      className="w-100 d-flex align-items-center px-3 py-2 btn btn-link text-danger"
                    >
                      <LogOut className="me-2" />
                      Sign Out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Salesforce Import Modal */}
          {showSalesforceImport && (
            <SalesforceImport
              onImportComplete={handleImportComplete}
              onClose={() => setShowSalesforceImport(false)}
            />
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;