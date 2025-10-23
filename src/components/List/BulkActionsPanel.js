import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';

const BulkActionsPanel = ({ selectedCount, selectedOpportunities, onClear, onStageChange }) => {
  const { user, canTransitionStage } = useAuth();
  const { STAGES } = useData();
  const [showActions, setShowActions] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  // Get stages that all selected opportunities can transition to
  const getAvailableStageTransitions = () => {
    if (selectedOpportunities.length === 0) return [];
    
    // Find stages that ALL selected opportunities can transition to
    return STAGES.filter(targetStage => {
      return selectedOpportunities.every(opp => 
        opp.stage !== targetStage && canTransitionStage(opp.stage, targetStage)
      );
    });
  };

  const handleBulkStageChange = (newStage) => {
    setPendingAction({
      type: 'stage_change',
      stage: newStage,
      message: `Move ${selectedCount} opportunities to ${newStage}?`
    });
    setShowConfirm(true);
  };

  const handleBulkExport = () => {
    // Create CSV of selected opportunities
    const headers = ['Specialist', 'SFDC ID', 'Client', 'Stage', 'Client Ask', 'Industry', 'Updated Date'];
    const rows = selectedOpportunities.map(opp => [
      opp.specialist,
      opp.sfdc_id,
      opp.client,
      opp.stage,
      opp.client_ask?.replace(/"/g, '""'), // Escape quotes
      opp.industry || '',
      new Date(opp.updated_date).toLocaleDateString()
    ]);
    
    const csvContent = [headers, ...rows].map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `selected_opportunities_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const confirmAction = () => {
    if (pendingAction?.type === 'stage_change') {
      onStageChange(pendingAction.stage);
    }
    setShowConfirm(false);
    setPendingAction(null);
    onClear();
  };

  const availableTransitions = getAvailableStageTransitions();

  return (
    <>
      {/* Bulk Actions Bar */}
      <div className="alert alert-primary border-primary" role="alert">
        <div className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-3">
            <div className="d-flex align-items-center gap-2">
              <svg className="text-primary" style={{height: '1.25rem', width: '1.25rem'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="fw-medium">
                {selectedCount} {selectedCount === 1 ? 'opportunity' : 'opportunities'} selected
              </span>
            </div>

            <div className="d-flex align-items-center gap-2">
              {/* Stage Change Dropdown */}
              {availableTransitions.length > 0 && (
                <div className="dropdown">
                  <button
                    onClick={() => setShowActions(!showActions)}
                    className="btn btn-sm btn-outline-primary dropdown-toggle"
                    type="button"
                  >
                    Change Stage
                  </button>

                  {showActions && (
                    <div className="dropdown-menu show position-absolute">
                      {availableTransitions.map(stage => (
                        <button
                          key={stage}
                          onClick={() => {
                            handleBulkStageChange(stage);
                            setShowActions(false);
                          }}
                          className="dropdown-item"
                        >
                          Move to {stage}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Export Button */}
              <button
                onClick={handleBulkExport}
                className="btn btn-sm btn-outline-primary"
              >
                <svg className="me-1" style={{height: '0.75rem', width: '0.75rem'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export Selected
              </button>
            </div>
          </div>

          {/* Clear Selection */}
          <button
            onClick={onClear}
            className="btn btn-sm btn-link text-primary"
          >
            Clear Selection
          </button>
        </div>

        {/* Selected Items Summary */}
        <div className="mt-3 small text-primary">
          <div className="d-flex flex-wrap gap-3">
            {/* Stage Breakdown */}
            <div>
              <span className="fw-medium">By Stage:</span>{' '}
              {Object.entries(
                selectedOpportunities.reduce((acc, opp) => {
                  acc[opp.stage] = (acc[opp.stage] || 0) + 1;
                  return acc;
                }, {})
              ).map(([stage, count]) => (
                <span key={stage} className="me-2">
                  {stage}: {count}
                </span>
              ))}
            </div>
            
            {/* Specialist Breakdown */}
            <div>
              <span className="fw-medium">By Specialist:</span>{' '}
              {Object.entries(
                selectedOpportunities.reduce((acc, opp) => {
                  acc[opp.specialist] = (acc[opp.specialist] || 0) + 1;
                  return acc;
                }, {})
              ).map(([specialist, count]) => (
                <span key={specialist} className="me-2">
                  {specialist}: {count}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <>
          <div className="modal-backdrop show"></div>
          <div className="modal show d-block" tabIndex="-1" role="dialog">
            <div className="modal-dialog modal-dialog-centered" role="document">
              <div className="modal-content">
                <div className="modal-header">
                  <div className="d-flex align-items-center">
                    <svg className="text-warning me-2" style={{height: '1.5rem', width: '1.5rem'}} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.764 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <h5 className="modal-title mb-0">
                      Confirm Bulk Action
                    </h5>
                  </div>
                </div>
                <div className="modal-body">
                  <p>{pendingAction?.message}</p>
                  <p className="text-muted small mb-0">
                    This action cannot be undone.
                  </p>
                </div>
                <div className="modal-footer">
                  <button
                    onClick={() => {
                      setShowConfirm(false);
                      setPendingAction(null);
                    }}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmAction}
                    className="btn btn-danger"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default BulkActionsPanel;