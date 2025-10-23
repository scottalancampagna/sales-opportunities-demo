import React, { useState, useEffect, createContext, useContext } from 'react';

// ==============================================================================
// RBAC CONTEXT AND PROVIDER
// ==============================================================================

const RBACContext = createContext();

export const RBACProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessChecks, setAccessChecks] = useState(new Map());

  // Load user permissions on mount
  useEffect(() => {
    loadUserPermissions();
  }, []);

  const loadUserPermissions = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      if (!userInfo.id) {
        setLoading(false);
        return;
      }

      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/permissions/${userInfo.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const permissionsData = await response.json();
        setUser(userInfo);
        setPermissions(permissionsData);
      }
    } catch (error) {
      console.error('Failed to load user permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkOpportunityAccess = async (opportunityId, action = 'read') => {
    const cacheKey = `${opportunityId}_${action}`;
    
    // Return cached result if available
    if (accessChecks.has(cacheKey)) {
      return accessChecks.get(cacheKey);
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/opportunities/${opportunityId}/access-check?action=${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const accessData = await response.json();
        setAccessChecks(prev => new Map(prev.set(cacheKey, accessData)));
        return accessData;
      }
    } catch (error) {
      console.error('Access check failed:', error);
    }

    return null;
  };

  const attemptStageTransition = async (opportunityId, toStage, reason = '') => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/transition/${opportunityId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ toStage, reason })
      });

      const result = await response.json();

      if (response.ok) {
        // Clear access cache for this opportunity
        const keysToDelete = [];
        accessChecks.forEach((value, key) => {
          if (key.startsWith(`${opportunityId}_`)) {
            keysToDelete.push(key);
          }
        });
        
        keysToDelete.forEach(key => {
          setAccessChecks(prev => {
            const newMap = new Map(prev);
            newMap.delete(key);
            return newMap;
          });
        });

        return { success: true, data: result };
      } else {
        return { success: false, error: result.error, reason: result.reason };
      }
    } catch (error) {
      return { success: false, error: 'Network error', reason: error.message };
    }
  };

  const hasPermission = (permission) => {
    if (!permissions) return false;
    if (permissions.role === 'Admin') return true;
    
    return permissions.permissions && permissions.permissions.some(p => {
      if (p === '*') return true;
      if (p === permission) return true;
      
      // Check wildcard match
      const pParts = p.split(':');
      const permParts = permission.split(':');
      
      for (let i = 0; i < pParts.length; i++) {
        if (pParts[i] === '*') return true;
        if (pParts[i] !== permParts[i]) return false;
      }
      
      return pParts.length === permParts.length;
    });
  };

  const value = {
    user,
    permissions,
    loading,
    hasPermission,
    checkOpportunityAccess,
    attemptStageTransition,
    refreshPermissions: loadUserPermissions
  };

  return <RBACContext.Provider value={value}>{children}</RBACContext.Provider>;
};

export const useRBAC = () => {
  const context = useContext(RBACContext);
  if (!context) {
    throw new Error('useRBAC must be used within RBACProvider');
  }
  return context;
};

// ==============================================================================
// PERMISSION GUARD COMPONENT
// ==============================================================================

export const PermissionGuard = ({ 
  permission, 
  role = null,
  fallback = null, 
  children,
  showMessage = false 
}) => {
  const { hasPermission, permissions } = useRBAC();

  // Check role-based access
  if (role && permissions?.role !== role && permissions?.role !== 'Admin') {
    if (showMessage) {
      return (
        <div className="alert alert-warning small">
          <i className="bi bi-shield-exclamation me-2"></i>
          This feature requires {role} role or higher.
        </div>
      );
    }
    return fallback;
  }

  // Check permission-based access
  if (permission && !hasPermission(permission)) {
    if (showMessage) {
      return (
        <div className="alert alert-warning small">
          <i className="bi bi-shield-exclamation me-2"></i>
          You don't have permission to access this feature.
        </div>
      );
    }
    return fallback;
  }

  return children;
};

// ==============================================================================
// STAGE TRANSITION CONTROLS
// ==============================================================================

export const StageTransitionControls = ({ 
  opportunity, 
  onTransition,
  size = 'sm',
  disabled = false 
}) => {
  const { checkOpportunityAccess, attemptStageTransition, permissions } = useRBAC();
  const [accessData, setAccessData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTransitionModal, setShowTransitionModal] = useState(false);
  const [selectedStage, setSelectedStage] = useState('');
  const [transitionReason, setTransitionReason] = useState('');
  const [transitioning, setTransitioning] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (opportunity?.id) {
      loadAccessData();
    }
  }, [opportunity?.id]);

  const loadAccessData = async () => {
    setLoading(true);
    try {
      const data = await checkOpportunityAccess(opportunity.id, 'edit');
      setAccessData(data);
    } catch (error) {
      console.error('Failed to load access data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTransitionClick = (stage) => {
    setSelectedStage(stage);
    setTransitionReason('');
    setShowTransitionModal(true);
    setShowDropdown(false);
  };

  const confirmTransition = async () => {
    if (!selectedStage) return;

    setTransitioning(true);
    try {
      const result = await attemptStageTransition(
        opportunity.id, 
        selectedStage, 
        transitionReason
      );

      if (result.success) {
        setShowTransitionModal(false);
        if (onTransition) {
          onTransition(opportunity.id, selectedStage, result.data);
        }
        
        // Show success notification
        showTransitionToast('success', `Stage transitioned to ${selectedStage}`);
        
        // Reload access data
        await loadAccessData();
      } else {
        showTransitionToast('error', result.error || 'Transition failed');
      }
    } catch (error) {
      showTransitionToast('error', 'Network error occurred');
    } finally {
      setTransitioning(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex align-items-center">
        <div className="spinner-border spinner-border-sm me-2" role="status"></div>
        <span className="small text-muted">Loading transitions...</span>
      </div>
    );
  }

  if (!accessData?.access.allowed) {
    return (
      <div className="small text-muted">
        <i className="bi bi-lock me-1"></i>
        No edit access
      </div>
    );
  }

  const availableTransitions = accessData.availableTransitions || [];

  if (availableTransitions.length === 0) {
    return (
      <div className="small text-muted">
        <i className="bi bi-ban me-1"></i>
        No transitions available
      </div>
    );
  }

  return (
    <>
      {/* Dropdown */}
      <div className="dropdown">
        <button
          className={`btn btn-outline-primary btn-${size} dropdown-toggle`}
          type="button"
          onClick={() => setShowDropdown(!showDropdown)}
          disabled={disabled}
        >
          <i className="bi bi-arrow-right me-1"></i>
          Transition Stage
        </button>
        
        {showDropdown && (
          <div className="dropdown-menu show">
            <h6 className="dropdown-header">
              Current: <span className="badge bg-secondary">{opportunity.stage}</span>
            </h6>
            <div className="dropdown-divider"></div>
            {availableTransitions.map(stage => (
              <button
                key={stage}
                className="dropdown-item"
                onClick={() => handleTransitionClick(stage)}
              >
                <i className="bi bi-arrow-right me-2"></i>
                {stage}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Transition Confirmation Modal */}
      {showTransitionModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Stage Transition</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowTransitionModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <p>
                  Transition opportunity from <span className="badge bg-secondary">{opportunity.stage}</span> to <span className="badge bg-primary">{selectedStage}</span>?
                </p>
                
                <div className="mb-3">
                  <label className="form-label">Reason for transition (optional)</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={transitionReason}
                    onChange={(e) => setTransitionReason(e.target.value)}
                    placeholder="Explain why this transition is being made..."
                  />
                </div>

                <div className="alert alert-info small">
                  <i className="bi bi-info-circle me-2"></i>
                  This action will be logged in the audit trail.
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowTransitionModal(false)}
                  disabled={transitioning}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={confirmTransition}
                  disabled={transitioning}
                >
                  {transitioning ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Transitioning...
                    </>
                  ) : (
                    'Confirm Transition'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ==============================================================================
// FIELD-LEVEL PERMISSION WRAPPER
// ==============================================================================

export const FieldPermissionWrapper = ({ 
  opportunity, 
  fieldName, 
  children,
  fallback = null,
  showReadOnly = true 
}) => {
  const { checkOpportunityAccess } = useRBAC();
  const [canEdit, setCanEdit] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkFieldPermission();
  }, [opportunity?.id, fieldName]);

  const checkFieldPermission = async () => {
    if (!opportunity?.id) {
      setLoading(false);
      return;
    }

    try {
      const accessData = await checkOpportunityAccess(opportunity.id, 'edit');
      const fieldPermission = accessData?.fieldPermissions?.[fieldName];
      setCanEdit(fieldPermission === true);
    } catch (error) {
      console.error('Field permission check failed:', error);
      setCanEdit(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="spinner-border spinner-border-sm" role="status"></div>;
  }

  if (!canEdit) {
    if (showReadOnly && opportunity[fieldName]) {
      // Show read-only version
      return (
        <div className="form-control-plaintext">
          {opportunity[fieldName]}
          <small className="text-muted ms-2">
            <i className="bi bi-lock"></i>
          </small>
        </div>
      );
    }
    return fallback;
  }

  return children;
};

// Utility function to show transition notifications
const showTransitionToast = (type, message) => {
  // Simple alert for now - could be enhanced with proper toast system
  if (type === 'success') {
    alert(`✓ ${message}`);
  } else {
    alert(`⚠ ${message}`);
  }
};