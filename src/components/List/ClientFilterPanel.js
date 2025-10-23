import React, { useState, useEffect } from 'react';
import { Building, TrendingUp, DollarSign, Target, Users, X, ChevronDown } from 'lucide-react';
import { useData } from '../../contexts/DataContext';

const ClientFilterPanel = ({ 
  selectedClient, 
  onClientSelect, 
  onClose,
  showStats = true 
}) => {
  const { getClientAnalytics, getClientSuggestions } = useData();
  const [clientAnalytics, setClientAnalytics] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('totalValue'); // totalValue, totalOpportunities, winRate, name
  const [sortDirection, setSortDirection] = useState('desc');

  useEffect(() => {
    const analytics = getClientAnalytics();
    setClientAnalytics(analytics);
  }, [getClientAnalytics]);

  const filteredAndSortedClients = Object.values(clientAnalytics)
    .filter(client => {
      if (!searchQuery) return true;
      return client.name.toLowerCase().includes(searchQuery.toLowerCase());
    })
    .sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];
      
      if (sortBy === 'name') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }
      
      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortDirection === 'asc' ? comparison : -comparison;
    });

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('desc');
    }
  };

  const formatCurrency = (value) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toLocaleString()}`;
  };

  return (
    <div className="client-filter-panel bg-white border rounded p-4">
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div className="d-flex align-items-center">
          <Building size={20} className="text-primary me-2" />
          <h6 className="mb-0 fw-semibold">Client Filter & Analytics</h6>
        </div>
        <button onClick={onClose} className="btn btn-sm btn-outline-secondary">
          <X size={16} />
        </button>
      </div>

      {/* Search and Sort Controls */}
      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <input
            type="text"
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-control form-control-sm"
          />
        </div>
        <div className="col-md-6">
          <select
            value={`${sortBy}-${sortDirection}`}
            onChange={(e) => {
              const [field, direction] = e.target.value.split('-');
              setSortBy(field);
              setSortDirection(direction);
            }}
            className="form-select form-select-sm"
          >
            <option value="totalValue-desc">Total Value (High to Low)</option>
            <option value="totalValue-asc">Total Value (Low to High)</option>
            <option value="totalOpportunities-desc">Most Opportunities</option>
            <option value="totalOpportunities-asc">Fewest Opportunities</option>
            <option value="winRate-desc">Highest Win Rate</option>
            <option value="winRate-asc">Lowest Win Rate</option>
            <option value="name-asc">Name (A to Z)</option>
            <option value="name-desc">Name (Z to A)</option>
          </select>
        </div>
      </div>

      {/* "All Clients" Option */}
      <div 
        className={`client-item p-3 rounded mb-3 cursor-pointer border ${
          selectedClient === null ? 'border-primary bg-primary bg-opacity-10' : 'border-light'
        }`}
        onClick={() => onClientSelect(null)}
        style={{ cursor: 'pointer' }}
      >
        <div className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center">
            <Users size={16} className="text-muted me-3" />
            <div>
              <div className="fw-medium">All Clients</div>
              <small className="text-muted">Show opportunities from all clients</small>
            </div>
          </div>
          <div className="text-end">
            <div className="small text-muted">
              {Object.values(clientAnalytics).reduce((sum, client) => sum + client.totalOpportunities, 0)} opportunities
            </div>
          </div>
        </div>
      </div>

      {/* Client List */}
      <div className="client-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {filteredAndSortedClients.map((client) => (
          <div
            key={client.name}
            className={`client-item p-3 rounded mb-3 cursor-pointer border ${
              selectedClient === client.name ? 'border-primary bg-primary bg-opacity-10' : 'border-light'
            }`}
            onClick={() => onClientSelect(client.name)}
            style={{ cursor: 'pointer' }}
          >
            <div className="d-flex align-items-center justify-content-between mb-2">
              <div className="d-flex align-items-center">
                <Building size={16} className="text-primary me-3" />
                <div>
                  <div className="fw-medium">{client.name}</div>
                  <small className="text-muted">
                    {client.activeOpportunities} active • {client.totalOpportunities} total
                  </small>
                </div>
              </div>
              <ChevronDown size={16} className="text-muted" />
            </div>

            {showStats && (
              <div className="row g-2 small">
                <div className="col-6">
                  <div className="d-flex align-items-center text-muted">
                    <DollarSign size={12} className="me-1" />
                    <span>Value: {formatCurrency(client.totalValue)}</span>
                  </div>
                </div>
                <div className="col-6">
                  <div className="d-flex align-items-center text-muted">
                    <Target size={12} className="me-1" />
                    <span>Win Rate: {client.winRate}%</span>
                  </div>
                </div>
                <div className="col-6">
                  <div className="d-flex align-items-center text-muted">
                    <TrendingUp size={12} className="me-1" />
                    <span>Won: {client.wonOpportunities}</span>
                  </div>
                </div>
                <div className="col-6">
                  <div className="d-flex align-items-center text-muted">
                    <Users size={12} className="me-1" />
                    <span>Pipeline: {client.avgDaysInPipeline}d avg</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredAndSortedClients.length === 0 && (
        <div className="text-center py-4 text-muted">
          <Building size={48} className="mb-3 opacity-50" />
          <p>No clients found matching "{searchQuery}"</p>
        </div>
      )}
    </div>
  );
};

export default ClientFilterPanel;