import React, { useState, useEffect, createContext, useContext } from 'react';

// ==============================================================================
// SCORING CONTEXT AND HOOK
// ==============================================================================

const ScoringContext = createContext();

export const ScoringProvider = ({ children }) => {
  const [scores, setScores] = useState(new Map());
  const [loading, setLoading] = useState(new Map());
  const [errors, setErrors] = useState(new Map());

  const value = {
    scores,
    loading,
    errors,
    setScores,
    setLoading,
    setErrors
  };

  return <ScoringContext.Provider value={value}>{children}</ScoringContext.Provider>;
};

export const useOpportunityScoring = () => {
  const context = useContext(ScoringContext);
  if (!context) {
    throw new Error('useOpportunityScoring must be used within ScoringProvider');
  }

  const { scores, loading, errors, setScores, setLoading, setErrors } = context;

  const scoreOpportunity = async (opportunityId) => {
    setLoading(prev => new Map(prev.set(opportunityId, true)));
    setErrors(prev => new Map(prev.delete(opportunityId)));

    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/score`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ opportunityId })
      });

      if (!response.ok) {
        throw new Error(`Scoring failed: ${response.statusText}`);
      }

      const scoreData = await response.json();
      setScores(prev => new Map(prev.set(opportunityId, scoreData)));
      
      // Show success notification
      showToast('success', 'Opportunity scored successfully');
      
      return scoreData;
    } catch (error) {
      setErrors(prev => new Map(prev.set(opportunityId, error.message)));
      showToast('error', `Scoring failed: ${error.message}`);
      throw error;
    } finally {
      setLoading(prev => new Map(prev.delete(opportunityId)));
    }
  };

  const batchScore = async (opportunityIds) => {
    const batchId = 'batch_' + Date.now();
    setLoading(prev => new Map(prev.set(batchId, true)));

    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/score/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ opportunityIds })
      });

      if (!response.ok) {
        throw new Error(`Batch scoring failed: ${response.statusText}`);
      }

      const batchResult = await response.json();
      
      // Update individual scores
      batchResult.results.forEach(scoreData => {
        setScores(prev => new Map(prev.set(scoreData.opportunityId, scoreData)));
      });

      showToast('success', `Scored ${batchResult.successful}/${batchResult.total} opportunities`);
      
      return batchResult;
    } catch (error) {
      setErrors(prev => new Map(prev.set(batchId, error.message)));
      showToast('error', `Batch scoring failed: ${error.message}`);
      throw error;
    } finally {
      setLoading(prev => new Map(prev.delete(batchId)));
    }
  };

  return {
    scoreOpportunity,
    batchScore,
    scores,
    loading,
    errors
  };
};

// ==============================================================================
// TOAST NOTIFICATION SYSTEM
// ==============================================================================

const showToast = (type, message) => {
  // Simple toast notification using Bootstrap toast
  const toastHtml = `
    <div class="toast align-items-center text-white bg-${type === 'success' ? 'success' : 'danger'} border-0" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="d-flex">
        <div class="toast-body">
          ${type === 'success' ? '✓' : '⚠'} ${message}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    </div>
  `;

  // Create toast container if it doesn't exist
  let toastContainer = document.querySelector('.toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
    toastContainer.style.zIndex = 9999;
    document.body.appendChild(toastContainer);
  }

  toastContainer.insertAdjacentHTML('beforeend', toastHtml);
  
  // Initialize and show toast
  const toastElement = toastContainer.lastElementChild;
  const toast = new window.bootstrap.Toast(toastElement);
  toast.show();
  
  // Remove element after it's hidden
  toastElement.addEventListener('hidden.bs.toast', () => {
    toastElement.remove();
  });
};

// ==============================================================================
// SCORE BADGE COMPONENT
// ==============================================================================

export const ScoreBadge = ({ 
  score, 
  priority, 
  size = 'medium', 
  loading = false, 
  error = null,
  showTooltip = true 
}) => {
  const getBadgeColor = (priority) => {
    const colorMap = {
      'A': 'success',      // Green
      'B': 'primary',      // Blue  
      'C': 'warning',      // Yellow
      'Nurture': 'secondary', // Gray
      'Deprioritize': 'danger' // Red
    };
    return colorMap[priority] || 'secondary';
  };

  const getSizeClass = (size) => {
    const sizeMap = {
      'small': 'fs-6',
      'medium': 'fs-5',
      'large': 'fs-4'
    };
    return sizeMap[size] || 'fs-5';
  };

  if (loading) {
    return (
      <span className={`badge bg-light text-dark ${getSizeClass(size)} d-inline-flex align-items-center`}>
        <span className="spinner-border spinner-border-sm me-1" role="status"></span>
        Scoring...
      </span>
    );
  }

  if (error) {
    return (
      <span 
        className={`badge bg-danger ${getSizeClass(size)}`}
        title={`Error: ${error}`}
      >
        Error
      </span>
    );
  }

  if (!score && score !== 0) {
    return (
      <span className={`badge bg-light text-dark ${getSizeClass(size)}`}>
        Not Scored
      </span>
    );
  }

  const badgeContent = (
    <span 
      className={`badge bg-${getBadgeColor(priority)} ${getSizeClass(size)} d-inline-flex align-items-center`}
      title={showTooltip ? `AI Score: ${score}/100 - Priority ${priority}` : ''}
    >
      <span className="me-1">{score}</span>
      <small className="opacity-75">{priority}</small>
    </span>
  );

  return badgeContent;
};

// ==============================================================================
// SCORE OPPORTUNITY BUTTON
// ==============================================================================

export const ScoreOpportunityButton = ({ 
  opportunityId, 
  onScoreUpdate,
  disabled = false,
  size = 'sm',
  variant = 'btn-outline-primary' 
}) => {
  const { scoreOpportunity, loading, errors } = useOpportunityScoring();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const isLoading = loading.get(opportunityId);
  const error = errors.get(opportunityId);

  const handleScore = async () => {
    try {
      const scoreData = await scoreOpportunity(opportunityId);
      if (onScoreUpdate) {
        onScoreUpdate(scoreData);
      }
    } catch (err) {
      console.error('Scoring failed:', err);
    }
  };

  const handleClick = () => {
    // Check if opportunity was recently scored
    const existingScore = JSON.parse(localStorage.getItem(`score_${opportunityId}`) || 'null');
    if (existingScore && new Date() - new Date(existingScore.scoredAt) < 3600000) { // 1 hour
      setShowConfirmation(true);
    } else {
      handleScore();
    }
  };

  return (
    <>
      <button
        className={`btn ${variant} btn-${size} d-flex align-items-center`}
        onClick={handleClick}
        disabled={disabled || isLoading}
      >
        {isLoading ? (
          <>
            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
            Scoring...
          </>
        ) : (
          <>
            <i className="bi bi-robot me-2"></i>
            Score Opportunity
          </>
        )}
      </button>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Rescore Opportunity</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowConfirmation(false)}
                ></button>
              </div>
              <div className="modal-body">
                This opportunity was recently scored. Are you sure you want to generate a new score?
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowConfirmation(false)}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={() => {
                    setShowConfirmation(false);
                    handleScore();
                  }}
                >
                  Rescore
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="text-danger small mt-1">
          <i className="bi bi-exclamation-triangle"></i> {error}
        </div>
      )}
    </>
  );
};

// ==============================================================================
// SCORE BREAKDOWN COMPONENT
// ==============================================================================

export const ScoreBreakdown = ({ 
  scoreData, 
  loading = false,
  compact = false 
}) => {
  const [showReasoning, setShowReasoning] = useState(false);

  if (loading) {
    return (
      <div className="card">
        <div className="card-body text-center">
          <div className="spinner-border" role="status"></div>
          <p className="mt-2">Loading score breakdown...</p>
        </div>
      </div>
    );
  }

  if (!scoreData) {
    return (
      <div className="card">
        <div className="card-body text-center text-muted">
          <i className="bi bi-bar-chart fs-1"></i>
          <p>No scoring data available</p>
        </div>
      </div>
    );
  }

  const categoryColors = {
    strategicFit: 'success',
    serviceAlignment: 'info',
    problemSolutionFit: 'warning',
    engagementIndicators: 'primary',
    competitiveAdvantage: 'secondary'
  };

  const categoryLabels = {
    strategicFit: 'Strategic Fit',
    serviceAlignment: 'Service Alignment',
    problemSolutionFit: 'Problem-Solution Fit',
    engagementIndicators: 'Engagement Indicators',
    competitiveAdvantage: 'Competitive Advantage'
  };

  const categoryMaxScores = {
    strategicFit: 30,
    serviceAlignment: 25,
    problemSolutionFit: 20,
    engagementIndicators: 15,
    competitiveAdvantage: 10
  };

  return (
    <div className="card">
      <div className="card-body">
        {/* Header with total score */}
        <div className="row align-items-center mb-4">
          <div className="col-auto">
            <div className="display-4 fw-bold text-primary">
              {scoreData.totalScore}
              <small className="fs-5 text-muted">/100</small>
            </div>
          </div>
          <div className="col">
            <ScoreBadge 
              score={scoreData.totalScore} 
              priority={scoreData.priority} 
              size="large"
              showTooltip={false}
            />
            {scoreData.confidence && (
              <div className="small text-muted mt-1">
                Confidence: {Math.round(scoreData.confidence * 100)}%
              </div>
            )}
          </div>
        </div>

        {/* Category breakdown */}
        <div className="mb-4">
          <h6 className="fw-bold mb-3">Category Breakdown</h6>
          {Object.entries(scoreData.categoryBreakdown || {}).map(([category, score]) => (
            <div key={category} className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="fw-medium">{categoryLabels[category]}</span>
                <span className="text-muted">
                  {score}/{categoryMaxScores[category]}
                </span>
              </div>
              <div className="progress" style={{ height: '8px' }}>
                <div 
                  className={`progress-bar bg-${categoryColors[category]}`}
                  role="progressbar"
                  style={{ width: `${(score / categoryMaxScores[category]) * 100}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>

        {/* Key Strengths */}
        {scoreData.keyStrengths && scoreData.keyStrengths.length > 0 && (
          <div className="mb-4">
            <h6 className="fw-bold text-success mb-2">
              <i className="bi bi-check-circle me-2"></i>Key Strengths
            </h6>
            <ul className="list-unstyled mb-0">
              {scoreData.keyStrengths.map((strength, index) => (
                <li key={index} className="mb-1">
                  <i className="bi bi-check text-success me-2"></i>
                  {strength}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Concerns */}
        {scoreData.concerns && scoreData.concerns.length > 0 && (
          <div className="mb-4">
            <h6 className="fw-bold text-warning mb-2">
              <i className="bi bi-exclamation-triangle me-2"></i>Areas of Concern
            </h6>
            <ul className="list-unstyled mb-0">
              {scoreData.concerns.map((concern, index) => (
                <li key={index} className="mb-1">
                  <i className="bi bi-dash text-warning me-2"></i>
                  {concern}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommendations */}
        {scoreData.recommendations && scoreData.recommendations.length > 0 && (
          <div className="mb-4">
            <h6 className="fw-bold text-info mb-2">
              <i className="bi bi-lightbulb me-2"></i>Recommendations
            </h6>
            <ul className="list-unstyled mb-0">
              {scoreData.recommendations.map((recommendation, index) => (
                <li key={index} className="mb-1">
                  <i className="bi bi-arrow-right text-info me-2"></i>
                  {recommendation}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* AI Reasoning (Expandable) */}
        {scoreData.reasoning && (
          <div>
            <button
              className="btn btn-link p-0 text-decoration-none"
              onClick={() => setShowReasoning(!showReasoning)}
            >
              <i className={`bi bi-chevron-${showReasoning ? 'up' : 'down'} me-2`}></i>
              AI Reasoning
            </button>
            {showReasoning && (
              <div className="mt-2 p-3 bg-light rounded">
                <small className="text-muted">{scoreData.reasoning}</small>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};