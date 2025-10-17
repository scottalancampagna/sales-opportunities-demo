import React, { useState } from 'react';
import { ArrowRight, Check, AlertTriangle, Clock, User, CheckCircle, Circle } from 'lucide-react';
import { canChangeStage, getAvailableStages } from '../../utils/permissions';
import { STAGES, STAGE_TRANSITIONS } from '../../utils/constants';

const StageManager = ({ opportunity, user, onStageChange }) => {
  const [selectedStage, setSelectedStage] = useState('');
  const [isChanging, setIsChanging] = useState(false);
  const [changeReason, setChangeReason] = useState('');

  const availableStages = getAvailableStages(user, opportunity);
  const currentStage = opportunity.stage;
  const currentStageIndex = STAGES.indexOf(currentStage);

  const handleStageChange = async () => {
    if (!selectedStage || !changeReason.trim()) {
      alert('Please select a stage and provide a reason for the change');
      return;
    }

    setIsChanging(true);

    try {
      const auditEntry = {
        timestamp: new Date().toISOString(),
        user: user.name,
        action: 'stage_change',
        field: 'stage',
        old_value: currentStage,
        new_value: selectedStage,
        notes: changeReason.trim()
      };

      await onStageChange(selectedStage, auditEntry);
      
      // Reset form
      setSelectedStage('');
      setChangeReason('');
    } catch (error) {
      console.error('Error changing stage:', error);
      alert('Error changing stage. Please try again.');
    } finally {
      setIsChanging(false);
    }
  };

  const getStageColor = (stage, isActive = false, isCompleted = false) => {
    if (isCompleted) return 'success';
    if (isActive) return 'primary';
    
    const colors = {
      'New': 'secondary',
      'Intake': 'primary',
      'Needs More Info': 'danger',
      'In Research': 'warning',
      'Shaping': 'info',
      'Proposal': 'primary',
      'Review': 'dark',
      'Complete': 'success'
    };
    return colors[stage] || 'secondary';
  };

  const getStageDescription = (stage) => {
    const descriptions = {
      'New': 'Initial opportunity capture',
      'Intake': 'Under review by GTM team',
      'Needs More Info': 'Additional information required',
      'In Research': 'Research and analysis phase',
      'Shaping': 'Solution shaping and planning',
      'Proposal': 'Proposal development',
      'Review': 'Final review and approval',
      'Complete': 'Opportunity completed'
    };
    return descriptions[stage] || '';
  };

  const canUserChangeStage = canChangeStage(user, opportunity, 'any');

  return (
    <div className="p-4 h-100 overflow-auto">
      {/* Current Stage */}
      <div className="mb-4">
        <h5 className="fw-bold text-dark mb-3">Current Stage</h5>
        <div className={`card border-${getStageColor(currentStage, true)} border-2 shadow-sm`}>
          <div className={`card-body bg-${getStageColor(currentStage, true)} bg-opacity-10`}>
            <div className="d-flex align-items-center justify-content-between mb-2">
              <h6 className="fw-bold mb-0 text-dark">{currentStage}</h6>
              <CheckCircle size={20} className={`text-${getStageColor(currentStage, true)}`} />
            </div>
            <small className={`text-${getStageColor(currentStage, true)}`}>
              {getStageDescription(currentStage)}
            </small>
          </div>
        </div>
      </div>

      {/* Stage Progress Timeline */}
      <div className="mb-4">
        <h5 className="fw-bold text-dark mb-3">Progress Timeline</h5>
        <div className="timeline position-relative">
          {STAGES.map((stage, index) => {
            const isCompleted = index < currentStageIndex;
            const isActive = stage === currentStage;
            const isNext = availableStages.includes(stage);
            const isLast = index === STAGES.length - 1;
            
            return (
              <div key={stage} className="d-flex align-items-center mb-3 position-relative">
                {/* Timeline Line */}
                {!isLast && (
                  <div 
                    className={`position-absolute border-start border-2 ${
                      isCompleted ? 'border-success' : 
                      isActive ? 'border-primary' : 
                      'border-light'
                    }`}
                    style={{
                      left: '11px',
                      top: '24px',
                      height: '24px',
                      zIndex: 0
                    }}
                  />
                )}
                
                {/* Stage Icon */}
                <div className="flex-shrink-0 me-3 position-relative" style={{zIndex: 1}}>
                  {isCompleted ? (
                    <div className="bg-success rounded-circle d-flex align-items-center justify-content-center border border-3 border-white shadow-sm" 
                         style={{width: '24px', height: '24px'}}>
                      <Check size={14} className="text-white" />
                    </div>
                  ) : isActive ? (
                    <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center border border-3 border-white shadow-sm"
                         style={{width: '24px', height: '24px'}}>
                      <div className="bg-white rounded-circle" style={{width: '8px', height: '8px'}}></div>
                    </div>
                  ) : isNext ? (
                    <div className="bg-warning rounded-circle d-flex align-items-center justify-content-center border border-3 border-white shadow-sm"
                         style={{width: '24px', height: '24px'}}>
                      <Clock size={12} className="text-dark" />
                    </div>
                  ) : (
                    <div className="bg-light border border-2 border-secondary rounded-circle d-flex align-items-center justify-content-center shadow-sm"
                         style={{width: '24px', height: '24px'}}>
                      <Circle size={8} className="text-secondary" />
                    </div>
                  )}
                </div>
                
                {/* Stage Info */}
                <div className="flex-grow-1">
                  <div className={`small fw-medium ${
                    isCompleted ? 'text-success' :
                    isActive ? 'text-primary' :
                    isNext ? 'text-warning' :
                    'text-muted'
                  }`}>
                    {stage}
                  </div>
                  <div className="text-muted" style={{fontSize: '0.75rem'}}>
                    {getStageDescription(stage)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stage Change Interface */}
      {canUserChangeStage && availableStages.length > 0 && (
        <div className="mb-4">
          <h5 className="fw-bold text-dark mb-3">Change Stage</h5>
          
          <div className="card shadow-sm">
            <div className="card-body">
              {/* Available Stages */}
              <div className="mb-3">
                <label className="form-label small fw-medium text-dark">
                  Move to Stage
                </label>
                <select
                  value={selectedStage}
                  onChange={(e) => setSelectedStage(e.target.value)}
                  className="form-select"
                  disabled={isChanging}
                >
                  <option value="">Select new stage...</option>
                  {availableStages.map(stage => (
                    <option key={stage} value={stage}>{stage}</option>
                  ))}
                </select>
              </div>

              {/* Reason */}
              <div className="mb-3">
                <label className="form-label small fw-medium text-dark">
                  Reason for Change <span className="text-danger">*</span>
                </label>
                <textarea
                  value={changeReason}
                  onChange={(e) => setChangeReason(e.target.value)}
                  rows={3}
                  className="form-control"
                  placeholder="Explain why this stage change is needed..."
                  disabled={isChanging}
                />
              </div>

              {/* Preview */}
              {selectedStage && (
                <div className="alert alert-info d-flex align-items-start mb-3">
                  <ArrowRight size={16} className="me-2 mt-1 flex-shrink-0" />
                  <div className="small">
                    <div className="fw-medium">
                      <strong>{currentStage}</strong> → <strong>{selectedStage}</strong>
                    </div>
                    <div className="text-muted mt-1">
                      {getStageDescription(selectedStage)}
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                onClick={handleStageChange}
                disabled={!selectedStage || !changeReason.trim() || isChanging}
                className="btn btn-primary w-100 d-flex align-items-center justify-content-center"
              >
                {isChanging ? (
                  <>
                    <div className="spinner-border spinner-border-sm me-2" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    Changing Stage...
                  </>
                ) : (
                  <>
                    <ArrowRight size={16} className="me-2" />
                    Change Stage
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permission Messages */}
      {!canUserChangeStage && (
        <div className="alert alert-warning d-flex align-items-start mb-4">
          <AlertTriangle size={16} className="me-2 mt-1 flex-shrink-0" />
          <div>
            <div className="fw-medium small">Stage Change Restricted</div>
            <div className="small">
              Your role ({user.role}) doesn't have permission to change stages from {currentStage}.
            </div>
          </div>
        </div>
      )}

      {canUserChangeStage && availableStages.length === 0 && (
        <div className="alert alert-info d-flex align-items-start mb-4">
          <AlertTriangle size={16} className="me-2 mt-1 flex-shrink-0" />
          <div>
            <div className="fw-medium small">No Stage Transitions Available</div>
            <div className="small">
              There are no valid stage transitions from {currentStage} for your role.
            </div>
          </div>
        </div>
      )}

      {/* Recent Stage Changes */}
      <div>
        <h6 className="fw-bold text-dark mb-3">Recent Changes</h6>
        <div className="d-flex flex-column gap-2">
          {(opportunity.audit_trail || [])
            .filter(entry => entry.action === 'stage_change')
            .slice(0, 3)
            .map((entry, index) => (
              <div key={index} className="card shadow-sm">
                <div className="card-body p-3">
                  <div className="d-flex align-items-start">
                    <User size={14} className="text-muted me-2 mt-1 flex-shrink-0" />
                    <div className="flex-grow-1 min-w-0">
                      <div className="small">
                        <span className="fw-medium text-primary">{entry.user}</span>
                        <span className="text-muted"> changed stage</span>
                      </div>
                      <div className="small text-muted d-flex align-items-center mt-1">
                        <span className="me-2">{entry.old_value}</span>
                        <ArrowRight size={10} className="me-2" />
                        <span>{entry.new_value}</span>
                      </div>
                      {entry.notes && (
                        <div className="small text-muted fst-italic mt-1 p-2 bg-light rounded">
                          "{entry.notes}"
                        </div>
                      )}
                      <div className="small text-muted mt-1">
                        <Clock size={10} className="me-1" />
                        {new Date(entry.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          
          {(opportunity.audit_trail || []).filter(entry => entry.action === 'stage_change').length === 0 && (
            <div className="text-center text-muted small py-4">
              <Clock size={32} className="mb-2 opacity-50" />
              <div>No stage changes yet</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StageManager;