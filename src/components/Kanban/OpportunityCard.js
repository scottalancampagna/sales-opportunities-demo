import React, { useState } from 'react';
import { User, Building, DollarSign, Calendar, Clock, AlertCircle, CheckCircle, Users } from 'lucide-react';

const OpportunityCard = ({ opportunity, onDragStart, onDragEnd, onClick, currentUser, stageColor }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e) => {
    setIsDragging(true);
    onDragStart(opportunity);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.outerHTML);
  };

  const handleDragEnd = (e) => {
    setIsDragging(false);
    onDragEnd();
  };

  const formatValue = (value) => {
    if (!value) return null;
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toLocaleString()}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getPriorityIndicator = () => {
    const value = opportunity.aop_value || 0;
    if (value >= 1000000) return { color: 'danger', label: 'High Value' };
    if (value >= 500000) return { color: 'warning', label: 'Medium Value' };
    if (value >= 100000) return { color: 'info', label: 'Standard' };
    return { color: 'secondary', label: 'Low Value' };
  };

  const getAssignmentStatus = () => {
    const resources = opportunity.assigned_resources || {};
    const assigned = Object.values(resources).filter(Boolean).length;
    const total = Object.keys(resources).length;
    
    if (assigned === 0) return { icon: AlertCircle, color: 'text-muted', text: 'No assignments' };
    if (assigned === total) return { icon: CheckCircle, color: 'text-success', text: 'Fully staffed' };
    return { icon: Users, color: 'text-warning', text: `${assigned}/${total} assigned` };
  };

  const isMyOpportunity = opportunity.specialist === currentUser?.name;
  const priority = getPriorityIndicator();
  const assignment = getAssignmentStatus();
  const AssignmentIcon = assignment.icon;

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={onClick}
      className={`card shadow-sm border-start border-4 ${
        isMyOpportunity ? `border-${stageColor?.text?.replace('text-', '') || 'primary'}` : 'border-light'
      } ${
        isDragging ? 'opacity-50' : ''
      } cursor-pointer transition-all hover:shadow-md`}
      style={{cursor: 'grab'}}
      onMouseDown={(e) => e.currentTarget.style.cursor = 'grabbing'}
      onMouseUp={(e) => e.currentTarget.style.cursor = 'grab'}
    >
      <div className="card-body p-3">
        {/* Header */}
        <div className="d-flex align-items-start justify-content-between mb-2">
          <div className="flex-grow-1 min-w-0">
            <h6 className="card-title small fw-semibold mb-1 line-clamp-2 text-dark">
              {opportunity.client_ask || 'No description'}
            </h6>
            {opportunity.sfdc_id && (
              <div className="small text-muted font-monospace mb-1">
                {opportunity.sfdc_id}
              </div>
            )}
          </div>
          {opportunity.aop_value && (
            <span className={`badge bg-${priority.color} bg-opacity-25 text-${priority.color} ms-2 flex-shrink-0`}>
              {formatValue(opportunity.aop_value)}
            </span>
          )}
        </div>

        {/* Client */}
        {opportunity.client && (
          <div className="d-flex align-items-center text-muted small mb-2">
            <Building size={12} className="me-1 flex-shrink-0" />
            <span className="text-truncate">{opportunity.client}</span>
          </div>
        )}

        {/* Specialist */}
        <div className="d-flex align-items-center text-muted small mb-2">
          <User size={12} className="me-1 flex-shrink-0" />
          <span className={`text-truncate ${isMyOpportunity ? 'text-primary fw-medium' : ''}`}>
            {opportunity.specialist}
            {isMyOpportunity && <span className="ms-1">(You)</span>}
          </span>
        </div>

        {/* Financial Information */}
        {(opportunity.aop_value || opportunity.eenu_value) && (
          <div className="row g-1 text-muted small mb-2">
            {opportunity.aop_value && (
              <div className="col-6">
                <div className="d-flex align-items-center">
                  <DollarSign size={10} className="me-1" />
                  <span className="small">AOP: {formatValue(opportunity.aop_value)}</span>
                </div>
              </div>
            )}
            {opportunity.eenu_value && (
              <div className="col-6">
                <div className="d-flex align-items-center">
                  <span className="small">EENU: {formatValue(opportunity.eenu_value)}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Dates */}
        <div className="d-flex align-items-center justify-content-between text-muted small mb-2">
          <div className="d-flex align-items-center">
            <Calendar size={10} className="me-1" />
            <span>Created {formatDate(opportunity.created_date)}</span>
          </div>
          {opportunity.updated_date && opportunity.updated_date !== opportunity.created_date && (
            <div className="d-flex align-items-center">
              <Clock size={10} className="me-1" />
              <span>Updated {formatDate(opportunity.updated_date)}</span>
            </div>
          )}
        </div>

        {/* Offerings */}
        {opportunity.offerings && opportunity.offerings.length > 0 && (
          <div className="mb-2">
            <div className="d-flex flex-wrap gap-1">
              {opportunity.offerings.slice(0, 2).map(offering => (
                <span key={offering} className="badge bg-light text-dark small">
                  {offering.length > 10 ? offering.substring(0, 10) + '...' : offering}
                </span>
              ))}
              {opportunity.offerings.length > 2 && (
                <span className="badge bg-secondary small">
                  +{opportunity.offerings.length - 2}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Assignment Status */}
        <div className="d-flex align-items-center justify-content-between">
          <div className={`d-flex align-items-center ${assignment.color} small`}>
            <AssignmentIcon size={12} className="me-1" />
            <span>{assignment.text}</span>
          </div>
          
          {/* Priority Indicator */}
          <div className={`badge bg-${priority.color} bg-opacity-10 text-${priority.color} small`}>
            {priority.label}
          </div>
        </div>

        {/* Due Date Warning */}
        {opportunity.proposal_due_date && (
          (() => {
            const dueDate = new Date(opportunity.proposal_due_date);
            const today = new Date();
            const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
            
            if (daysUntilDue <= 7 && daysUntilDue >= 0) {
              return (
                <div className="alert alert-warning py-1 px-2 mt-2 mb-0 small">
                  <Clock size={10} className="me-1" />
                  Due in {daysUntilDue} day{daysUntilDue !== 1 ? 's' : ''}
                </div>
              );
            } else if (daysUntilDue < 0) {
              return (
                <div className="alert alert-danger py-1 px-2 mt-2 mb-0 small">
                  <AlertCircle size={10} className="me-1" />
                  Overdue by {Math.abs(daysUntilDue)} day{Math.abs(daysUntilDue) !== 1 ? 's' : ''}
                </div>
              );
            }
            return null;
          })()
        )}
      </div>

      {/* Card Footer */}
      {isMyOpportunity && (
        <div className={`card-footer bg-${stageColor?.text?.replace('text-', '') || 'primary'} bg-opacity-10 py-1 px-3`}>
          <small className={`${stageColor?.text || 'text-primary'} fw-medium`}>
            Your Opportunity
          </small>
        </div>
      )}
    </div>
  );
};

export default OpportunityCard;