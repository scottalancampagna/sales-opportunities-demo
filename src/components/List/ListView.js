import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, ChevronDown, ChevronUp, Check, X, Settings, Clock, Building, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { canChangeStage } from '../../utils/permissions';
import { STAGES, STAGE_TRANSITIONS } from '../../utils/constants';
import dataService from '../../services/DataService';
import FilterBuilder from './FilterBuilder';
import BulkActionsPanel from './BulkActionsPanel';
import ClientFilterPanel from './ClientFilterPanel';

const ListView = ({ stage = 'all' }) => {
  const { user } = useAuth();
  const { getDaysInStage, expectedDurations } = useData();
  const [opportunities, setOpportunities] = useState([]);
  const [filteredOpportunities, setFilteredOpportunities] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'created_date', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [showFilters, setShowFilters] = useState(false);
  const [showColumnToggle, setShowColumnToggle] = useState(false);
  const [showClientFilter, setShowClientFilter] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [groupByClient, setGroupByClient] = useState(false);
  const [filters, setFilters] = useState([]);
  const [savedFilters, setSavedFilters] = useState([]);
  const [visibleColumns, setVisibleColumns] = useState({
    specialist: true,
    sfdc_id: true,
    client_ask: true,
    stage: true,
    client: true,
    created_date: true,
    updated_date: false,
    days_in_stage: true,
    aop_value: false,
    eenu_value: false,
    industry: false
  });

  // Load data on mount
  useEffect(() => {
    loadOpportunities();
    loadSavedFilters();
  }, []);

  // Filter and search opportunities
  useEffect(() => {
    let filtered = [...opportunities];

    // Filter by stage if not 'all'
    if (stage !== 'all') {
      filtered = filtered.filter(opp => opp.stage === stage);
    }

    // Filter by client if selected
    if (selectedClient) {
      filtered = filtered.filter(opp => opp.client === selectedClient);
    }

    // Apply search
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(opp =>
        opp.specialist?.toLowerCase().includes(search) ||
        opp.sfdc_id?.toLowerCase().includes(search) ||
        opp.client_ask?.toLowerCase().includes(search) ||
        opp.client?.toLowerCase().includes(search) ||
        opp.stage?.toLowerCase().includes(search)
      );
    }

    // Apply advanced filters
    filtered = applyAdvancedFilters(filtered, filters);

    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        // Handle dates
        if (sortConfig.key.includes('date')) {
          aVal = new Date(aVal);
          bVal = new Date(bVal);
        }

        // Handle strings
        if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase();
          bVal = bVal.toLowerCase();
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    setFilteredOpportunities(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [opportunities, stage, selectedClient, searchTerm, filters, sortConfig]);

  const loadOpportunities = async () => {
    try {
      console.log('ListView: Loading opportunities via DataService...');
      const opps = await dataService.getOpportunities();
      console.log('ListView: Loaded opportunities:', opps.length);
      setOpportunities(opps);
    } catch (error) {
      console.error('Error loading opportunities via DataService:', error);
    }
  };

  const loadSavedFilters = () => {
    const stored = localStorage.getItem('savedFilters');
    if (stored) {
      setSavedFilters(JSON.parse(stored));
    }
  };

  const applyAdvancedFilters = (data, filterList) => {
    if (!filterList.length) return data;

    return data.filter(item => {
      return filterList.every(filter => {
        const { field, operator, value } = filter;
        const itemValue = item[field];

        switch (operator) {
          case 'equals':
            return itemValue === value;
          case 'contains':
            return itemValue?.toLowerCase().includes(value.toLowerCase());
          case 'starts_with':
            return itemValue?.toLowerCase().startsWith(value.toLowerCase());
          case 'ends_with':
            return itemValue?.toLowerCase().endsWith(value.toLowerCase());
          case 'greater_than':
            return parseFloat(itemValue) > parseFloat(value);
          case 'less_than':
            return parseFloat(itemValue) < parseFloat(value);
          case 'not_empty':
            return itemValue && itemValue.toString().trim() !== '';
          case 'is_empty':
            return !itemValue || itemValue.toString().trim() === '';
          default:
            return true;
        }
      });
    });
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleSelectAll = () => {
    const currentPageIds = getCurrentPageData().map(opp => opp.id);
    
    if (currentPageIds.every(id => selectedIds.has(id))) {
      // Deselect all on current page
      setSelectedIds(prev => {
        const newSelected = new Set(prev);
        currentPageIds.forEach(id => newSelected.delete(id));
        return newSelected;
      });
    } else {
      // Select all on current page
      setSelectedIds(prev => {
        const newSelected = new Set(prev);
        currentPageIds.forEach(id => newSelected.add(id));
        return newSelected;
      });
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      return newSelected;
    });
  };

  const getCurrentPageData = () => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredOpportunities.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(filteredOpportunities.length / pageSize);

  const handleExport = (selectedOnly = false) => {
    const dataToExport = selectedOnly 
      ? opportunities.filter(opp => selectedIds.has(opp.id))
      : filteredOpportunities;

    const csv = convertToCSV(dataToExport);
    downloadCSV(csv, selectedOnly ? 'selected_opportunities.csv' : 'opportunities.csv');
  };

  const convertToCSV = (data) => {
    const headers = Object.keys(visibleColumns).filter(col => visibleColumns[col]);
    const csvHeaders = headers.join(',');
    
    const csvRows = data.map(item => {
      return headers.map(header => {
        const value = item[header] || '';
        return `"${value.toString().replace(/"/g, '""')}"`;
      }).join(',');
    });

    return [csvHeaders, ...csvRows].join('\n');
  };

  const downloadCSV = (csv, filename) => {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStageCounts = () => {
    const counts = {};
    STAGES.forEach(stage => {
      counts[stage] = opportunities.filter(opp => opp.stage === stage).length;
    });
    counts.all = opportunities.length;
    return counts;
  };

  const stageCounts = getStageCounts();
  const currentPageData = getCurrentPageData();
  const currentPageIds = currentPageData.map(opp => opp.id);
  const isAllCurrentPageSelected = currentPageIds.length > 0 && currentPageIds.every(id => selectedIds.has(id));
  const isSomeCurrentPageSelected = currentPageIds.some(id => selectedIds.has(id));

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) {
      return <ChevronDown style={{width: '1rem', height: '1rem'}} className="text-muted" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ChevronUp style={{width: '1rem', height: '1rem'}} className="text-primary" />
      : <ChevronDown style={{width: '1rem', height: '1rem'}} className="text-primary" />;
  };

  return (
    <div className="h-100 d-flex flex-column bg-white">
      {/* Header */}
      <div className="border-bottom p-4">
        <div className="d-flex align-items-center justify-content-between mb-4">
          <h2 className="fs-4 fw-semibold mb-0">
            {stage === 'all' ? 'All Opportunities' : `${stage} Stage`}
            {selectedClient && (
              <span className="text-primary ms-2">• {selectedClient}</span>
            )}
            <span className="ms-2 fs-6 fw-normal text-muted">
              ({filteredOpportunities.length} opportunities)
            </span>
          </h2>
          
          <div className="d-flex align-items-center gap-2">
            <button
              onClick={() => setShowClientFilter(!showClientFilter)}
              className={`btn d-flex align-items-center ${
                selectedClient ? 'btn-primary' : 'btn-outline-secondary'
              }`}
            >
              <Building className="me-2" style={{width: '1rem', height: '1rem'}} />
              {selectedClient || 'Client Filter'}
              {selectedClient && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedClient(null);
                  }}
                  className="btn btn-sm btn-link p-0 ms-2 text-white"
                  style={{fontSize: '16px', lineHeight: '1'}}
                >
                  ×
                </button>
              )}
            </button>
            
            <button
              onClick={() => setGroupByClient(!groupByClient)}
              className={`btn ${
                groupByClient ? 'btn-info' : 'btn-outline-secondary'
              } d-flex align-items-center`}
            >
              <Users className="me-2" style={{width: '1rem', height: '1rem'}} />
              Group by Client
            </button>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn btn-outline-secondary d-flex align-items-center"
            >
              <Filter className="me-2" style={{width: '1rem', height: '1rem'}} />
              Advanced Filter
            </button>
            
            <button
              onClick={() => setShowColumnToggle(!showColumnToggle)}
              className="btn btn-outline-secondary d-flex align-items-center"
            >
              <Settings className="me-2" style={{width: '1rem', height: '1rem'}} />
              Columns
            </button>
            
            <button
              onClick={() => handleExport(false)}
              className="btn btn-outline-secondary d-flex align-items-center"
            >
              <Download className="me-2" style={{width: '1rem', height: '1rem'}} />
              Export All
            </button>
          </div>
        </div>

        {/* Stage Tabs */}
        <div className="d-flex gap-1 mb-4">
          {[{ key: 'all', label: 'All' }, ...STAGES.map(s => ({ key: s, label: s }))].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => window.location.hash = `#/list/${key}`}
              className={`px-3 py-2 btn btn-sm ${
                stage === key
                  ? 'btn-primary'
                  : 'btn-outline-secondary'
              }`}
            >
              {label} ({stageCounts[key] || 0})
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="position-relative">
          <Search className="position-absolute top-50 translate-middle-y ms-3 text-muted" style={{width: '1rem', height: '1rem'}} />
          <input
            type="text"
            placeholder="Search opportunities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-control ps-5"
          />
        </div>
      </div>

      {/* Client Filter Panel */}
      {showClientFilter && (
        <div className="border-bottom p-4 bg-light">
          <ClientFilterPanel
            selectedClient={selectedClient}
            onClientSelect={(client) => {
              setSelectedClient(client);
              setShowClientFilter(false);
            }}
            onClose={() => setShowClientFilter(false)}
          />
        </div>
      )}

      {/* Advanced Filters */}
      {showFilters && (
        <FilterBuilder
          filters={filters}
          setFilters={setFilters}
          savedFilters={savedFilters}
          setSavedFilters={setSavedFilters}
          onClose={() => setShowFilters(false)}
        />
      )}

      {/* Column Toggle */}
      {showColumnToggle && (
        <div className="border-bottom p-4 bg-light">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <h3 className="fs-6 fw-medium mb-0">Show/Hide Columns</h3>
            <button
              onClick={() => setShowColumnToggle(false)}
              className="btn btn-sm btn-outline-secondary"
            >
              <X style={{width: '1rem', height: '1rem'}} />
            </button>
          </div>
          <div className="row">
            {Object.entries(visibleColumns).map(([column, isVisible]) => (
              <div key={column} className="col-3 mb-2">
                <div className="form-check">
                  <input
                    type="checkbox"
                    checked={isVisible}
                    onChange={(e) => setVisibleColumns(prev => ({
                      ...prev,
                      [column]: e.target.checked
                    }))}
                    className="form-check-input"
                    id={`column-${column}`}
                  />
                  <label className="form-check-label text-capitalize" htmlFor={`column-${column}`}>
                    {column.replace('_', ' ')}
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <BulkActionsPanel
          selectedIds={selectedIds}
          opportunities={opportunities}
          onUpdate={loadOpportunities}  // This will reload from DataService
          onExport={() => handleExport(true)}
          onClearSelection={() => setSelectedIds(new Set())}
        />
      )}

      {/* Table */}
      <div className="flex-fill overflow-auto">
        <table className="table table-hover mb-0">
          <thead className="table-light sticky-top">
            <tr>
              <th className="ps-3">
                <input
                  type="checkbox"
                  checked={isAllCurrentPageSelected}
                  ref={input => {
                    if (input) input.indeterminate = isSomeCurrentPageSelected && !isAllCurrentPageSelected;
                  }}
                  onChange={handleSelectAll}
                  className="form-check-input"
                />
              </th>
              
              {visibleColumns.specialist && (
                <th 
                  className="user-select-none"
                  style={{cursor: 'pointer'}}
                  onClick={() => handleSort('specialist')}
                >
                  <div className="d-flex align-items-center">
                    Specialist
                    <SortIcon columnKey="specialist" />
                  </div>
                </th>
              )}
              
              {visibleColumns.sfdc_id && (
                <th 
                  className="user-select-none"
                  style={{cursor: 'pointer'}}
                  onClick={() => handleSort('sfdc_id')}
                >
                  <div className="d-flex align-items-center">
                    SFDC ID
                    <SortIcon columnKey="sfdc_id" />
                  </div>
                </th>
              )}
              
              {visibleColumns.client_ask && (
                <th 
                  className="user-select-none"
                  style={{cursor: 'pointer'}}
                  onClick={() => handleSort('client_ask')}
                >
                  <div className="d-flex align-items-center">
                    Client Ask
                    <SortIcon columnKey="client_ask" />
                  </div>
                </th>
              )}
              
              {visibleColumns.stage && (
                <th 
                  className="user-select-none"
                  style={{cursor: 'pointer'}}
                  onClick={() => handleSort('stage')}
                >
                  <div className="d-flex align-items-center">
                    Stage
                    <SortIcon columnKey="stage" />
                  </div>
                </th>
              )}
              
              {visibleColumns.client && (
                <th 
                  className="user-select-none"
                  style={{cursor: 'pointer'}}
                  onClick={() => handleSort('client')}
                >
                  <div className="d-flex align-items-center">
                    Client
                    <SortIcon columnKey="client" />
                  </div>
                </th>
              )}
              
              {visibleColumns.created_date && (
                <th 
                  className="user-select-none"
                  style={{cursor: 'pointer'}}
                  onClick={() => handleSort('created_date')}
                >
                  <div className="d-flex align-items-center">
                    Created
                    <SortIcon columnKey="created_date" />
                  </div>
                </th>
              )}
              
              {visibleColumns.days_in_stage && (
                <th className="text-center">
                  Days in Stage
                </th>
              )}
              
              {visibleColumns.updated_date && (
                <th 
                  className="user-select-none"
                  style={{cursor: 'pointer'}}
                  onClick={() => handleSort('updated_date')}
                >
                  <div className="d-flex align-items-center">
                    Updated
                    <SortIcon columnKey="updated_date" />
                  </div>
                </th>
              )}
              
              {visibleColumns.aop_value && (
                <th 
                  className="user-select-none"
                  style={{cursor: 'pointer'}}
                  onClick={() => handleSort('aop_value')}
                >
                  <div className="d-flex align-items-center">
                    AOP Value
                    <SortIcon columnKey="aop_value" />
                  </div>
                </th>
              )}
              
              {visibleColumns.eenu_value && (
                <th 
                  className="user-select-none"
                  style={{cursor: 'pointer'}}
                  onClick={() => handleSort('eenu_value')}
                >
                  <div className="d-flex align-items-center">
                    EENU Value
                    <SortIcon columnKey="eenu_value" />
                  </div>
                </th>
              )}
              
              {visibleColumns.industry && (
                <th 
                  className="user-select-none"
                  style={{cursor: 'pointer'}}
                  onClick={() => handleSort('industry')}
                >
                  <div className="d-flex align-items-center">
                    Industry
                    <SortIcon columnKey="industry" />
                  </div>
                </th>
              )}
            </tr>
          </thead>
          
          <tbody>
            {currentPageData.map((opportunity) => (
              <tr
                key={opportunity.id}
                className={`${
                  selectedIds.has(opportunity.id) ? 'table-primary' : ''
                }`}
                style={{cursor: 'pointer'}}
                onDoubleClick={() => window.location.hash = `#/detail/${opportunity.id}`}
              >
                <td className="ps-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(opportunity.id)}
                    onChange={() => handleSelectOne(opportunity.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="form-check-input"
                  />
                </td>
                
                {visibleColumns.specialist && (
                  <td className="fw-medium">
                    {opportunity.specialist}
                  </td>
                )}
                
                {visibleColumns.sfdc_id && (
                  <td>
                    {opportunity.sfdc_id}
                  </td>
                )}
                
                {visibleColumns.client_ask && (
                  <td className="text-truncate" style={{maxWidth: '200px'}}>
                    <div>{opportunity.client_ask}</div>
                    {opportunity.comments && opportunity.comments.trim() && (
                      <div className="text-muted small mt-1" style={{ fontStyle: 'italic' }}>
                        💬 {opportunity.comments.length > 50 
                          ? opportunity.comments.substring(0, 50) + '...' 
                          : opportunity.comments}
                      </div>
                    )}
                  </td>
                )}
                
                {visibleColumns.stage && (
                  <td>
                    <span className={`badge ${
                      opportunity.stage === 'Complete' ? 'bg-success' :
                      opportunity.stage === 'Review' ? 'bg-info' :
                      opportunity.stage === 'Proposal' ? 'bg-primary' :
                      opportunity.stage === 'Shaping' ? 'bg-warning' :
                      opportunity.stage === 'In Research' ? 'bg-warning text-dark' :
                      opportunity.stage === 'Intake' ? 'bg-secondary' :
                      'bg-light text-dark'
                    }`}>
                      {opportunity.stage}
                    </span>
                  </td>
                )}
                
                {visibleColumns.client && (
                  <td>
                    {opportunity.client}
                  </td>
                )}
                
                {visibleColumns.created_date && (
                  <td className="text-muted">
                    {new Date(opportunity.created_date).toLocaleDateString()}
                  </td>
                )}
                
                {visibleColumns.days_in_stage && (
                  <td className="text-center">
                    {(() => {
                      const daysInStage = getDaysInStage(opportunity);
                      const expectedDays = expectedDurations[opportunity.stage] || 7;
                      const isOverdue = daysInStage > expectedDays;
                      
                      return (
                        <div className="d-flex align-items-center justify-content-center">
                          <Clock size={12} className={`me-1 ${isOverdue ? 'text-danger' : 'text-muted'}`} />
                          <span className={`small ${isOverdue ? 'text-danger fw-bold' : 'text-muted'}`}>
                            {daysInStage}d
                          </span>
                          {isOverdue && (
                            <span className="badge bg-danger ms-1 small">
                              +{daysInStage - expectedDays}
                            </span>
                          )}
                        </div>
                      );
                    })()} 
                  </td>
                )}
                
                {visibleColumns.updated_date && (
                  <td className="text-muted">
                    {new Date(opportunity.updated_date).toLocaleDateString()}
                  </td>
                )}
                
                {visibleColumns.aop_value && (
                  <td>
                    {opportunity.aop_value ? `$${opportunity.aop_value.toLocaleString()}` : '-'}
                  </td>
                )}
                
                {visibleColumns.eenu_value && (
                  <td>
                    {opportunity.eenu_value ? `$${opportunity.eenu_value.toLocaleString()}` : '-'}
                  </td>
                )}
                
                {visibleColumns.industry && (
                  <td>
                    {opportunity.industry || '-'}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="border-top bg-white p-3 d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center gap-2">
          <span className="text-muted">Show</span>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="form-select form-select-sm" style={{width: 'auto'}}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span className="text-muted">per page</span>
        </div>
        
        <div className="d-flex align-items-center gap-3">
          <span className="text-muted">
            Page {currentPage} of {totalPages} ({filteredOpportunities.length} total)
          </span>
          
          <div className="btn-group">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="btn btn-outline-secondary btn-sm"
            >
              Previous
            </button>
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="btn btn-outline-secondary btn-sm"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListView;