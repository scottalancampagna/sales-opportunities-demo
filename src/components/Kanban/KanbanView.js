import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw, Filter, TrendingUp, BarChart3 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { canChangeStage } from '../../utils/permissions';
import { STAGES, STAGE_TRANSITIONS } from '../../utils/constants';
import dataService from '../../services/DataService';
import KanbanColumn from './KanbanColumn';

const KanbanView = () => {
  const { user } = useAuth();
  const [opportunities, setOpportunities] = useState([]);
  const [filteredOpportunities, setFilteredOpportunities] = useState([]);
  const [draggedOpportunity, setDraggedOpportunity] = useState(null);
  const [filterBy, setFilterBy] = useState('all');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadOpportunities();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [opportunities, filterBy]);

  const loadOpportunities = async () => {
    setIsLoading(true);
    try {
      console.log('Kanban: Loading opportunities via DataService...');
      const opps = await dataService.getOpportunities();
      console.log('Kanban: Loaded opportunities:', opps.length);
      setOpportunities(opps);
    } catch (error) {
      console.error('Error loading opportunities via DataService:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...opportunities];

    if (filterBy === 'my-opportunities') {
      filtered = filtered.filter(opp => opp.specialist === user?.name);
    } else if (filterBy === 'high-value') {
      filtered = filtered.filter(opp => (opp.aop_value || 0) >= 500000);
    } else if (filterBy === 'recent') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      filtered = filtered.filter(opp => new Date(opp.updated_date || opp.created_date) >= weekAgo);
    }

    setFilteredOpportunities(filtered);
  };

  const handleDragStart = (opportunity) => {
    setDraggedOpportunity(opportunity);
  };

  const handleDragEnd = () => {
    setDraggedOpportunity(null);
  };

  const handleDrop = async (targetStage) => {
    if (!draggedOpportunity || draggedOpportunity.stage === targetStage) {
      return;
    }

    // Check if transition is allowed
    const validTransitions = STAGE_TRANSITIONS[draggedOpportunity.stage] || [];
    if (!validTransitions.includes(targetStage)) {
      showToast(`Cannot move from ${draggedOpportunity.stage} to ${targetStage}`, 'danger');
      return;
    }

    // Check permissions
    if (!canChangeStage(user, draggedOpportunity, targetStage)) {
      showToast('You do not have permission to make this stage change', 'warning');
      return;
    }

    try {
      console.log(`Kanban: Moving opportunity ${draggedOpportunity.id} from ${draggedOpportunity.stage} to ${targetStage}`);
      
      // Use DataService to update the opportunity
      const updates = {
        stage: targetStage
      };
      
      const updatedOpportunity = await dataService.updateOpportunity(draggedOpportunity.id, updates);
      console.log('Kanban: Updated opportunity stage via DataService');
      
      // Update local state to reflect the change immediately
      const updatedOpportunities = opportunities.map(opp => 
        opp.id === draggedOpportunity.id ? { ...opp, ...updatedOpportunity } : opp
      );
      setOpportunities(updatedOpportunities);
      
      showToast(`Moved "${draggedOpportunity.client_ask?.substring(0, 30)}..." to ${targetStage}`, 'success');
    } catch (error) {
      console.error('Error updating opportunity stage via DataService:', error);
      showToast('Failed to update opportunity stage. Please try again.', 'danger');
    }
  };

  const showToast = (message, type = 'info') => {
    const toastContainer = document.createElement('div');
    toastContainer.className = 'position-fixed top-0 end-0 p-3';
    toastContainer.style.zIndex = '9999';
    
    const bgColor = {
      success: 'bg-success',
      danger: 'bg-danger', 
      warning: 'bg-warning text-dark',
      info: 'bg-info'
    }[type] || 'bg-info';

    toastContainer.innerHTML = `
      <div class="toast show" role="alert">
        <div class="toast-header ${bgColor} text-white">
          <strong class="me-auto">Kanban</strong>
          <button type="button" class="btn-close btn-close-white" onclick="this.closest('.toast').parentElement.remove()"></button>
        </div>
        <div class="toast-body">${message}</div>
      </div>
    `;
    document.body.appendChild(toastContainer);
    setTimeout(() => toastContainer.remove(), 4000);
  };

  const handleOpportunityClick = (opportunityId) => {
    window.location.hash = `#/detail/${opportunityId}`;
  };

  const getOpportunitiesForStage = (stage) => {
    return filteredOpportunities.filter(opp => opp.stage === stage);
  };

  const getTotalValue = (stage) => {
    return getOpportunitiesForStage(stage)
      .reduce((sum, opp) => sum + (opp.aop_value || 0), 0);
  };

  const getTotalStats = () => {
    const total = filteredOpportunities.length;
    const totalValue = filteredOpportunities.reduce((sum, opp) => sum + (opp.aop_value || 0), 0);
    const myOpportunities = filteredOpportunities.filter(opp => opp.specialist === user?.name).length;
    
    return { total, totalValue, myOpportunities };
  };

  const stats = getTotalStats();

  return (
    <div className="h-100 d-flex flex-column bg-light">
      {/* Header */}
      <div className="bg-white border-bottom shadow-sm p-4 flex-shrink-0">
        <div className="container-fluid">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div>
              <h1 className="h3 fw-bold text-dark mb-1 d-flex align-items-center">
                <BarChart3 className="me-3 text-primary" size={28} />
                Kanban Board
              </h1>
              <p className="text-muted mb-0">Drag and drop opportunities between stages</p>
            </div>
            
            <div className="d-flex align-items-center gap-2">
              <button
                onClick={loadOpportunities}
                disabled={isLoading}
                className="btn btn-outline-primary d-flex align-items-center"
              >
                <RefreshCw size={16} className={`me-2 ${isLoading ? 'spin' : ''}`} />
                Refresh
              </button>
              
              <button
                onClick={() => window.location.hash = '#/add'}
                className="btn btn-primary d-flex align-items-center"
              >
                <Plus size={16} className="me-2" />
                Add Opportunity
              </button>
            </div>
          </div>

          {/* Filters and Stats */}
          <div className="row g-3 align-items-center">
            <div className="col-md-6">
              <div className="d-flex align-items-center gap-2">
                <Filter size={16} className="text-muted" />
                <select
                  value={filterBy}
                  onChange={(e) => setFilterBy(e.target.value)}
                  className="form-select form-select-sm"
                  style={{width: 'auto'}}
                >
                  <option value="all">All Opportunities</option>
                  <option value="my-opportunities">My Opportunities</option>
                  <option value="high-value">High Value (≥$500K)</option>
                  <option value="recent">Recent Updates</option>
                </select>
              </div>
            </div>
            
            <div className="col-md-6">
              <div className="d-flex justify-content-end gap-4 text-muted small">
                <div className="d-flex align-items-center">
                  <TrendingUp size={14} className="me-1" />
                  <span>{stats.total} opportunities</span>
                </div>
                <div className="d-flex align-items-center">
                  <span className="text-success">$</span>
                  <span>{(stats.totalValue / 1000000).toFixed(1)}M total value</span>
                </div>
                {filterBy === 'all' && (
                  <div className="d-flex align-items-center">
                    <span className="text-primary me-1">{stats.myOpportunities}</span>
                    <span>mine</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-grow-1 overflow-hidden">
        <div className="h-100 overflow-auto p-4">
          <div className="d-flex gap-4" style={{minWidth: 'max-content'}}>
            {STAGES.map(stage => (
              <KanbanColumn
                key={stage}
                stage={stage}
                opportunities={getOpportunitiesForStage(stage)}
                totalValue={getTotalValue(stage)}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDrop={handleDrop}
                onOpportunityClick={handleOpportunityClick}
                canDropFrom={draggedOpportunity ? 
                  (STAGE_TRANSITIONS[draggedOpportunity.stage] || []).includes(stage) &&
                  canChangeStage(user, draggedOpportunity, stage) : false
                }
                isDraggedOver={draggedOpportunity && draggedOpportunity.stage !== stage}
                currentUser={user}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Footer Summary */}
      <div className="bg-white border-top p-3 flex-shrink-0">
        <div className="container-fluid">
          <div className="row text-center">
            <div className="col-md-4">
              <div className="d-flex align-items-center justify-content-center text-primary">
                <TrendingUp size={16} className="me-2" />
                <span className="fw-semibold">{stats.total}</span>
                <span className="text-muted ms-1">Total Opportunities</span>
              </div>
            </div>
            <div className="col-md-4">
              <div className="d-flex align-items-center justify-content-center text-success">
                <span className="fw-semibold">${(stats.totalValue / 1000000).toFixed(1)}M</span>
                <span className="text-muted ms-1">Pipeline Value</span>
              </div>
            </div>
            <div className="col-md-4">
              <div className="d-flex align-items-center justify-content-center text-info">
                <span className="fw-semibold">{stats.myOpportunities}</span>
                <span className="text-muted ms-1">My Opportunities</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// CSS Animation for spinning refresh icon
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  .spin {
    animation: spin 1s linear infinite;
  }
`;
document.head.appendChild(style);

export default KanbanView;