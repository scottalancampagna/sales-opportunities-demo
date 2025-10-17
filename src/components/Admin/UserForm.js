import React, { useState, useEffect } from 'react';
import { X, User, Mail, Shield, AlertCircle } from 'lucide-react';
import { USER_ROLES } from '../../utils/constants';

const UserForm = ({ user, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'GTM'
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        role: user.role || 'GTM'
      });
    }
  }, [user]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!USER_ROLES.includes(formData.role)) {
      newErrors.role = 'Please select a valid role';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      const success = await onSave(formData);
      if (success) onClose();
    } catch (error) {
      console.error('Error saving user:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const getRoleDescription = (role) => {
    const descriptions = {
      'Admin': 'Full system access - can manage users, edit all opportunities, change any stage',
      'GTMLead': 'Can manage intake process - change stages from Intake to other stages',
      'GTM': 'Can manage proposals - change stages when opportunities are in Proposal',
      'PracticeLead': 'Can edit opportunity details when in Shaping stage',
      'POC': 'Can update POC fields when opportunities are in Intake or later stages'
    };
    return descriptions[role] || '';
  };

  return (
    <div className="modal fade show d-block" tabIndex="-1" role="dialog" style={{background:'rgba(0,0,0,0.5)'}}>
      <div className="modal-dialog modal-lg modal-dialog-centered" role="document">
        <div className="modal-content">
          {/* Header */}
          <div className="modal-header bg-light">
            <div className="d-flex align-items-center gap-2">
              <User className="me-2 text-primary" />
              <h2 className="modal-title h5 mb-0">{user ? 'Edit User' : 'Add New User'}</h2>
            </div>
            <button onClick={onClose} className="btn btn-light" data-bs-dismiss="modal">
              <X />
            </button>
          </div>
          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {/* Name Field */}
              <div className="mb-3">
                <label className="form-label">Full Name *</label>
                <div className="input-group">
                  <span className="input-group-text"><User className="text-secondary" /></span>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className={`form-control${errors.name ? ' is-invalid' : ''}`}
                    placeholder="Enter full name"
                  />
                  {errors.name && (
                    <div className="invalid-feedback d-flex align-items-center">
                      <AlertCircle className="me-1" />
                      {errors.name}
                    </div>
                  )}
                </div>
              </div>
              {/* Email Field */}
              <div className="mb-3">
                <label className="form-label">Email Address *</label>
                <div className="input-group">
                  <span className="input-group-text"><Mail className="text-secondary" /></span>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className={`form-control${errors.email ? ' is-invalid' : ''}`}
                    placeholder="Enter email address"
                  />
                  {errors.email && (
                    <div className="invalid-feedback d-flex align-items-center">
                      <AlertCircle className="me-1" />
                      {errors.email}
                    </div>
                  )}
                </div>
              </div>
              {/* Role Field */}
              <div className="mb-3">
                <label className="form-label">Role *</label>
                <div className="input-group">
                  <span className="input-group-text"><Shield className="text-secondary" /></span>
                  <select
                    value={formData.role}
                    onChange={(e) => handleChange('role', e.target.value)}
                    className={`form-select${errors.role ? ' is-invalid' : ''}`}
                  >
                    {USER_ROLES.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                  {errors.role && (
                    <div className="invalid-feedback d-flex align-items-center">
                      <AlertCircle className="me-1" />
                      {errors.role}
                    </div>
                  )}
                </div>
                {/* Role Description */}
                {formData.role && (
                  <div className="alert alert-primary mt-2 p-2 small mb-0">
                    <div className="fw-bold mb-1">Role Permissions:</div>
                    <div>{getRoleDescription(formData.role)}</div>
                  </div>
                )}
              </div>
            </div>
            {/* Actions */}
            <div className="modal-footer bg-light">
              <button type="button" onClick={onClose} className="btn btn-outline-secondary">Cancel</button>
              <button type="submit" disabled={isSubmitting} className="btn btn-primary">
                {isSubmitting ? 'Saving...' : user ? 'Update User' : 'Create User'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserForm;