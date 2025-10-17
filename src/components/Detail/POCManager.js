import React, { useState, useEffect } from 'react';
import { User, Users, Mail, Phone, Calendar, Edit, Save, X, AlertCircle, CheckCircle } from 'lucide-react';
import { POC_TYPES } from '../../utils/constants';

const POCManager = ({ opportunity, user, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [assignments, setAssignments] = useState({});
  const [availableUsers, setAvailableUsers] = useState([]);
  const [resourceNotes, setResourceNotes] = useState({});

  // Load data on mount
  useEffect(() => {
    setAssignments(opportunity.assigned_resources || {});
    loadAvailableUsers();
    
    // Load resource notes from opportunity
    const notes = {};
    POC_TYPES.forEach(type => {
      const key = type.toLowerCase().replace(' ', '_') + '_poc';
      notes[key] = opportunity[`${key}_notes`] || '';
    });
    setResourceNotes(notes);
  }, [opportunity]);

  const loadAvailableUsers = () => {
    try {
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      setAvailableUsers(users.filter(u => u.active !== false));
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const getResourceKey = (type) => {
    return type.toLowerCase().replace(' ', '_') + '_poc';
  };

  const getUserByName = (name) => {
    return availableUsers.find(u => u.name === name);
  };

  const handleAssignmentChange = (resourceType, userName) => {
    setAssignments(prev => ({
      ...prev,
      [getResourceKey(resourceType)]: userName
    }));
  };

  const handleNotesChange = (resourceType, notes) => {
    const key = getResourceKey(resourceType);
    setResourceNotes(prev => ({
      ...prev,
      [key]: notes
    }));
  };

  const handleSave = () => {
    // Create audit entries for changes
    const auditEntries = [];
    const originalAssignments = opportunity.assigned_resources || {};
    
    Object.keys(assignments).forEach(key => {
      const oldValue = originalAssignments[key] || '';
      const newValue = assignments[key] || '';
      if (oldValue !== newValue) {
        auditEntries.push({
          timestamp: new Date().toISOString(),
          user: user.name,
          action: 'assignment',
          field: `assigned_resources.${key}`,
          old_value: oldValue,
          new_value: newValue
        });
      }
    });

    // Create updated opportunity
    const updatedOpportunity = {
      ...opportunity,
      assigned_resources: assignments,
      updated_date: new Date().toISOString(),
      audit_trail: [...(opportunity.audit_trail || []), ...auditEntries]
    };

    // Add resource notes
    POC_TYPES.forEach(type => {
      const key = getResourceKey(type);
      updatedOpportunity[`${key}_notes`] = resourceNotes[key] || '';
    });

    onUpdate(updatedOpportunity);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setAssignments(opportunity.assigned_resources || {});
    setIsEditing(false);
    
    // Reset notes
    const notes = {};
    POC_TYPES.forEach(type => {
      const key = getResourceKey(type);
      notes[key] = opportunity[`${key}_notes`] || '';
    });
    setResourceNotes(notes);
  };

  const getResourceStatus = (resourceType) => {
    const key = getResourceKey(resourceType);
    const assignedUser = assignments[key];
    
    if (!assignedUser) {
      return { status: 'unassigned', color: 'secondary', icon: AlertCircle };
    }
    
    const user = getUserByName(assignedUser);
    if (!user) {
      return { status: 'invalid', color: 'danger', icon: AlertCircle };
    }
    
    return { status: 'assigned', color: 'success', icon: CheckCircle };
  };

  const canEditAssignments = () => {
    // Admin can always edit
    if (user.role === 'Admin') return true;
    
    // GTM roles can edit assignments
    if (['GTMLead', 'GTM'].includes(user.role)) return true;
    
    // PracticeLead can edit assignments in Shaping
    if (user.role === 'PracticeLead' && opportunity.stage === 'Shaping') return true;
    
    return false;
  };

  const getWorkloadIndicator = (userName) => {
    // In a real system, this would query actual workload data
    // For now, we'll simulate workload levels
    const workloads = ['Low', 'Medium', 'High'];
    const randomWorkload = workloads[Math.floor(Math.random() * workloads.length)];
    
    const colors = {
      'Low': 'success',
      'Medium': 'warning', 
      'High': 'danger'
    };
    
    return (
      <span className={`badge bg-${colors[randomWorkload]} bg-opacity-25 text-${colors[randomWorkload]}`}>
        {randomWorkload} Load
      </span>
    );
  };

  return (
    <div className="h-100 overflow-auto">
      <div className="container-fluid p-4">
        {/* Header */}
        <div className="d-flex align-items-center justify-content-between mb-4">
          <div>
            <h4 className="mb-1">Resource Assignments</h4>
            <p className="text-muted small mb-0">Manage POC assignments and resource allocation</p>
          </div>
          
          {canEditAssignments() && (
            <div className="d-flex gap-2">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn btn-primary d-flex align-items-center"
                >
                  <Edit size={16} className="me-2" />
                  Edit Assignments
                </button>
              ) : (
                <>
                  <button
                    onClick={handleSave}
                    className="btn btn-success d-flex align-items-center"
                  >
                    <Save size={16} className="me-2" />
                    Save Changes
                  </button>
                  <button
                    onClick={handleCancel}
                    className="btn btn-outline-secondary d-flex align-items-center"
                  >
                    <X size={16} className="me-2" />
                    Cancel
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Resource Cards */}
        <div className="row g-4 mb-4">
          {POC_TYPES.map(resourceType => {
            const key = getResourceKey(resourceType);
            const assignedUserName = assignments[key];
            const assignedUser = assignedUserName ? getUserByName(assignedUserName) : null;
            const status = getResourceStatus(resourceType);
            const StatusIcon = status.icon;
            
            return (
              <div key={resourceType} className="col-md-6 col-lg-4">
                <div className="card h-100 shadow-sm">
                  <div className="card-body">
                    {/* Header */}
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <div className="d-flex align-items-center">
                        <User size={18} className="text-muted me-2" />
                        <h6 className="card-title mb-0">{resourceType} POC</h6>
                      </div>
                      <StatusIcon size={18} className={`text-${status.color}`} />
                    </div>

                    {/* Assignment */}
                    <div className="mb-3">
                      {isEditing ? (
                        <div>
                          <label className="form-label small">Assign User</label>
                          <select
                            value={assignedUserName || ''}
                            onChange={(e) => handleAssignmentChange(resourceType, e.target.value)}
                            className="form-select form-select-sm"
                          >
                            <option value="">Select user...</option>
                            {availableUsers
                              .filter(u => ['Admin', 'PracticeLead', 'POC'].includes(u.role))
                              .map(u => (
                                <option key={u.id} value={u.name}>
                                  {u.name} ({u.role})
                                </option>
                              ))}
                          </select>
                        </div>
                      ) : (
                        <div>
                          {assignedUser ? (
                            <div className="d-flex align-items-center justify-content-between">
                              <div className="d-flex align-items-center">
                                <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center me-3"
                                     style={{width: '40px', height: '40px'}}>
                                  <span className="small fw-medium text-primary">
                                    {assignedUser.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <div className="fw-medium small">{assignedUser.name}</div>
                                  <div className="text-muted small">{assignedUser.role}</div>
                                  <div className="d-flex align-items-center text-muted small">
                                    <Mail size={10} className="me-1" />
                                    <small>{assignedUser.email}</small>
                                  </div>
                                </div>
                              </div>
                              <div>
                                {getWorkloadIndicator(assignedUser.name)}
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-3 text-muted">
                              <User size={32} className="mb-2 opacity-50" />
                              <div className="small">No one assigned</div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="form-label small fw-medium">Notes & Requirements</label>
                      {isEditing ? (
                        <textarea
                          value={resourceNotes[key] || ''}
                          onChange={(e) => handleNotesChange(resourceType, e.target.value)}
                          rows={3}
                          className="form-control form-control-sm"
                          placeholder="Specific requirements, skills needed, timeline..."
                        />
                      ) : (
                        <div className="small text-muted bg-light rounded p-2" style={{minHeight: '60px'}}>
                          {resourceNotes[key] || (
                            <span className="fst-italic opacity-75">No specific requirements noted</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="card-footer bg-light">
                    <div className="d-flex align-items-center text-muted small">
                      <Calendar size={12} className="me-1" />
                      Last updated: {new Date(opportunity.updated_date || opportunity.created_date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Assignment Summary */}
        <div className="card bg-primary bg-opacity-10 border-primary border-opacity-25 mb-4">
          <div className="card-body">
            <h6 className="card-title text-primary mb-3">Assignment Summary</h6>
            <div className="row text-center">
              <div className="col-4">
                <div className="h4 fw-bold text-success mb-1">
                  {Object.values(assignments).filter(Boolean).length}
                </div>
                <div className="small text-muted">Assigned</div>
              </div>
              <div className="col-4">
                <div className="h4 fw-bold text-secondary mb-1">
                  {POC_TYPES.length - Object.values(assignments).filter(Boolean).length}
                </div>
                <div className="small text-muted">Unassigned</div>
              </div>
              <div className="col-4">
                <div className="h4 fw-bold text-primary mb-1">
                  {new Set(Object.values(assignments).filter(Boolean)).size}
                </div>
                <div className="small text-muted">Unique People</div>
              </div>
            </div>
          </div>
        </div>

        {/* Permission Message */}
        {!canEditAssignments() && (
          <div className="alert alert-warning d-flex align-items-start">
            <AlertCircle size={16} className="me-2 mt-1 flex-shrink-0" />
            <div>
              <div className="fw-medium small">Assignment Editing Restricted</div>
              <div className="small">
                Your role ({user.role}) doesn't have permission to edit resource assignments.
                {user.role === 'PracticeLead' && opportunity.stage !== 'Shaping' && 
                  ' Practice Leads can edit assignments when opportunities are in Shaping stage.'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default POCManager;