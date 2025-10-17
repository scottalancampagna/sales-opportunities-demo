import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, User, Building, DollarSign, Calendar, FileText } from 'lucide-react';
import { canEditOpportunity } from '../../utils/permissions';
import { INDUSTRIES, OFFERINGS } from '../../utils/constants';

const OpportunityEditor = ({ 
  opportunity, 
  isEditing, 
  onSave, 
  onCancel, 
  onUnsavedChanges,
  user 
}) => {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [isDirty, setIsDirty] = useState(false);

  // Initialize form data
  useEffect(() => {
    if (opportunity) {
      setFormData({
        sfdc_id: opportunity.sfdc_id || '',
        specialist: opportunity.specialist || '',
        client: opportunity.client || '',
        client_ask: opportunity.client_ask || '',
        needs: opportunity.needs || '',
        why_launch: opportunity.why_launch || '',
        industry: opportunity.industry || '',
        offerings: opportunity.offerings || [],
        aop_value: opportunity.aop_value || '',
        eenu_value: opportunity.eenu_value || '',
        proposal_due_date: opportunity.proposal_due_date ? 
          opportunity.proposal_due_date.split('T')[0] : '',
        assigned_resources: opportunity.assigned_resources || {
          solution_architect: '',
          design_poc: '',
          strategy_poc: '',
          delivery_poc: '',
          tech_poc: ''
        }
      });
      setIsDirty(false);
    }
  }, [opportunity, isEditing]);

  // Track unsaved changes
  useEffect(() => {
    onUnsavedChanges(isDirty && isEditing);
  }, [isDirty, isEditing, onUnsavedChanges]);

  const handleChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev };
      
      if (field.includes('.')) {
        // Handle nested fields like 'assigned_resources.solution_architect'
        const [parent, child] = field.split('.');
        updated[parent] = { ...updated[parent], [child]: value };
      } else {
        updated[field] = value;
      }
      
      return updated;
    });
    
    setIsDirty(true);
    
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Required fields
    if (!formData.sfdc_id?.trim()) {
      newErrors.sfdc_id = 'SFDC ID is required';
    }
    if (!formData.specialist?.trim()) {
      newErrors.specialist = 'Specialist is required';
    }
    if (!formData.client_ask?.trim()) {
      newErrors.client_ask = 'Client Ask is required';
    }
    if (!formData.needs?.trim()) {
      newErrors.needs = 'Needs are required';
    }

    // Numeric validations
    if (formData.aop_value && isNaN(Number(formData.aop_value))) {
      newErrors.aop_value = 'AOP Value must be a number';
    }
    if (formData.eenu_value && isNaN(Number(formData.eenu_value))) {
      newErrors.eenu_value = 'EENU Value must be a number';
    }

    // Date validation
    if (formData.proposal_due_date) {
      const dueDate = new Date(formData.proposal_due_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (dueDate < today) {
        newErrors.proposal_due_date = 'Proposal due date cannot be in the past';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Create audit entry for changes
    const changes = [];
    Object.keys(formData).forEach(key => {
      if (key === 'assigned_resources') {
        // Handle nested resource changes
        Object.keys(formData.assigned_resources).forEach(resourceKey => {
          const oldValue = opportunity.assigned_resources?.[resourceKey] || '';
          const newValue = formData.assigned_resources[resourceKey] || '';
          if (oldValue !== newValue) {
            changes.push({
              field: `assigned_resources.${resourceKey}`,
              old_value: oldValue,
              new_value: newValue
            });
          }
        });
      } else {
        const oldValue = opportunity[key];
        const newValue = formData[key];
        if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
          changes.push({
            field: key,
            old_value: oldValue,
            new_value: newValue
          });
        }
      }
    });

    // Create updated opportunity
    const updatedOpportunity = {
      ...opportunity,
      ...formData,
      aop_value: formData.aop_value ? Number(formData.aop_value) : null,
      eenu_value: formData.eenu_value ? Number(formData.eenu_value) : null,
      proposal_due_date: formData.proposal_due_date ? 
        new Date(formData.proposal_due_date).toISOString() : null,
      updated_date: new Date().toISOString(),
      audit_trail: [
        ...(opportunity.audit_trail || []),
        ...changes.map(change => ({
          timestamp: new Date().toISOString(),
          user: user.name,
          action: 'edit',
          ...change
        }))
      ]
    };

    onSave(updatedOpportunity);
    setIsDirty(false);
  };

  const canEdit = canEditOpportunity(user, opportunity);
  const showPOCFields = ['Intake', 'Needs More Info', 'In Research', 'Shaping', 'Proposal', 'Review'].includes(opportunity?.stage);

  return (
    <div className="container-fluid">
      <form onSubmit={handleSubmit}>
        {/* Basic Information */}
        <div className="card mb-4">
          <div className="card-header bg-primary text-white">
            <h5 className="card-title mb-0 d-flex align-items-center">
              <FileText size={20} className="me-2" />
              Basic Information
            </h5>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label fw-medium">
                  SFDC ID <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={formData.sfdc_id || ''}
                  onChange={(e) => handleChange('sfdc_id', e.target.value)}
                  disabled={!isEditing || !canEdit}
                  className={`form-control ${errors.sfdc_id ? 'is-invalid' : ''}`}
                />
                {errors.sfdc_id && (
                  <div className="invalid-feedback d-flex align-items-center">
                    <AlertCircle size={14} className="me-1" />
                    {errors.sfdc_id}
                  </div>
                )}
              </div>

              <div className="col-md-6">
                <label className="form-label fw-medium">
                  Specialist <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={formData.specialist || ''}
                  onChange={(e) => handleChange('specialist', e.target.value)}
                  disabled={!isEditing || !canEdit}
                  className={`form-control ${errors.specialist ? 'is-invalid' : ''}`}
                />
                {errors.specialist && (
                  <div className="invalid-feedback d-flex align-items-center">
                    <AlertCircle size={14} className="me-1" />
                    {errors.specialist}
                  </div>
                )}
              </div>

              <div className="col-md-6">
                <label className="form-label fw-medium">Client</label>
                <div className="input-group">
                  <span className="input-group-text">
                    <Building size={16} className="text-muted" />
                  </span>
                  <input
                    type="text"
                    value={formData.client || ''}
                    onChange={(e) => handleChange('client', e.target.value)}
                    disabled={!isEditing || !canEdit}
                    className="form-control"
                  />
                </div>
              </div>

              <div className="col-md-6">
                <label className="form-label fw-medium">Industry</label>
                <select
                  value={formData.industry || ''}
                  onChange={(e) => handleChange('industry', e.target.value)}
                  disabled={!isEditing || !canEdit}
                  className="form-select"
                >
                  <option value="">Select Industry</option>
                  {INDUSTRIES.map(industry => (
                    <option key={industry} value={industry}>{industry}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Project Details */}
        <div className="card mb-4">
          <div className="card-header bg-info text-white">
            <h5 className="card-title mb-0">Project Details</h5>
          </div>
          <div className="card-body">
            <div className="mb-3">
              <label className="form-label fw-medium">
                Client Ask <span className="text-danger">*</span>
              </label>
              <textarea
                value={formData.client_ask || ''}
                onChange={(e) => handleChange('client_ask', e.target.value)}
                disabled={!isEditing || !canEdit}
                rows={3}
                className={`form-control ${errors.client_ask ? 'is-invalid' : ''}`}
                placeholder="Describe what the client is asking for..."
              />
              {errors.client_ask && (
                <div className="invalid-feedback d-flex align-items-center">
                  <AlertCircle size={14} className="me-1" />
                  {errors.client_ask}
                </div>
              )}
            </div>

            <div className="mb-3">
              <label className="form-label fw-medium">
                Needs <span className="text-danger">*</span>
              </label>
              <textarea
                value={formData.needs || ''}
                onChange={(e) => handleChange('needs', e.target.value)}
                disabled={!isEditing || !canEdit}
                rows={3}
                className={`form-control ${errors.needs ? 'is-invalid' : ''}`}
                placeholder="What are the client's specific needs..."
              />
              {errors.needs && (
                <div className="invalid-feedback d-flex align-items-center">
                  <AlertCircle size={14} className="me-1" />
                  {errors.needs}
                </div>
              )}
            </div>

            <div className="mb-3">
              <label className="form-label fw-medium">Why Launch</label>
              <textarea
                value={formData.why_launch || ''}
                onChange={(e) => handleChange('why_launch', e.target.value)}
                disabled={!isEditing || !canEdit}
                rows={2}
                className="form-control"
                placeholder="Why should Launch take this opportunity..."
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-medium">Offerings</label>
              <div className="border rounded p-3 bg-light" style={{maxHeight: '150px', overflowY: 'auto'}}>
                <div className="row">
                  {OFFERINGS.map(offering => (
                    <div key={offering} className="col-md-6 mb-2">
                      <div className="form-check">
                        <input
                          type="checkbox"
                          id={`offering-${offering.replace(/\s+/g, '-').toLowerCase()}`}
                          checked={(formData.offerings || []).includes(offering)}
                          onChange={(e) => {
                            const currentOfferings = formData.offerings || [];
                            const newOfferings = e.target.checked
                              ? [...currentOfferings, offering]
                              : currentOfferings.filter(o => o !== offering);
                            handleChange('offerings', newOfferings);
                          }}
                          disabled={!isEditing || !canEdit}
                          className="form-check-input"
                        />
                        <label className="form-check-label small" htmlFor={`offering-${offering.replace(/\s+/g, '-').toLowerCase()}`}>
                          {offering}
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Information */}
        <div className="card mb-4">
          <div className="card-header bg-success text-white">
            <h5 className="card-title mb-0 d-flex align-items-center">
              <DollarSign size={20} className="me-2" />
              Financial Information
            </h5>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label fw-medium">AOP Value</label>
                <div className="input-group">
                  <span className="input-group-text">$</span>
                  <input
                    type="number"
                    value={formData.aop_value || ''}
                    onChange={(e) => handleChange('aop_value', e.target.value)}
                    disabled={!isEditing || !canEdit}
                    className={`form-control ${errors.aop_value ? 'is-invalid' : ''}`}
                    placeholder="0"
                  />
                  {errors.aop_value && (
                    <div className="invalid-feedback d-flex align-items-center">
                      <AlertCircle size={14} className="me-1" />
                      {errors.aop_value}
                    </div>
                  )}
                </div>
              </div>

              <div className="col-md-4">
                <label className="form-label fw-medium">EENU Value</label>
                <div className="input-group">
                  <span className="input-group-text">$</span>
                  <input
                    type="number"
                    value={formData.eenu_value || ''}
                    onChange={(e) => handleChange('eenu_value', e.target.value)}
                    disabled={!isEditing || !canEdit}
                    className={`form-control ${errors.eenu_value ? 'is-invalid' : ''}`}
                    placeholder="0"
                  />
                  {errors.eenu_value && (
                    <div className="invalid-feedback d-flex align-items-center">
                      <AlertCircle size={14} className="me-1" />
                      {errors.eenu_value}
                    </div>
                  )}
                </div>
              </div>

              <div className="col-md-4">
                <label className="form-label fw-medium">Proposal Due Date</label>
                <div className="input-group">
                  <span className="input-group-text">
                    <Calendar size={16} className="text-muted" />
                  </span>
                  <input
                    type="date"
                    value={formData.proposal_due_date || ''}
                    onChange={(e) => handleChange('proposal_due_date', e.target.value)}
                    disabled={!isEditing || !canEdit}
                    className={`form-control ${errors.proposal_due_date ? 'is-invalid' : ''}`}
                  />
                  {errors.proposal_due_date && (
                    <div className="invalid-feedback d-flex align-items-center">
                      <AlertCircle size={14} className="me-1" />
                      {errors.proposal_due_date}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* POC Fields (only show if in Intake or later) */}
        {showPOCFields && (
          <div className="card mb-4">
            <div className="card-header bg-warning text-dark">
              <h5 className="card-title mb-0 d-flex align-items-center">
                <User size={20} className="me-2" />
                Assigned Resources
              </h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                {Object.entries({
                  solution_architect: 'Solution Architect',
                  design_poc: 'Design POC',
                  strategy_poc: 'Strategy POC',
                  delivery_poc: 'Delivery POC',
                  tech_poc: 'Tech POC'
                }).map(([key, label]) => (
                  <div key={key} className="col-md-6">
                    <label className="form-label fw-medium">{label}</label>
                    <input
                      type="text"
                      value={formData.assigned_resources?.[key] || ''}
                      onChange={(e) => handleChange(`assigned_resources.${key}`, e.target.value)}
                      disabled={!isEditing || (user.role === 'POC' && !key.includes('poc'))}
                      className="form-control"
                      placeholder={`Enter ${label.toLowerCase()}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        {isEditing && canEdit && isDirty && (
          <div className="d-flex justify-content-end pt-3 border-top">
            <button
              type="submit"
              className="btn btn-success btn-lg d-flex align-items-center"
            >
              <Save size={18} className="me-2" />
              Save Changes
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default OpportunityEditor;