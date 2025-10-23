import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, User, Edit, ArrowRight, Plus, Calendar, Clock, ChevronDown, ChevronUp } from 'lucide-react';

const AuditTrail = ({ opportunity, onAddEntry }) => {
  const [auditEntries, setAuditEntries] = useState([]);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState('all');
  const [selectedUser, setSelectedUser] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [expandedEntries, setExpandedEntries] = useState(new Set());

  // Load and process audit entries
  useEffect(() => {
    const entries = (opportunity.audit_trail || [])
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    setAuditEntries(entries);
  }, [opportunity]);

  // Filter entries based on search and filters
  useEffect(() => {
    let filtered = [...auditEntries];

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(entry =>
        entry.user?.toLowerCase().includes(search) ||
        entry.action?.toLowerCase().includes(search) ||
        entry.field?.toLowerCase().includes(search) ||
        entry.notes?.toLowerCase().includes(search) ||
        entry.old_value?.toLowerCase().includes(search) ||
        entry.new_value?.toLowerCase().includes(search)
      );
    }

    // Action filter
    if (selectedAction !== 'all') {
      filtered = filtered.filter(entry => entry.action === selectedAction);
    }

    // User filter
    if (selectedUser !== 'all') {
      filtered = filtered.filter(entry => entry.user === selectedUser);
    }

    // Date range filter
    if (dateRange.start) {
      const startDate = new Date(dateRange.start);
      filtered = filtered.filter(entry => new Date(entry.timestamp) >= startDate);
    }
    if (dateRange.end) {
      const endDate = new Date(dateRange.end + 'T23:59:59');
      filtered = filtered.filter(entry => new Date(entry.timestamp) <= endDate);
    }

    setFilteredEntries(filtered);
  }, [auditEntries, searchTerm, selectedAction, selectedUser, dateRange]);

  const handleExportAuditTrail = () => {
    const csvHeaders = ['Timestamp', 'User', 'Action', 'Field', 'Old Value', 'New Value', 'Notes'];
    const csvData = filteredEntries.map(entry => [
      new Date(entry.timestamp).toLocaleString(),
      entry.user || '',
      entry.action || '',
      entry.field || '',
      entry.old_value || '',
      entry.new_value || '',
      entry.notes || ''
    ]);

    const csvContent = [
      csvHeaders.join(','),
      ...csvData.map(row => 
        row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `audit_trail_${opportunity.sfdc_id}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleEntryExpansion = (index) => {
    const newExpanded = new Set(expandedEntries);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedEntries(newExpanded);
  };

  const getActionIcon = (action) => {
    const icons = {
      'create': Plus,
      'edit': Edit,
      'stage_change': ArrowRight,
      'assignment': User,
      'view': Clock,
      'export': Download
    };
    const Icon = icons[action] || Edit;
    return <Icon size={16} />;
  };

  const getActionColor = (action) => {
    const colors = {
      'create': 'success',
      'edit': 'primary',
      'stage_change': 'info',
      'assignment': 'warning',
      'view': 'secondary',
      'export': 'dark'
    };
    return colors[action] || 'secondary';
  };

  const formatFieldName = (field) => {
    if (!field) return '';
    
    // Handle nested fields like 'assigned_resources.solution_architect'
    if (field.includes('.')) {
      const parts = field.split('.');
      return parts.map(part => 
        part.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      ).join(' > ');
    }
    
    return field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatValue = (value) => {
    if (value === null || value === undefined || value === '') {
      return <span className="text-muted fst-italic">empty</span>;
    }
    
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    
    return String(value);
  };

  // Get unique users and actions for filters
  const uniqueUsers = [...new Set(auditEntries.map(entry => entry.user))].filter(Boolean).sort();
  const uniqueActions = [...new Set(auditEntries.map(entry => entry.action))].filter(Boolean).sort();

  return (
    <div className="h-100 d-flex flex-column">
      {/* Header and Filters */}
      <div className="bg-white border-bottom p-4 flex-shrink-0">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div>
            <h4 className="mb-1">Audit Trail</h4>
            <p className="text-muted small mb-0">Complete history of changes to this opportunity</p>
          </div>
          
          <button
            onClick={handleExportAuditTrail}
            className="btn btn-outline-primary btn-sm d-flex align-items-center"
          >
            <Download size={14} className="me-2" />
            Export
          </button>
        </div>

        {/* Filters */}
        <div className="row g-2">
          {/* Search */}
          <div className="col-md-3">
            <div className="input-group input-group-sm">
              <span className="input-group-text">
                <Search size={14} />
              </span>
              <input
                type="text"
                placeholder="Search audit trail..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-control"
              />
            </div>
          </div>

          {/* Action Filter */}
          <div className="col-md-2">
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="form-select form-select-sm"
            >
              <option value="all">All Actions</option>
              {uniqueActions.map(action => (
                <option key={action} value={action}>
                  {action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>
          </div>

          {/* User Filter */}
          <div className="col-md-2">
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="form-select form-select-sm"
            >
              <option value="all">All Users</option>
              {uniqueUsers.map(user => (
                <option key={user} value={user}>{user}</option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div className="col-md-5">
            <div className="row g-1">
              <div className="col-6">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="form-control form-control-sm"
                  placeholder="Start date"
                />
              </div>
              <div className="col-6">
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="form-control form-control-sm"
                  placeholder="End date"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="d-flex align-items-center justify-content-between mt-3 text-muted small">
          <div>
            Showing {filteredEntries.length} of {auditEntries.length} entries
          </div>
          <div className="d-flex gap-3">
            <span>Total Changes: {auditEntries.length}</span>
            <span>Contributors: {uniqueUsers.length}</span>
          </div>
        </div>
      </div>

      {/* Audit Entries */}
      <div className="flex-grow-1 overflow-auto p-4">
        {filteredEntries.length === 0 ? (
          <div className="text-center py-5">
            <Clock size={48} className="text-muted mb-3" />
            <h5 className="text-muted">No audit entries found</h5>
            {searchTerm || selectedAction !== 'all' || selectedUser !== 'all' || dateRange.start || dateRange.end ? (
              <p className="text-muted small">Try adjusting your search filters</p>
            ) : null}
          </div>
        ) : (
          <div className="d-flex flex-column gap-3">
            {filteredEntries.map((entry, index) => (
              <div key={index} className="card shadow-sm">
                <div 
                  className="card-body p-3 cursor-pointer"
                  onClick={() => toggleEntryExpansion(index)}
                  role="button"
                >
                  <div className="d-flex align-items-start">
                    {/* Icon */}
                    <div className={`me-3 mt-1 text-${getActionColor(entry.action)}`}>
                      {getActionIcon(entry.action)}
                    </div>

                    {/* Content */}
                    <div className="flex-grow-1 min-w-0">
                      <div className="d-flex align-items-start justify-content-between">
                        <div className="flex-grow-1 min-w-0">
                          {/* Action Summary */}
                          <div className="small fw-medium text-dark mb-1">
                            <span className="text-primary fw-semibold">{entry.user}</span>
                            <span className="text-muted ms-1">
                              {entry.action === 'create' && 'created the opportunity'}
                              {entry.action === 'edit' && `updated ${formatFieldName(entry.field)}`}
                              {entry.action === 'stage_change' && `changed stage to ${entry.new_value}`}
                              {entry.action === 'assignment' && `assigned ${formatFieldName(entry.field)}`}
                              {!['create', 'edit', 'stage_change', 'assignment'].includes(entry.action) && 
                                `performed ${entry.action.replace(/_/g, ' ')}`}
                            </span>
                          </div>

                          {/* Quick Preview */}
                          {entry.action === 'edit' && entry.old_value !== entry.new_value && (
                            <div className="small text-muted mb-2 d-flex align-items-center">
                              <span className="text-decoration-line-through text-danger">{formatValue(entry.old_value)}</span>
                              <ArrowRight size={12} className="mx-2" />
                              <span className="text-success">{formatValue(entry.new_value)}</span>
                            </div>
                          )}

                          {/* Notes Preview */}
                          {entry.notes && (
                            <div className="small text-muted fst-italic">
                              "{entry.notes.length > 100 ? entry.notes.substring(0, 100) + '...' : entry.notes}"
                            </div>
                          )}
                        </div>

                        {/* Timestamp and Expand Button */}
                        <div className="d-flex align-items-center text-muted small ms-3">
                          <div className="text-end me-2">
                            <div className="d-flex align-items-center">
                              <Calendar size={12} className="me-1" />
                              {new Date(entry.timestamp).toLocaleDateString()}
                            </div>
                            <div className="d-flex align-items-center mt-1">
                              <Clock size={12} className="me-1" />
                              {new Date(entry.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                          {expandedEntries.has(index) ? (
                            <ChevronUp size={16} />
                          ) : (
                            <ChevronDown size={16} />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedEntries.has(index) && (
                  <div className="border-top bg-light">
                    <div className="p-3">
                      <div className="row g-3">
                        {/* Field Details */}
                        {entry.field && (
                          <div className="col-md-6">
                            <div className="small fw-medium text-muted">Field Changed:</div>
                            <div className="small">{formatFieldName(entry.field)}</div>
                          </div>
                        )}

                        {/* Value Changes */}
                        {entry.action === 'edit' && (entry.old_value || entry.new_value) && (
                          <div className="col-12">
                            <div className="small fw-medium text-muted mb-2">Value Changes:</div>
                            <div className="row g-2">
                              <div className="col-md-6">
                                <div className="small text-muted mb-1">Previous Value:</div>
                                <div className="small p-2 bg-danger bg-opacity-10 border border-danger border-opacity-25 rounded">
                                  {formatValue(entry.old_value)}
                                </div>
                              </div>
                              <div className="col-md-6">
                                <div className="small text-muted mb-1">New Value:</div>
                                <div className="small p-2 bg-success bg-opacity-10 border border-success border-opacity-25 rounded">
                                  {formatValue(entry.new_value)}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Full Notes */}
                        {entry.notes && (
                          <div className="col-12">
                            <div className="small fw-medium text-muted">Notes:</div>
                            <div className="small fst-italic">"{entry.notes}"</div>
                          </div>
                        )}

                        {/* Technical Details */}
                        <div className="col-12 pt-2 border-top">
                          <div className="row g-3 text-muted small">
                            <div className="col-md-4">
                              <span className="fw-medium">Action:</span> {entry.action}
                            </div>
                            <div className="col-md-4">
                              <span className="fw-medium">User:</span> {entry.user}
                            </div>
                            <div className="col-md-4">
                              <span className="fw-medium">Timestamp:</span> 
                              <br />
                              <code className="small">{new Date(entry.timestamp).toISOString()}</code>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditTrail;