import React, { useState, useEffect, useRef } from 'react';
import { Search, Check, AlertTriangle, Building } from 'lucide-react';
import { useData } from '../../contexts/DataContext';

const SmartClientInput = ({ 
  value, 
  onSave, 
  placeholder = 'Enter or select client name...',
  className = '',
  disabled = false,
  required = false,
  label = 'Client'
}) => {
  const { getClientSuggestions, findSimilarClients, normalizeClientName } = useData();
  const [localValue, setLocalValue] = useState(value || '');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [similarClients, setSimilarClients] = useState([]);
  const [saveStatus, setSaveStatus] = useState('saved');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  useEffect(() => {
    setLocalValue(value || '');
  }, [value]);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    
    // Update suggestions
    if (newValue.trim()) {
      const clientSuggestions = getClientSuggestions(newValue);
      setSuggestions(clientSuggestions.slice(0, 8)); // Limit to 8 suggestions
      setShowSuggestions(clientSuggestions.length > 0);
      
      // Check for similar clients (potential duplicates)
      const similar = findSimilarClients(newValue);
      setSimilarClients(similar);
    } else {
      setShowSuggestions(false);
      setSimilarClients([]);
    }
    
    setSelectedIndex(-1);
  };

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow clicking on them
    setTimeout(() => {
      setShowSuggestions(false);
      handleSave(localValue);
    }, 200);
  };

  const handleSave = async (clientName) => {
    if (clientName === value || disabled) return;
    
    setSaveStatus('saving');
    try {
      await onSave(clientName);
      setSaveStatus('saved');
    } catch (error) {
      console.error('Error saving client:', error);
      setSaveStatus('error');
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setLocalValue(suggestion);
    setShowSuggestions(false);
    setSimilarClients([]);
    handleSave(suggestion);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSuggestionClick(suggestions[selectedIndex]);
        } else {
          setShowSuggestions(false);
          handleSave(localValue);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const getSaveStatusIcon = () => {
    switch (saveStatus) {
      case 'saving':
        return <div className="spinner-border spinner-border-sm text-primary" style={{width: '12px', height: '12px'}}></div>;
      case 'saved':
        return <Check size={12} className="text-success" />;
      case 'error':
        return <AlertTriangle size={12} className="text-danger" />;
      default:
        return <Building size={12} className="text-muted" />;
    }
  };

  return (
    <div className={`smart-client-input position-relative ${className}`}>
      {label && (
        <div className="d-flex align-items-center justify-content-between mb-2">
          <label className="form-label mb-0 fw-medium">
            <Building size={14} className="me-1" />
            {label} {required && <span className="text-danger">*</span>}
          </label>
          <div className="d-flex align-items-center text-muted small">
            {getSaveStatusIcon()}
            {saveStatus === 'saving' && <span className="ms-1">Saving...</span>}
          </div>
        </div>
      )}

      <div className="position-relative">
        <input
          ref={inputRef}
          type="text"
          value={localValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={`form-control ${saveStatus === 'saved' ? 'is-valid' : ''}`}
          autoComplete="off"
        />
        
        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div 
            ref={suggestionsRef}
            className="position-absolute top-100 start-0 end-0 bg-white border rounded-bottom shadow-sm"
            style={{ zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}
          >
            {suggestions.map((suggestion, index) => (
              <div
                key={suggestion}
                onClick={() => handleSuggestionClick(suggestion)}
                className={`px-3 py-2 cursor-pointer border-bottom small ${
                  index === selectedIndex ? 'bg-primary bg-opacity-10' : ''
                }`}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="d-flex align-items-center">
                  <Building size={12} className="text-muted me-2" />
                  <span>{suggestion}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Similar Clients Warning */}
      {similarClients.length > 0 && localValue.trim() && (
        <div className="alert alert-warning mt-2 p-2">
          <div className="d-flex align-items-start">
            <AlertTriangle size={14} className="text-warning me-2 mt-1 flex-shrink-0" />
            <div>
              <small className="fw-medium">Similar clients found:</small>
              <div className="mt-1">
                {similarClients.slice(0, 3).map((similar, index) => (
                  <button
                    key={similar}
                    onClick={() => handleSuggestionClick(similar)}
                    className="btn btn-sm btn-outline-warning me-2 mb-1"
                    style={{ fontSize: '0.75rem', padding: '0.125rem 0.5rem' }}
                  >
                    {similar}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartClientInput;