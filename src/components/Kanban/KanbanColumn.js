import React, { useState } from 'react';
import { Plus, MoreVertical } from 'lucide-react';
import OpportunityCard from './OpportunityCard';

const KanbanColumn = ({ 
  stage, 
  opportunities, 
  totalValue, 
  onDragStart, 
  onDragEnd, 
  onDrop, 
  onOpportunityClick,
  canDropFrom,
  isDraggedOver,
  currentUser
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleDragOver = (e) => {
    if (canDropFrom) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    } else {
      e.dataTransfer.dropEffect = 'none';
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    setIsHovered(canDropFrom);
  };

  const handleDragLeave = (e) => {
    // Only set hover to false if we're leaving the column entirely
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsHovered(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsHovered(false);
    if (canDropFrom) {
      onDrop(stage);
    }
  };

  const getStageColor = (stage) => {
    const colors = {
      'New': { bg: 'bg-secondary', border: 'border-secondary', text: 'text-secondary' },
      'Intake': { bg: 'bg-primary', border: 'border-primary', text: 'text-primary' },
      'Needs More Info': { bg: 'bg-danger', border: 'border-danger', text: 'text-danger' },
      'In Research': { bg: 'bg-warning', border: 'border-warning', text: 'text-warning' },
      'Shaping': { bg: 'bg-info', border: 'border-info', text: 'text-info' },
      'Proposal': { bg: 'bg-primary', border: 'border-primary', text: 'text-primary' },
      'Review': { bg: 'bg-dark', border: 'border-dark', text: 'text-dark' },
      'Complete': { bg: 'bg-success', border: 'border-success', text: 'text-success' }
    };
    return colors[stage] || colors['New'];
  };

  const stageColors = getStageColor(stage);
  const myOpportunities = opportunities.filter(opp => opp.specialist === currentUser?.name).length;

  return (
    <div className="flex-shrink-0" style={{width: '320px'}}>
      {/* Column Header */}
      <div className={`card border-2 ${stageColors.border} shadow-sm mb-3`}>
        <div className={`card-header ${stageColors.bg} bg-opacity-10 border-bottom-0 py-3`}>
          <div className="d-flex align-items-center justify-content-between">
            <div className="flex-grow-1">
              <h5 className={`card-title mb-1 ${stageColors.text} fw-bold`}>
                {stage}
              </h5>
              <div className="d-flex align-items-center gap-3">
                <span className={`badge ${stageColors.bg} bg-opacity-25 ${stageColors.text} px-2 py-1`}>
                  {opportunities.length} total
                </span>
                {myOpportunities > 0 && (
                  <span className="badge bg-primary bg-opacity-25 text-primary px-2 py-1">
                    {myOpportunities} mine
                  </span>
                )}
              </div>
            </div>
            <div className="dropdown">
              <button 
                className="btn btn-sm btn-outline-secondary border-0"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <MoreVertical size={14} />
              </button>
              <ul className="dropdown-menu dropdown-menu-end">
                <li>
                  <button 
                    className="dropdown-item small"
                    onClick={() => window.location.hash = `#/list/${stage.toLowerCase().replace(' ', '-')}`}
                  >
                    View in List
                  </button>
                </li>
              </ul>
            </div>
          </div>
          
          {totalValue > 0 && (
            <div className={`text-muted small mt-2`}>
              <span className="fw-medium">${(totalValue / 1000000).toFixed(1)}M</span> total value
            </div>
          )}
        </div>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`card border-2 ${stageColors.border} border-opacity-25 ${
          isHovered && canDropFrom ? `${stageColors.bg} bg-opacity-10 border-opacity-100` : ''
        } ${
          isHovered && !canDropFrom ? 'bg-danger bg-opacity-10 border-danger border-opacity-75' : ''
        }`}
        style={{minHeight: '500px'}}
      >
        <div className="card-body p-3">
          {/* Drop Indicator */}
          {isDraggedOver && (
            <div className={`text-center py-4 border-2 border-dashed rounded mb-3 ${
              canDropFrom 
                ? `${stageColors.border} ${stageColors.text} ${stageColors.bg} bg-opacity-10` 
                : 'border-danger text-danger bg-danger bg-opacity-10'
            }`}>
              <div className="fw-medium small">
                {canDropFrom ? (
                  <>
                    <Plus size={20} className="mb-2 d-block mx-auto" />
                    Drop to move to {stage}
                  </>
                ) : (
                  <>
                    <span className="fs-4 mb-2 d-block">⚠️</span>
                    Cannot drop here
                  </>
                )}
              </div>
            </div>
          )}

          {/* Opportunity Cards */}
          <div className="d-flex flex-column gap-3">
            {opportunities.map(opportunity => (
              <OpportunityCard
                key={opportunity.id}
                opportunity={opportunity}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                onClick={() => onOpportunityClick(opportunity.id)}
                currentUser={currentUser}
                stageColor={stageColors}
              />
            ))}
          </div>

          {/* Empty State */}
          {opportunities.length === 0 && !isDraggedOver && (
            <div className="text-center py-5">
              <div className="text-muted">
                <Plus size={32} className="mb-3 opacity-25" />
                <div className="small">No opportunities in {stage}</div>
                <div className="small text-muted">Drag opportunities here to move them</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KanbanColumn;