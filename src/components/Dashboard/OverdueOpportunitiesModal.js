import React from 'react';
import { X, Clock, User, ExternalLink } from 'lucide-react';
import { useData } from '../../contexts/DataContext';

const OverdueOpportunitiesModal = ({ isOpen, onClose }) => {
  const { getOverdueOpportunities, getDaysInStage, expectedDurations } = useData();
  
  const overdueOpps = getOverdueOpportunities().map(opp => ({
    ...opp,
    daysInStage: getDaysInStage(opp),
    expectedDays: expectedDurations[opp.stage] || 7,
    overdueBy: getDaysInStage(opp) - (expectedDurations[opp.stage] || 7)
  })).sort((a, b) => b.overdueBy - a.overdueBy);

  if (!isOpen) return null;

  return (
    <div className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center" style={{zIndex: 1060}}>
      <div className="bg-white rounded shadow-lg" style={{width: '800px', maxHeight: '80vh'}}>
        {/* Header */}
        <div className="d-flex align-items-center justify-content-between p-4 border-bottom">
          <div className="d-flex align-items-center">
            <Clock size={20} className="text-danger me-2" />
            <h5 className="mb-0 fw-semibold">Overdue Opportunities</h5>
            <span className="badge bg-danger ms-2">{overdueOpps.length}</span>
          </div>
          <button onClick={onClose} className="btn btn-sm btn-outline-secondary">
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-0" style={{maxHeight: '60vh', overflowY: 'auto'}}>
          {overdueOpps.length === 0 ? (
            <div className="text-center py-5">
              <Clock size={48} className="text-success mb-3" />
              <h5 className="text-success">All Caught Up!</h5>
              <p className="text-muted">No opportunities are currently overdue.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Opportunity</th>
                    <th>Stage</th>
                    <th>Specialist</th>
                    <th>Days in Stage</th>
                    <th>Expected</th>
                    <th>Overdue By</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {overdueOpps.map((opp) => (
                    <tr key={opp.id}>
                      <td>
                        <div className="fw-medium">{opp.sfdc_id}</div>
                        <div className="text-muted small text-truncate" style={{maxWidth: '200px'}}>
                          {opp.client_ask}
                        </div>
                        {opp.client && (
                          <div className="small text-muted">
                            <User size={12} className="me-1" />
                            {opp.client}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${
                          opp.stage === 'Review' ? 'bg-info' :
                          opp.stage === 'Proposal' ? 'bg-primary' :
                          opp.stage === 'Shaping' ? 'bg-warning' :
                          opp.stage === 'In Research' ? 'bg-warning text-dark' :
                          opp.stage === 'Intake' ? 'bg-secondary' :
                          'bg-light text-dark'
                        }`}>
                          {opp.stage}
                        </span>
                      </td>
                      <td className="text-nowrap">{opp.specialist}</td>
                      <td className="text-center">
                        <span className="badge bg-danger">{opp.daysInStage} days</span>
                      </td>
                      <td className="text-center text-muted">{opp.expectedDays} days</td>
                      <td className="text-center">
                        <span className="fw-bold text-danger">+{opp.overdueBy} days</span>
                      </td>
                      <td>
                        <button
                          onClick={() => {
                            window.location.hash = `#/detail/${opp.id}`;
                            onClose();
                          }}
                          className="btn btn-sm btn-outline-primary"
                          title="View details"
                        >
                          <ExternalLink size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        {overdueOpps.length > 0 && (
          <div className="d-flex align-items-center justify-content-between p-4 border-top bg-light">
            <div className="text-muted small">
              <strong>Next Actions:</strong> Review these opportunities and determine if they need to advance stages or require additional resources.
            </div>
            <button onClick={onClose} className="btn btn-secondary">
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OverdueOpportunitiesModal;