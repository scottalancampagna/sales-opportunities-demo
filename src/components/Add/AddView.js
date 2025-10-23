import React, { useState } from 'react';
import { Save, X, AlertCircle, Plus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { INDUSTRIES, OFFERINGS } from '../../utils/constants';
import dataService from '../../services/DataService';

const AddView = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    sfdc_id: '',
    specialist: user?.name || '',
    client_ask: '',
    needs: '',
    why_launch: '',
    client: '',
    industry: '',
    offerings: [],
    aop_value: '',
    eenu_value: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.sfdc_id.trim()) {
      newErrors.sfdc_id = 'SFDC ID is required';
    }
    if (!formData.specialist.trim()) {
      newErrors.specialist = 'Specialist is required';
    }
    if (!formData.client_ask.trim()) {
      newErrors.client_ask = 'Client Ask is required';
    }
    if (!formData.needs.trim()) {
      newErrors.needs = 'Needs are required';
    }

    if (formData.aop_value && isNaN(Number(formData.aop_value))) {
      newErrors.aop_value = 'AOP Value must be a number';
    }
    if (formData.eenu_value && isNaN(Number(formData.eenu_value))) {
      newErrors.eenu_value = 'EENU Value must be a number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('AddView: Creating opportunity via DataService...');
      
      // Create new opportunity object
      const opportunityData = {
        sfdc_id: formData.sfdc_id.trim(),
        specialist: formData.specialist.trim(),
        client_ask: formData.client_ask.trim(),
        needs: formData.needs.trim(),
        why_launch: formData.why_launch.trim(),
        client: formData.client.trim(),
        industry: formData.industry,
        offerings: formData.offerings,
        aop_value: formData.aop_value ? Number(formData.aop_value) : null,
        eenu_value: formData.eenu_value ? Number(formData.eenu_value) : null,
        stage: 'New',
        won_status: false,
        assigned_resources: {
          solution_architect: '',
          design_poc: '',
          strategy_poc: '',
          delivery_poc: '',
          tech_poc: ''
        }
      };

      // Use DataService to create the opportunity (handles both API and localStorage)
      const newOpportunity = await dataService.createOpportunity(opportunityData);
      console.log('AddView: Created opportunity:', newOpportunity.id);

      // Show success message
      setShowSuccess(true);
      
      // Reset form after a delay
      setTimeout(() => {
        setFormData({
          sfdc_id: '',
          specialist: user?.name || '',
          client_ask: '',
          needs: '',
          why_launch: '',
          client: '',
          industry: '',
          offerings: [],
          aop_value: '',
          eenu_value: ''
        });
        setShowSuccess(false);
      }, 2000);

    } catch (error) {
      console.error('Error creating opportunity via DataService:', error);
      setErrors({ submit: 'Failed to create opportunity. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="d-flex align-items-center justify-content-center h-100">
        <div className="text-center">
          <div className="mx-auto rounded-circle bg-success bg-opacity-10 d-flex align-items-center justify-content-center mb-3" style={{width: 64, height: 64}}>
            <Plus className="text-success" size={32} />
          </div>
          <h2 className="h5 fw-bold text-dark mb-2">
            Opportunity Created Successfully!
          </h2>
          <p className="text-muted">
            Your opportunity has been added to the pipeline.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4 h-100 overflow-auto">
      <div className="container" style={{maxWidth: '900px'}}>
        <div className="mb-4">
          <h1 className="h4 fw-bold text-dark">Add New Opportunity</h1>
          <p className="text-muted mt-1 mb-0">Create a new opportunity in the sales pipeline</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded shadow-sm border p-4">
          {/* Submit Error */}
          {errors.submit && (
            <div className="alert alert-danger d-flex align-items-center py-2 mb-3" role="alert">
              <AlertCircle className="me-2" size={18} />
              <span className="small">{errors.submit}</span>
            </div>
          )}

          {/* Basic Information */}
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label small">SFDC ID *</label>
              <input
                type="text"
                value={formData.sfdc_id}
                onChange={(e) => handleChange('sfdc_id', e.target.value)}
                className={`form-control ${errors.sfdc_id ? 'is-invalid' : ''}`}
                placeholder="e.g., OPP-2024-001"
              />
              {errors.sfdc_id && (
                <div className="invalid-feedback d-flex align-items-center">
                  <AlertCircle className="me-1" size={16} />
                  {errors.sfdc_id}
                </div>
              )}
            </div>
            <div className="col-md-6">
              <label className="form-label small">Specialist *</label>
              <input
                type="text"
                value={formData.specialist}
                onChange={(e) => handleChange('specialist', e.target.value)}
                className={`form-control ${errors.specialist ? 'is-invalid' : ''}`}
                placeholder="Enter specialist name"
              />
              {errors.specialist && (
                <div className="invalid-feedback d-flex align-items-center">
                  <AlertCircle className="me-1" size={16} />
                  {errors.specialist}
                </div>
              )}
            </div>
            <div className="col-md-6">
              <label className="form-label small">Client</label>
              <input
                type="text"
                value={formData.client}
                onChange={(e) => handleChange('client', e.target.value)}
                className="form-control"
                placeholder="Enter client name"
              />
            </div>
            <div className="col-md-6">
              <label className="form-label small">Industry</label>
              <select
                value={formData.industry}
                onChange={(e) => handleChange('industry', e.target.value)}
                className="form-select"
              >
                <option value="">Select Industry</option>
                {INDUSTRIES.map(industry => (
                  <option key={industry} value={industry}>{industry}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Project Details */}
          <div className="mt-4">
            <div className="mb-3">
              <label className="form-label small">Client Ask *</label>
              <textarea
                value={formData.client_ask}
                onChange={(e) => handleChange('client_ask', e.target.value)}
                rows={3}
                className={`form-control ${errors.client_ask ? 'is-invalid' : ''}`}
                placeholder="Describe what the client is asking for..."
              />
              {errors.client_ask && (
                <div className="invalid-feedback d-flex align-items-center">
                  <AlertCircle className="me-1" size={16} />
                  {errors.client_ask}
                </div>
              )}
            </div>
            <div className="mb-3">
              <label className="form-label small">Needs *</label>
              <textarea
                value={formData.needs}
                onChange={(e) => handleChange('needs', e.target.value)}
                rows={3}
                className={`form-control ${errors.needs ? 'is-invalid' : ''}`}
                placeholder="What are the client's specific needs..."
              />
              {errors.needs && (
                <div className="invalid-feedback d-flex align-items-center">
                  <AlertCircle className="me-1" size={16} />
                  {errors.needs}
                </div>
              )}
            </div>
            <div className="mb-3">
              <label className="form-label small">Why Launch</label>
              <textarea
                value={formData.why_launch}
                onChange={(e) => handleChange('why_launch', e.target.value)}
                rows={2}
                className="form-control"
                placeholder="Why should Launch take this opportunity..."
              />
            </div>
          </div>

          {/* Offerings */}
          <div className="mb-4">
            <label className="form-label small">Offerings</label>
            <div className="row g-2 border rounded p-3" style={{maxHeight: '8rem', overflowY: 'auto'}}>
              {OFFERINGS.map(offering => (
                <div className="col-6" key={offering}>
                  <div className="form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={formData.offerings.includes(offering)}
                      onChange={(e) => {
                        const currentOfferings = formData.offerings || [];
                        const newOfferings = e.target.checked
                          ? [...currentOfferings, offering]
                          : currentOfferings.filter(o => o !== offering);
                        handleChange('offerings', newOfferings);
                      }}
                      id={`offering-${offering}`}
                    />
                    <label className="form-check-label small" htmlFor={`offering-${offering}`}>{offering}</label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Financial Information */}
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label small">AOP Value</label>
              <div className="input-group">
                <span className="input-group-text">$</span>
                <input
                  type="number"
                  value={formData.aop_value}
                  onChange={(e) => handleChange('aop_value', e.target.value)}
                  className={`form-control ${errors.aop_value ? 'is-invalid' : ''}`}
                  placeholder="0"
                />
              </div>
              {errors.aop_value && (
                <div className="invalid-feedback d-flex align-items-center">
                  <AlertCircle className="me-1" size={16} />
                  {errors.aop_value}
                </div>
              )}
            </div>
            <div className="col-md-6">
              <label className="form-label small">EENU Value</label>
              <div className="input-group">
                <span className="input-group-text">$</span>
                <input
                  type="number"
                  value={formData.eenu_value}
                  onChange={(e) => handleChange('eenu_value', e.target.value)}
                  className={`form-control ${errors.eenu_value ? 'is-invalid' : ''}`}
                  placeholder="0"
                />
              </div>
              {errors.eenu_value && (
                <div className="invalid-feedback d-flex align-items-center">
                  <AlertCircle className="me-1" size={16} />
                  {errors.eenu_value}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="d-flex justify-content-end gap-2 pt-4 border-top mt-4">
            <button
              type="button"
              onClick={() => window.location.hash = '#/dashboard'}
              className="btn btn-outline-secondary px-4"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary d-flex align-items-center px-4"
            >
              {isSubmitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Creating...
                </>
              ) : (
                <>
                  <Save className="me-2" size={16} />
                  Create Opportunity
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddView;