import React, { useState } from 'react';
import { Plus, X, Save, Trash2 } from 'lucide-react';

const FilterBuilder = ({ filters, setFilters, savedFilters, setSavedFilters, onClose }) => {
  const [newFilterName, setNewFilterName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const FILTER_FIELDS = [
    { value: 'specialist', label: 'Specialist' },
    { value: 'client', label: 'Client' },
    { value: 'stage', label: 'Stage' },
    { value: 'client_ask', label: 'Client Ask' },
    { value: 'industry', label: 'Industry' },
    { value: 'aop_value', label: 'AOP Value' },
    { value: 'eenu_value', label: 'EENU Value' },
    { value: 'created_date', label: 'Created Date' },
    { value: 'updated_date', label: 'Updated Date' }
  ];

  const OPERATORS = {
    text: [
      { value: 'contains', label: 'Contains' },
      { value: 'equals', label: 'Equals' },
      { value: 'starts_with', label: 'Starts with' },
      { value: 'ends_with', label: 'Ends with' },
      { value: 'not_empty', label: 'Is not empty' },
      { value: 'is_empty', label: 'Is empty' }
    ],
    number: [
      { value: 'equals', label: 'Equals' },
      { value: 'greater_than', label: 'Greater than' },
      { value: 'less_than', label: 'Less than' },
      { value: 'not_empty', label: 'Is not empty' },
      { value: 'is_empty', label: 'Is empty' }
    ]
  };

  const getFieldType = (field) => {
    if (['aop_value', 'eenu_value'].includes(field)) return 'number';
    return 'text';
  };

  const addFilter = () => {
    setFilters([
      ...filters,
      { field: 'specialist', operator: 'contains', value: '', id: Date.now() }
    ]);
  };

  const updateFilter = (id, updates) => {
    setFilters(filters.map(filter => 
      filter.id === id ? { ...filter, ...updates } : filter
    ));
  };

  const removeFilter = (id) => {
    setFilters(filters.filter(filter => filter.id !== id));
  };

  const clearAllFilters = () => {
    setFilters([]);
  };

  const saveFilterSet = () => {
    if (!newFilterName.trim()) return;
    
    const newSavedFilter = {
      id: Date.now(),
      name: newFilterName,
      filters: [...filters]
    };
    
    const updated = [...savedFilters, newSavedFilter];
    setSavedFilters(updated);
    localStorage.setItem('savedFilters', JSON.stringify(updated));
    
    setNewFilterName('');
    setShowSaveDialog(false);
  };

  const loadFilterSet = (savedFilter) => {
    setFilters(savedFilter.filters.map(f => ({ ...f, id: Date.now() + Math.random() })));
  };

  const deleteSavedFilter = (id) => {
    const updated = savedFilters.filter(f => f.id !== id);
    setSavedFilters(updated);
    localStorage.setItem('savedFilters', JSON.stringify(updated));
  };

  const needsValue = (operator) => {
    return !['not_empty', 'is_empty'].includes(operator);
  };

  return (
    <div className="border-bottom bg-light p-4">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <h3 className="fs-6 fw-medium mb-0">Advanced Filters</h3>
        <button
          onClick={onClose}
          className="btn btn-sm btn-outline-secondary"
        >
          <X style={{width: '1rem', height: '1rem'}} />
        </button>
      </div>

      {/* Saved Filters */}
      {savedFilters.length > 0 && (
        <div className="mb-4">
          <div className="text-muted small mb-2">Saved Filters:</div>
          <div className="d-flex flex-wrap gap-2">
            {savedFilters.map(savedFilter => (
              <div key={savedFilter.id} className="btn-group">
                <button
                  onClick={() => loadFilterSet(savedFilter)}
                  className="btn btn-sm btn-outline-secondary"
                >
                  {savedFilter.name}
                </button>
                <button
                  onClick={() => deleteSavedFilter(savedFilter.id)}
                  className="btn btn-sm btn-outline-danger"
                >
                  <Trash2 style={{width: '0.75rem', height: '0.75rem'}} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Current Filters */}
      <div className="mb-4">
        {filters.map(filter => (
          <div key={filter.id} className="d-flex align-items-center gap-2 bg-white p-2 rounded border mb-2">
            <select
              value={filter.field}
              onChange={(e) => updateFilter(filter.id, { field: e.target.value })}
              className="form-select form-select-sm"
              style={{width: '150px'}}
            >
              {FILTER_FIELDS.map(field => (
                <option key={field.value} value={field.value}>
                  {field.label}
                </option>
              ))}
            </select>

            <select
              value={filter.operator}
              onChange={(e) => updateFilter(filter.id, { operator: e.target.value })}
              className="form-select form-select-sm"
              style={{width: '150px'}}
            >
              {OPERATORS[getFieldType(filter.field)].map(op => (
                <option key={op.value} value={op.value}>
                  {op.label}
                </option>
              ))}
            </select>

            {needsValue(filter.operator) && (
              <input
                type={getFieldType(filter.field) === 'number' ? 'number' : 'text'}
                value={filter.value}
                onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                placeholder="Filter value..."
                className="form-control form-control-sm flex-fill"
              />
            )}

            <button
              onClick={() => removeFilter(filter.id)}
              className="btn btn-sm btn-outline-danger"
            >
              <X style={{width: '1rem', height: '1rem'}} />
            </button>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center gap-2">
          <button
            onClick={addFilter}
            className="btn btn-sm btn-outline-secondary d-flex align-items-center"
          >
            <Plus className="me-1" style={{width: '1rem', height: '1rem'}} />
            Add Filter
          </button>
          
          {filters.length > 0 && (
            <button
              onClick={clearAllFilters}
              className="btn btn-sm btn-outline-danger"
            >
              Clear All
            </button>
          )}
        </div>

        {filters.length > 0 && (
          <div className="d-flex align-items-center gap-2">
            {showSaveDialog ? (
              <div className="d-flex align-items-center gap-2">
                <input
                  type="text"
                  value={newFilterName}
                  onChange={(e) => setNewFilterName(e.target.value)}
                  placeholder="Filter name..."
                  className="form-control form-control-sm"
                  style={{width: '150px'}}
                  onKeyPress={(e) => e.key === 'Enter' && saveFilterSet()}
                />
                <button
                  onClick={saveFilterSet}
                  className="btn btn-sm btn-primary"
                >
                  Save
                </button>
                <button
                  onClick={() => setShowSaveDialog(false)}
                  className="btn btn-sm btn-outline-secondary"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowSaveDialog(true)}
                className="btn btn-sm btn-outline-secondary d-flex align-items-center"
              >
                <Save className="me-1" style={{width: '1rem', height: '1rem'}} />
                Save Filter Set
              </button>
            )}
          </div>
        )}
      </div>

      {/* Filter Summary */}
      {filters.length > 0 && (
        <div className="mt-2 small text-muted">
          Active filters: {filters.length} condition{filters.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};

export default FilterBuilder;