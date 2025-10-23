import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';

const AddOpportunity = () => {
  const { user } = useAuth();
  const { createOpportunity, getFilterOptions, INDUSTRIES } = useData();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const [clients, setClients] = useState([]);

  // Form state
  const [formData, setFormData] = useState({
    specialist: user?.name || '',
    client: '',
    client_ask: '',
    needs: '',
    why_launch: '',
    sfdc_id: '',
    industry: '',
    proposal_due_date: '',
    // POC fields - only show at Intake stage or later
    assigned_resources: {
      solution_architect: '',
      design_poc: '',
      strategy_poc: '',
      delivery_poc: '',
      tech_poc: ''
    }
  });

  // Load existing clients for dropdown
  useEffect(() => {
    const filterOptions = getFilterOptions();
    setClients(filterOptions.clients);
  }, [getFilterOptions]);

  // Auto-generate SFDC ID if needed
  useEffect(() => {
    if (!formData.sfdc_id) {
      const year = new Date().getFullYear();
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      setFormData(prev => ({
        ...prev,
        sfdc_id: `SF-${year}-${random}`
      }));
    }
  }, [formData.sfdc_id]);

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('resource_')) {
      const resourceType = name.replace('resource_', '');
      setFormData(prev => ({
        ...prev,
        assigned_resources: {
          ...prev.assigned_resources,
          [resourceType]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  // Validation function
  const validateForm = () => {
    const newErrors = {};

    // Required fields
    if (!formData.specialist.trim()) {
      newErrors.specialist = 'Specialist is required';
    }
    
    if (!formData.client.trim()) {
      newErrors.client = 'Client is required';
    }
    
    if (!formData.client_ask.trim()) {
      newErrors.client_ask = 'Client ask is required';
    } else if (formData.client_ask.length < 20) {
      newErrors.client_ask = 'Please provide more detail (minimum 20 characters)';
    }
    
    if (!formData.needs.trim()) {
      newErrors.needs = 'Needs description is required';
    } else if (formData.needs.length < 20) {
      newErrors.needs = 'Please provide more detail (minimum 20 characters)';
    }
    
    if (!formData.why_launch.trim()) {
      newErrors.why_launch = 'Why Launch is required';
    } else if (formData.why_launch.length < 20) {
      newErrors.why_launch = 'Please provide more detail (minimum 20 characters)';
    }

    // SFDC ID validation
    if (!formData.sfdc_id.trim()) {
      newErrors.sfdc_id = 'SFDC ID is required';
    } else if (!/^SF-\d{4}-\d{3}$/.test(formData.sfdc_id)) {
      newErrors.sfdc_id = 'SFDC ID must be in format SF-YYYY-XXX (e.g., SF-2024-001)';
    }

    // Proposal due date validation
    if (formData.proposal_due_date) {
      const dueDate = new Date(formData.proposal_due_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (dueDate < today) {
        newErrors.proposal_due_date = 'Proposal due date cannot be in the past';
      }
    }

    return newErrors;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      // Scroll to first error
      const firstErrorField = Object.keys(validationErrors)[0];
      const errorElement = document.getElementsByName(firstErrorField)[0];
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        errorElement.focus();
      }
      return;
    }

    setIsSubmitting(true);
    try {
      // Create the opportunity
      await createOpportunity(formData);
      
      // Show success message
      setShowSuccess(true);
      
      // Reset form after a delay
      setTimeout(() => {
        setFormData({
          specialist: user?.name || '',
          client: '',
          client_ask: '',
          needs: '',
          why_launch: '',
          sfdc_id: '',
          industry: '',
          proposal_due_date: '',
          assigned_resources: {
            solution_architect: '',
            design_poc: '',
            strategy_poc: '',
            delivery_poc: '',
            tech_poc: ''
          }
        });
        setShowSuccess(false);
      }, 3000);

    } catch (error) {
      console.error('Error creating opportunity:', error);
      setErrors({ submit: 'Failed to create opportunity. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Character counters
  const getCharacterCount = (text, max) => {
    const current = text?.length || 0;
    const color = current > max * 0.9 ? 'text-danger' : current > max * 0.7 ? 'text-warning' : 'text-muted';
    return { current, max, color };
  };

  return (
    <div className="container" style={{maxWidth: '800px'}}>
      {/* Header */}
      <div className="mb-4">
        <h1 className="h2 fw-bold">Add New Opportunity</h1>
        <p className="text-muted">
          Create a new deal opportunity. All new opportunities start in "New" stage and can be moved to "Intake" for review.
        </p>
      </div>

      {/* Success Message */}
      {showSuccess && (
        <div className="alert alert-success mb-4" role="alert">
          <div className="d-flex align-items-center">
            <svg className="me-2" style={{height: '1.25rem', width: '1.25rem'}} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div>
              <div className="fw-medium">Opportunity created successfully!</div>
              <div className="small mt-1">The new opportunity has been added to your pipeline.</div>
            </div>
          </div>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit}>
        {/* Basic Information Section */}
        <div className="card mb-4">
          <div className="card-body">
            <h2 className="h5 fw-semibold mb-4">Basic Information</h2>
            
            <div className="row">
              {/* Specialist */}
              <div className="col-lg-6 mb-3">
                <label htmlFor="specialist" className="form-label fw-semibold">
                  Specialist <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  id="specialist"
                  name="specialist"
                  value={formData.specialist}
                  onChange={handleChange}
                  className={`form-control ${errors.specialist ? 'is-invalid' : ''}`}
                  placeholder="Enter specialist name"
                />
                {errors.specialist && (
                  <div className="invalid-feedback">{errors.specialist}</div>
                )}
              </div>

              {/* SFDC ID */}
              <div className="col-lg-6 mb-3">
                <label htmlFor="sfdc_id" className="form-label fw-semibold">
                  SFDC ID <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  id="sfdc_id"
                  name="sfdc_id"
                  value={formData.sfdc_id}
                  onChange={handleChange}
                  className={`form-control ${errors.sfdc_id ? 'is-invalid' : ''}`}
                  placeholder="SF-2024-001"
                />
                {errors.sfdc_id && (
                  <div className="invalid-feedback">{errors.sfdc_id}</div>
                )}
                <div className="form-text">Format: SF-YYYY-XXX</div>
              </div>

              {/* Client */}
              <div className="col-12 mb-3">
                <label htmlFor="client" className="form-label fw-semibold">
                  Client <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  id="client"
                  name="client"
                  value={formData.client}
                  onChange={handleChange}
                  className={`form-control ${errors.client ? 'is-invalid' : ''}`}
                  placeholder="Enter client name or select from existing"
                  list="clients-list"
                />
                <datalist id="clients-list">
                  {clients.map(client => (
                    <option key={client} value={client} />
                  ))}
                </datalist>
                {errors.client && (
                  <div className="invalid-feedback">{errors.client}</div>
                )}
              </div>

              {/* Industry */}
              <div className="col-lg-6 mb-3">
                <label htmlFor="industry" className="form-label fw-semibold">
                  Industry
                </label>
                <select
                  id="industry"
                  name="industry"
                  value={formData.industry}
                  onChange={handleChange}
                  className="form-select"
                >
                  <option value="">Select industry</option>
                  {INDUSTRIES.map(industry => (
                    <option key={industry} value={industry}>{industry}</option>
                  ))}
                </select>
              </div>

              {/* Proposal Due Date */}
              <div className="col-lg-6 mb-3">
                <label htmlFor="proposal_due_date" className="form-label fw-semibold">
                  Proposal Due Date
                </label>
                <input
                  type="date"
                  id="proposal_due_date"
                  name="proposal_due_date"
                  value={formData.proposal_due_date}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  className={`form-control ${errors.proposal_due_date ? 'is-invalid' : ''}`}
                />
                {errors.proposal_due_date && (
                  <div className="invalid-feedback">{errors.proposal_due_date}</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Opportunity Details Section */}
        <div className="card mb-4">
          <div className="card-body">
            <h2 className="h5 fw-semibold mb-4">Opportunity Details</h2>
            
            {/* Client Ask */}
            <div className="mb-4">
              <label htmlFor="client_ask" className="form-label fw-semibold">
                Client Ask <span className="text-danger">*</span>
              </label>
              <textarea
                id="client_ask"
                name="client_ask"
                value={formData.client_ask}
                onChange={handleChange}
                rows={4}
                className={`form-control ${errors.client_ask ? 'is-invalid' : ''}`}
                placeholder="Describe what the client is asking for in detail..."
                maxLength={500}
                style={{resize: 'none'}}
              />
              <div className="d-flex justify-content-between align-items-center mt-2">
                {errors.client_ask ? (
                  <div className="text-danger small">{errors.client_ask}</div>
                ) : (
                  <div className="form-text">Minimum 20 characters required</div>
                )}
                <span className={`small fw-medium ${getCharacterCount(formData.client_ask, 500).color}`}>
                  {getCharacterCount(formData.client_ask, 500).current}/500
                </span>
              </div>
            </div>

            {/* Needs */}
            <div className="mb-4">
              <label htmlFor="needs" className="form-label fw-semibold">
                Needs <span className="text-danger">*</span>
              </label>
              <textarea
                id="needs"
                name="needs"
                value={formData.needs}
                onChange={handleChange}
                rows={4}
                className={`form-control ${errors.needs ? 'is-invalid' : ''}`}
                placeholder="What specific needs or challenges does this opportunity address..."
                maxLength={500}
                style={{resize: 'none'}}
              />
              <div className="d-flex justify-content-between align-items-center mt-2">
                {errors.needs ? (
                  <div className="text-danger small">{errors.needs}</div>
                ) : (
                  <div className="form-text">Minimum 20 characters required</div>
                )}
                <span className={`small fw-medium ${getCharacterCount(formData.needs, 500).color}`}>
                  {getCharacterCount(formData.needs, 500).current}/500
                </span>
              </div>
            </div>

            {/* Why Launch */}
            <div className="mb-4">
              <label htmlFor="why_launch" className="form-label fw-semibold">
                Why Launch? <span className="text-danger">*</span>
              </label>
              <textarea
                id="why_launch"
                name="why_launch"
                value={formData.why_launch}
                onChange={handleChange}
                rows={4}
                className={`form-control ${errors.why_launch ? 'is-invalid' : ''}`}
                placeholder="Why is Launch the right partner for this opportunity..."
                maxLength={500}
                style={{resize: 'none'}}
              />
              <div className="d-flex justify-content-between align-items-center mt-2">
                {errors.why_launch ? (
                  <div className="text-danger small">{errors.why_launch}</div>
                ) : (
                  <div className="form-text">Minimum 20 characters required</div>
                )}
                <span className={`small fw-medium ${getCharacterCount(formData.why_launch, 500).color}`}>
                  {getCharacterCount(formData.why_launch, 500).current}/500
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="card mb-4">
          <div className="card-body">
            <div className="d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center text-muted">
                <svg className="me-2 text-primary" style={{height: '1rem', width: '1rem'}} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span className="small">New opportunities start in "New" stage • Resources assigned during intake</span>
              </div>
              
              <div className="d-flex gap-2">
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="btn btn-outline-secondary"
                  disabled={isSubmitting}
                >
                  Reset Form
                </button>
                
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary"
                >
                  {isSubmitting ? (
                    <div className="d-flex align-items-center">
                      <div className="spinner-border spinner-border-sm me-2" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      Creating...
                    </div>
                  ) : (
                    'Create Opportunity'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Error */}
        {errors.submit && (
          <div className="alert alert-danger mb-4" role="alert">
            <div className="d-flex">
              <svg className="me-2" style={{height: '1.25rem', width: '1.25rem'}} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="mb-0">{errors.submit}</p>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default AddOpportunity;