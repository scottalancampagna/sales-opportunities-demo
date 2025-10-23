import React, { useState, useEffect } from 'react';
import { X, Save, RotateCcw, Info } from 'lucide-react';
import { useData } from '../../contexts/DataContext';

const StageSettingsModal = ({ isOpen, onClose }) => {
  const { expectedDurations, updateExpectedDuration, STAGES } = useData();
  const [localDurations, setLocalDurations] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLocalDurations({ ...expectedDurations });
      setHasChanges(false);
    }
  }, [isOpen, expectedDurations]);

  const handleDurationChange = (stage, value) => {
    const days = parseInt(value) || 0;
    setLocalDurations(prev => ({
      ...prev,
      [stage]: days
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    Object.entries(localDurations).forEach(([stage, days]) => {
      if (expectedDurations[stage] !== days) {
        updateExpectedDuration(stage, days);
      }
    });
    setHasChanges(false);
    onClose();
  };

  const handleReset = () => {
    setLocalDurations({ ...expectedDurations });
    setHasChanges(false);
  };

  const stageDescriptions = {
    'New': 'Time from opportunity creation to first review',
    'Intake': 'Time for initial assessment and routing decision', 
    'Needs More Info': 'Time waiting for additional information',
    'In Research': 'Time for research and analysis phase',
    'Shaping': 'Time for solution design and resource assignment',
    'Proposal': 'Time for proposal writing and internal review',
    'Review': 'Time for client review and feedback',
    'Complete': 'Terminal state - no duration limit'
  };

  if (!isOpen) return null;

  return (
    <div className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center" style={{zIndex: 1060}}>
      <div className="bg-white rounded shadow-lg" style={{width: '600px', maxHeight: '80vh'}}>
        {/* Header */}
        <div className="d-flex align-items-center justify-content-between p-4 border-bottom">
          <h5 className="mb-0 fw-semibold">Stage Duration Settings</h5>
          <button onClick={onClose} className="btn btn-sm btn-outline-secondary">
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4" style={{maxHeight: '60vh', overflowY: 'auto'}}>
          <div className="alert alert-info d-flex align-items-start">
            <Info size={16} className="mt-1 me-2 flex-shrink-0" />
            <div className="small">
              <strong>Expected Duration:</strong> Set the number of days you expect opportunities to spend in each stage. 
              Opportunities exceeding these durations will be flagged as "overdue" in reports and dashboards.
            </div>
          </div>

          <div className="d-flex flex-column gap-3">
            {STAGES.filter(stage => stage !== 'Complete').map(stage => (
              <div key={stage} className="row align-items-center">
                <div className="col-3">
                  <label className="fw-medium text-dark">{stage}</label>
                </div>
                <div className="col-3">
                  <div className="input-group input-group-sm">
                    <input
                      type="number"
                      min="1"
                      max="90"
                      value={localDurations[stage] || 0}
                      onChange={(e) => handleDurationChange(stage, e.target.value)}
                      className="form-control"
                    />
                    <span className="input-group-text">days</span>
                  </div>
                </div>
                <div className="col-6">
                  <small className="text-muted">{stageDescriptions[stage]}</small>
                </div>
              </div>
            ))}
            
            {/* Complete Stage (Read-only) */}
            <div className="row align-items-center">
              <div className="col-3">
                <label className="fw-medium text-muted">Complete</label>
              </div>
              <div className="col-3">
                <div className="input-group input-group-sm">
                  <input
                    type="text"
                    value="∞"
                    disabled
                    className="form-control"
                  />
                </div>
              </div>
              <div className="col-6">
                <small className="text-muted">Terminal state - no duration limit</small>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="d-flex align-items-center justify-content-between p-4 border-top bg-light">
          <button
            onClick={handleReset}
            className="btn btn-outline-secondary d-flex align-items-center"
            disabled={!hasChanges}
          >
            <RotateCcw size={14} className="me-1" />
            Reset
          </button>
          
          <div className="d-flex gap-2">
            <button onClick={onClose} className="btn btn-outline-secondary">
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="btn btn-primary d-flex align-items-center"
              disabled={!hasChanges}
            >
              <Save size={14} className="me-1" />
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StageSettingsModal;