import React, { useState, useEffect } from 'react';
import { ArrowLeft, Edit, Save, X, Clock, Users, FileText, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { canEditOpportunity, canChangeStage } from '../../utils/permissions';
import OpportunityEditor from './OpportunityEditor';
import StageManager from './StageManager';
import AuditTrail from './AuditTrail';
import POCManager from './POCManager';

const DetailView = ({ opportunityId, onClose }) => {
  const { user } = useAuth();
  const [opportunity, setOpportunity] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load opportunity data
  useEffect(() => {
    loadOpportunity();
  }, [opportunityId]);

  // Warn about unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const loadOpportunity = () => {
    try {
      const opportunities = JSON.parse(localStorage.getItem('opportunities') || '[]');
      const found = opportunities.find(opp => opp.id === opportunityId);
      
      if (!found) {
        setError('Opportunity not found');
        return;
      }
      
      setOpportunity(found);
    } catch (error) {
      setError('Error loading opportunity data');
      console.error('Error loading opportunity:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = (updatedOpportunity) => {
    try {
      const opportunities = JSON.parse(localStorage.getItem('opportunities') || '[]');
      const updatedOpportunities = opportunities.map(opp =>
        opp.id === opportunityId ? updatedOpportunity : opp
      );
      
      localStorage.setItem('opportunities', JSON.stringify(updatedOpportunities));
      setOpportunity(updatedOpportunity);
      setIsEditing(false);
      setHasUnsavedChanges(false);
      
      // Show success message
      const toast = document.createElement('div');
      toast.className = 'toast-container position-fixed top-0 end-0 p-3';
      toast.innerHTML = `
        <div class="toast show" role="alert">
          <div class="toast-header bg-success text-white">
            <strong class="me-auto">Success</strong>
            <button type="button" class="btn-close btn-close-white" onclick="this.closest('.toast-container').remove()"></button>
          </div>
          <div class="toast-body">Opportunity updated successfully!</div>
        </div>
      `;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
      
    } catch (error) {
      console.error('Error saving opportunity:', error);
      alert('Error saving changes. Please try again.');
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to cancel?');
      if (!confirmed) return;
    }
    
    setIsEditing(false);
    setHasUnsavedChanges(false);
    loadOpportunity(); // Reload original data
  };

  const handleStageChange = (newStage, auditEntry) => {
    const updatedOpportunity = {
      ...opportunity,
      stage: newStage,
      updated_date: new Date().toISOString(),
      audit_trail: [...(opportunity.audit_trail || []), auditEntry]
    };
    
    handleSave(updatedOpportunity);
  };

  const addAuditEntry = (auditEntry) => {
    const updatedOpportunity = {
      ...opportunity,
      updated_date: new Date().toISOString(),
      audit_trail: [...(opportunity.audit_trail || []), auditEntry]
    };
    
    handleSave(updatedOpportunity);
  };

  const getStageColor = (stage) => {
    const colors = {
      'Complete': 'success',
      'Review': 'info', 
      'Proposal': 'primary',
      'Shaping': 'warning',
      'In Research': 'secondary',
      'Intake': 'primary',
      'Needs More Info': 'danger',
      'New': 'secondary'
    };
    return colors[stage] || 'secondary';
  };

  if (loading) {
    return (
      <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-light bg-opacity-75" style={{zIndex: 1050}}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status" style={{width: '3rem', height: '3rem'}}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <div className="text-muted">Loading opportunity details...</div>
        </div>
      </div>
    );
  }

  if (error || !opportunity) {
    return (
      <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-light bg-opacity-75" style={{zIndex: 1050}}>
        <div className="card shadow-lg" style={{maxWidth: '400px', width: '100%'}}>
          <div className="card-body text-center">
            <AlertCircle size={48} className="text-danger mb-3" />
            <h4 className="text-dark mb-3">{error || 'Opportunity not found'}</h4>
            <button onClick={onClose} className="btn btn-primary">
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'details', label: 'Details', icon: FileText },
    { id: 'audit', label: 'Audit Trail', icon: Clock },
    { id: 'resources', label: 'Resources', icon: Users }
  ];

  return (
    <div className="position-fixed top-0 start-0 w-100 h-100 bg-light" style={{zIndex: 1040}}>
      <div className="h-100 d-flex flex-column">
        {/* Header */}
        <div className="bg-white border-bottom shadow-sm flex-shrink-0">
          <div className="container-fluid p-4">
            <div className="d-flex align-items-start justify-content-between mb-3">
              <div className="d-flex align-items-start">
                <button
                  onClick={onClose}
                  className="btn btn-outline-secondary me-3 flex-shrink-0"
                  title="Close"
                >
                  <ArrowLeft size={18} />
                </button>
                <div className="min-w-0 flex-grow-1">
                  <h1 className="h3 fw-bold text-dark mb-1 text-truncate">{opportunity.sfdc_id}</h1>
                  <p className="text-muted mb-0 text-truncate">{opportunity.client_ask}</p>
                  {opportunity.client && (
                    <small className="text-muted">Client: {opportunity.client}</small>
                  )}
                </div>
              </div>

              <div className="d-flex align-items-center gap-2 flex-shrink-0">
                {/* Stage Badge */}
                <span className={`badge bg-${getStageColor(opportunity.stage)} fs-6 px-3 py-2`}>
                  {opportunity.stage}
                </span>

                {/* Action Buttons */}
                {!isEditing && canEditOpportunity(user, opportunity) && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="btn btn-primary d-flex align-items-center"
                  >
                    <Edit size={16} className="me-2" />
                    Edit
                  </button>
                )}

                {isEditing && (
                  <button
                    onClick={handleCancel}
                    className="btn btn-outline-secondary d-flex align-items-center"
                  >
                    <X size={16} className="me-2" />
                    Cancel
                  </button>
                )}
              </div>
            </div>

            {/* Unsaved Changes Warning */}
            {hasUnsavedChanges && (
              <div className="alert alert-warning d-flex align-items-center mb-3">
                <AlertCircle size={16} className="me-2 flex-shrink-0" />
                <span>You have unsaved changes. Don't forget to save!</span>
              </div>
            )}

            {/* Navigation Tabs */}
            <ul className="nav nav-tabs" role="tablist">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <li className="nav-item" key={tab.id}>
                    <button
                      onClick={() => setActiveTab(tab.id)}
                      className={`nav-link d-flex align-items-center ${
                        activeTab === tab.id ? 'active' : ''
                      }`}
                      type="button"
                      role="tab"
                    >
                      <Icon size={16} className="me-2" />
                      {tab.label}
                      {tab.id === 'audit' && opportunity.audit_trail && (
                        <span className="badge bg-secondary ms-2 small">
                          {opportunity.audit_trail.length}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-grow-1 overflow-hidden">
          <div className="tab-content h-100">
            {/* Details Tab */}
            <div className={`tab-pane fade h-100 ${activeTab === 'details' ? 'show active' : ''}`}>
              <div className="h-100 d-flex">
                {/* Main Content */}
                <div className="flex-grow-1 overflow-auto">
                  <div className="p-4">
                    <OpportunityEditor
                      opportunity={opportunity}
                      isEditing={isEditing}
                      onSave={handleSave}
                      onCancel={handleCancel}
                      onUnsavedChanges={setHasUnsavedChanges}
                      user={user}
                    />
                  </div>
                </div>

                {/* Stage Manager Sidebar */}
                {canChangeStage(user, opportunity, 'any') && (
                  <div className="border-start bg-white flex-shrink-0" style={{width: '350px'}}>
                    <div className="h-100 overflow-auto">
                      <StageManager
                        opportunity={opportunity}
                        user={user}
                        onStageChange={handleStageChange}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Audit Trail Tab */}
            <div className={`tab-pane fade h-100 ${activeTab === 'audit' ? 'show active' : ''}`}>
              <AuditTrail
                opportunity={opportunity}
                onAddEntry={addAuditEntry}
              />
            </div>

            {/* Resources Tab */}
            <div className={`tab-pane fade h-100 ${activeTab === 'resources' ? 'show active' : ''}`}>
              <POCManager
                opportunity={opportunity}
                user={user}
                onUpdate={handleSave}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailView;