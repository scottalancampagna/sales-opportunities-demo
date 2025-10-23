import React, { useState, useRef } from 'react';
import { Upload, Download, AlertCircle, CheckCircle, X, FileText, Trash2, RefreshCw, Database, GitCompare } from 'lucide-react';

const SalesforceImport = ({ onImportComplete, onClose }) => {
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState([]);
  const [reconciliationMode, setReconciliationMode] = useState('update'); // 'update', 'append', 'replace'
  const [showReconciliation, setShowReconciliation] = useState(false);
  const [reconciliationResults, setReconciliationResults] = useState(null);
  const fileInputRef = useRef();

  // Salesforce to App field mappings
  const salesforceFieldMappings = {
    'Primary': 'client',
    'Opportunity Name': 'clientAsk', 
    'Opportunity Id18': 'sfdcId',
    'Deal ID': 'dealId',
    'Specialist': 'specialist',
    'Stage': 'salesforceStage',
    'Intake Status': 'stage', // This maps to our internal stage
    'Type': 'type',
    'SBU': 'sbu',
    'Service TCV (converted)': 'opportunityValue',
    'Close Date': 'expectedCloseDate',
    'Created': 'createdDate',
    'Proposal Due Date': 'proposalDueDate',
    'Solutions PoC': 'solutionPOC',
    'Growth Strategy PoC': 'strategyPOC',
    'Delivery PoC': 'deliveryPOC',
    'Engineering PoC': 'techPOC',
    'Design PoC': 'designPOC',
    'Deal Brief': 'dealBriefUrl',
    'Opportunity Owner': 'opportunityOwner',
    'Client Partner': 'clientPartner',
    'Deal Intake Comments': 'comments',
    'Date Update - Intake Completed': 'intakeCompletedDate',
    'GTM Non-Compliance': 'gtmNonCompliance',
    'Practice Non-Compliance': 'practiceNonCompliance'
  };

  // Map Salesforce stages to our internal stages
  const stageMapping = {
    'Needs More Info': 'Needs More Info',
    'In Shaping': 'Shaping', 
    'In Research': 'In Research',
    'In Proposal': 'Proposal',
    '': 'New' // Default for empty intake status
  };

  const parseCSVLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim().replace(/"/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim().replace(/"/g, ''));
    return result;
  };

  const handleFileSelect = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setResults(null);
      previewCSV(selectedFile);
    } else {
      alert('Please select a valid CSV file');
    }
  };

  const previewCSV = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split('\n').filter(line => line.trim());
      const headers = parseCSVLine(lines[0]);
      
      // Show first 5 rows for preview
      const preview = lines.slice(1, 6).map(line => {
        const values = parseCSVLine(line);
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        return row;
      });

      setPreviewData({ headers, rows: preview, totalRows: lines.length - 1 });
      setShowPreview(true);
    };
    reader.readAsText(file);
  };

  const parseDate = (dateString) => {
    if (!dateString) return null;
    
    // Handle various date formats from Salesforce
    const cleanDate = dateString.replace(/\r$/, '').trim();
    if (!cleanDate) return null;
    
    // Try parsing the date
    const parsed = new Date(cleanDate);
    return isNaN(parsed.getTime()) ? null : parsed.toISOString();
  };

  const transformSalesforceRecord = (sfRecord) => {
    const transformed = {
      id: sfRecord['Opportunity Id18'] || `temp-${Date.now()}-${Math.random()}`,
      sfdcId: sfRecord['Opportunity Id18'] || '',
      dealId: sfRecord['Deal ID'] || '',
      client: sfRecord['Primary'] || 'Unknown Client',
      clientAsk: sfRecord['Opportunity Name'] || '',
      specialist: sfRecord['Specialist'] || '',
      opportunityOwner: sfRecord['Opportunity Owner'] || '',
      clientPartner: sfRecord['Client Partner'] || '',
      
      // Map Salesforce intake status to our internal stage
      stage: stageMapping[sfRecord['Intake Status']] || 'New',
      salesforceStage: sfRecord['Stage'] || '',
      intakeStatus: sfRecord['Intake Status'] || '',
      
      // Business fields
      type: sfRecord['Type'] || '',
      sbu: sfRecord['SBU'] || '',
      opportunityValue: sfRecord['Service TCV (converted)'] || '',
      
      // POC assignments
      solutionPOC: sfRecord['Solutions PoC'] || '',
      strategyPOC: sfRecord['Growth Strategy PoC'] || '',
      deliveryPOC: sfRecord['Delivery PoC'] || '',
      techPOC: sfRecord['Engineering PoC'] || '',
      designPOC: sfRecord['Design PoC'] || '',
      
      // Dates
      createdDate: parseDate(sfRecord['Created']) || new Date().toISOString(),
      expectedCloseDate: parseDate(sfRecord['Close Date']),
      proposalDueDate: parseDate(sfRecord['Proposal Due Date']),
      intakeCompletedDate: parseDate(sfRecord['Date Update - Intake Completed']),
      lastModified: new Date().toISOString(),
      lastSyncDate: new Date().toISOString(),
      
      // Additional fields
      dealBriefUrl: sfRecord['Deal Brief'] || '',
      comments: sfRecord['Deal Intake Comments'] || '',
      gtmNonCompliance: sfRecord['GTM Non-Compliance'] || '',
      practiceNonCompliance: sfRecord['Practice Non-Compliance'] || '',
      
      // Default values for app-specific fields
      needs: '',
      whyLaunch: '',
      
      // Metadata
      source: 'salesforce',
      importedAt: new Date().toISOString()
    };

    return transformed;
  };

  const performReconciliation = (salesforceData, existingData) => {
    const reconciliation = {
      newRecords: [],
      updatedRecords: [],
      unchangedRecords: [],
      conflicts: [],
      orphanedRecords: [] // Records in app but not in Salesforce
    };

    const existingBySfdcId = new Map();
    const existingByDealId = new Map();
    
    existingData.forEach(record => {
      if (record.sfdcId) existingBySfdcId.set(record.sfdcId, record);
      if (record.dealId) existingByDealId.set(record.dealId, record);
    });

    const processedIds = new Set();

    salesforceData.forEach(sfRecord => {
      const transformed = transformSalesforceRecord(sfRecord);
      let existing = null;
      
      // Try to find existing record by SFDC ID first, then by Deal ID
      if (transformed.sfdcId) {
        existing = existingBySfdcId.get(transformed.sfdcId);
        processedIds.add(transformed.sfdcId);
      } else if (transformed.dealId) {
        existing = existingByDealId.get(transformed.dealId);
        processedIds.add(transformed.dealId);
      }

      if (!existing) {
        reconciliation.newRecords.push(transformed);
      } else {
        // Check for conflicts (user modified data vs Salesforce updates)
        const hasConflicts = checkForConflicts(existing, transformed);
        
        if (hasConflicts.length > 0) {
          reconciliation.conflicts.push({
            existing,
            incoming: transformed,
            conflicts: hasConflicts
          });
        } else if (hasSignificantChanges(existing, transformed)) {
          // Preserve user-modified fields
          const merged = mergeRecords(existing, transformed);
          reconciliation.updatedRecords.push(merged);
        } else {
          reconciliation.unchangedRecords.push(existing);
        }
      }
    });

    // Find orphaned records (in app but not in Salesforce)
    existingData.forEach(record => {
      if (record.source === 'salesforce' && 
          !processedIds.has(record.sfdcId) && 
          !processedIds.has(record.dealId)) {
        reconciliation.orphanedRecords.push(record);
      }
    });

    return reconciliation;
  };

  const checkForConflicts = (existing, incoming) => {
    const conflicts = [];
    const conflictFields = ['stage', 'specialist', 'clientAsk', 'opportunityValue'];
    
    conflictFields.forEach(field => {
      const existingValue = existing[field];
      const incomingValue = incoming[field];
      
      // Check if user has modified the field since last sync
      const wasUserModified = existing.lastModified > (existing.lastSyncDate || existing.importedAt);
      
      if (wasUserModified && existingValue !== incomingValue && incomingValue) {
        conflicts.push({
          field,
          existingValue,
          incomingValue,
          userModified: true
        });
      }
    });

    return conflicts;
  };

  const hasSignificantChanges = (existing, incoming) => {
    const keyFields = ['stage', 'specialist', 'opportunityValue', 'expectedCloseDate', 'intakeStatus'];
    
    return keyFields.some(field => {
      const existingVal = existing[field] || '';
      const incomingVal = incoming[field] || '';
      return existingVal !== incomingVal;
    });
  };

  const mergeRecords = (existing, incoming) => {
    return {
      ...existing,
      // Update Salesforce-controlled fields
      salesforceStage: incoming.salesforceStage,
      intakeStatus: incoming.intakeStatus,
      opportunityValue: incoming.opportunityValue,
      expectedCloseDate: incoming.expectedCloseDate,
      proposalDueDate: incoming.proposalDueDate,
      intakeCompletedDate: incoming.intakeCompletedDate,
      solutionPOC: incoming.solutionPOC,
      strategyPOC: incoming.strategyPOC,
      deliveryPOC: incoming.deliveryPOC,
      techPOC: incoming.techPOC,
      designPOC: incoming.designPOC,
      dealBriefUrl: incoming.dealBriefUrl,
      comments: incoming.comments,
      gtmNonCompliance: incoming.gtmNonCompliance,
      practiceNonCompliance: incoming.practiceNonCompliance,
      
      // Update stage only if not manually overridden by user
      stage: existing.lastModified <= (existing.lastSyncDate || existing.importedAt) 
        ? incoming.stage 
        : existing.stage,
      
      // Preserve user-modified fields
      needs: existing.needs,
      whyLaunch: existing.whyLaunch,
      
      // Update metadata
      lastSyncDate: new Date().toISOString()
    };
  };

  const processImport = () => {
    if (!file) return;

    setImporting(true);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split('\n').filter(line => line.trim());
      const headers = parseCSVLine(lines[0]);
      
      const salesforceData = [];

      // Parse all CSV data
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;

        const values = parseCSVLine(line);
        const rowData = {};
        
        headers.forEach((header, index) => {
          rowData[header] = values[index] ? values[index].trim() : '';
        });

        salesforceData.push(rowData);
      }

      // Get existing opportunities
      const existingOpportunities = JSON.parse(localStorage.getItem('opportunities') || '[]');
      
      // Perform reconciliation
      const reconciliation = performReconciliation(salesforceData, existingOpportunities);
      
      setReconciliationResults(reconciliation);
      setShowReconciliation(true);
      setImporting(false);
    };

    reader.readAsText(file);
  };

  const applyReconciliation = () => {
    if (!reconciliationResults) return;

    const { newRecords, updatedRecords, unchangedRecords } = reconciliationResults;
    const existingOpportunities = JSON.parse(localStorage.getItem('opportunities') || '[]');
    
    // Create final dataset based on reconciliation mode
    let finalOpportunities = [];
    
    if (reconciliationMode === 'replace') {
      finalOpportunities = [...newRecords, ...updatedRecords];
    } else {
      // Keep non-Salesforce records
      const nonSalesforceRecords = existingOpportunities.filter(opp => opp.source !== 'salesforce');
      finalOpportunities = [...nonSalesforceRecords, ...newRecords, ...updatedRecords, ...unchangedRecords];
    }

    // Save to localStorage
    localStorage.setItem('opportunities', JSON.stringify(finalOpportunities));

    // Create audit log entries
    const auditLogs = JSON.parse(localStorage.getItem('auditLogs') || '[]');
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    
    [...newRecords, ...updatedRecords].forEach(opp => {
      auditLogs.push({
        id: Date.now() + Math.random(),
        opportunityId: opp.id,
        timestamp: new Date().toISOString(),
        user: currentUser.name || 'System',
        action: newRecords.includes(opp) ? 'create' : 'update',
        details: `Salesforce sync - ${reconciliationMode} mode`,
        oldValue: null,
        newValue: opp.stage
      });
    });
    
    localStorage.setItem('auditLogs', JSON.stringify(auditLogs));

    setResults({
      mode: reconciliationMode,
      imported: newRecords.length,
      updated: updatedRecords.length,
      unchanged: unchangedRecords.length,
      conflicts: reconciliationResults.conflicts.length,
      orphaned: reconciliationResults.orphanedRecords.length
    });

    onImportComplete();
  };

  return (
    <div className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center p-4" style={{zIndex:1050}}>
      <div className="bg-white rounded-3 w-100 h-100 overflow-auto" style={{maxWidth:'80rem'}}>
        <div className="p-4 border-bottom">
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-2">
              <Database size={20} className="text-primary" />
              <h2 className="h4 mb-0 fw-semibold">Salesforce Import & Reconciliation</h2>
            </div>
            <button onClick={onClose} className="btn btn-link text-secondary p-0">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-4">
          {!showReconciliation ? (
            <div className="row g-4">
              {/* File Upload Section */}
              <div className="col-12">
                <div className="card bg-light border-0">
                  <div className="card-body">
                    <h5 className="card-title text-primary mb-2">Salesforce CSV Import</h5>
                    <p className="card-text text-muted">Upload your Salesforce export CSV to sync deal data with the app. The system will automatically map Salesforce fields and handle data reconciliation.</p>
                  </div>
                </div>
              </div>

              <div className="col-12">
                <div className="card border-2 border-dashed border-secondary">
                  <div className="card-body text-center py-5">
                    <FileText size={48} className="text-muted mb-3" />
                    <div className="mb-3">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="btn btn-primary btn-lg"
                      >
                        Select Salesforce CSV
                      </button>
                      <p className="text-muted mt-2 mb-0">Standard Salesforce opportunity export format</p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleFileSelect}
                      className="d-none"
                    />
                  </div>
                </div>
              </div>

              {file && (
                <div className="col-12">
                  <div className="card bg-light border-0">
                    <div className="card-body">
                      <p className="mb-1"><strong>Selected file:</strong> {file.name}</p>
                      <p className="text-muted mb-0">Size: {(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Preview */}
              {showPreview && previewData && (
                <div className="col-12">
                  <div className="card">
                    <div className="card-header bg-light">
                      <h6 className="mb-0">Data Preview ({previewData.totalRows} records)</h6>
                    </div>
                    <div className="card-body p-0">
                      <div className="table-responsive" style={{maxHeight:'16rem'}}>
                        <table className="table table-sm mb-0">
                          <thead className="table-light">
                            <tr>
                              {previewData.headers.slice(0, 8).map((header, index) => (
                                <th key={index} className="border-end small">
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {previewData.rows.map((row, index) => (
                              <tr key={index}>
                                {previewData.headers.slice(0, 8).map((header, colIndex) => (
                                  <td key={colIndex} className="border-end text-muted small">
                                    {String(row[header] || '').substring(0, 50)}
                                    {String(row[header] || '').length > 50 ? '...' : ''}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {file && (
                <div className="col-12 text-center">
                  <button
                    onClick={processImport}
                    disabled={importing}
                    className="btn btn-primary btn-lg d-inline-flex align-items-center gap-2"
                  >
                    {importing ? (
                      <>
                        <div className="spinner-border spinner-border-sm" role="status"></div>
                        <span>Analyzing Data...</span>
                      </>
                    ) : (
                      <>
                        <GitCompare size={20} />
                        <span>Analyze & Reconcile</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="row g-4">
              {/* Reconciliation Results */}
              <div className="col-12">
                <div className="d-flex align-items-center gap-2 mb-3">
                  <GitCompare size={20} className="text-primary" />
                  <h3 className="h5 mb-0 fw-semibold">Reconciliation Analysis</h3>
                </div>

                {/* Summary Cards */}
                <div className="row g-3 mb-4">
                  <div className="col-md-3">
                    <div className="card bg-success bg-opacity-10 border-success">
                      <div className="card-body text-center">
                        <div className="h2 text-success fw-bold mb-1">{reconciliationResults.newRecords.length}</div>
                        <div className="text-success small">New Records</div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="card bg-primary bg-opacity-10 border-primary">
                      <div className="card-body text-center">
                        <div className="h2 text-primary fw-bold mb-1">{reconciliationResults.updatedRecords.length}</div>
                        <div className="text-primary small">Updates</div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="card bg-warning bg-opacity-10 border-warning">
                      <div className="card-body text-center">
                        <div className="h2 text-warning fw-bold mb-1">{reconciliationResults.conflicts.length}</div>
                        <div className="text-warning small">Conflicts</div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="card bg-secondary bg-opacity-10 border-secondary">
                      <div className="card-body text-center">
                        <div className="h2 text-secondary fw-bold mb-1">{reconciliationResults.unchangedRecords.length}</div>
                        <div className="text-secondary small">Unchanged</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Import Mode Selection */}
                <div className="card bg-light border-0 mb-4">
                  <div className="card-body">
                    <h6 className="card-title">Import Mode</h6>
                    <div className="form-check mb-2">
                      <input
                        className="form-check-input"
                        type="radio"
                        value="update"
                        checked={reconciliationMode === 'update'}
                        onChange={(e) => setReconciliationMode(e.target.value)}
                        id="mode-update"
                      />
                      <label className="form-check-label" htmlFor="mode-update">
                        <strong>Update & Merge</strong> - Add new records, update existing ones, preserve user changes
                      </label>
                    </div>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        value="replace"
                        checked={reconciliationMode === 'replace'}
                        onChange={(e) => setReconciliationMode(e.target.value)}
                        id="mode-replace"
                      />
                      <label className="form-check-label" htmlFor="mode-replace">
                        <strong>Replace Salesforce Data</strong> - Replace all Salesforce records with import data
                      </label>
                    </div>
                  </div>
                </div>

                {/* Conflicts (if any) */}
                {reconciliationResults.conflicts.length > 0 && (
                  <div className="card bg-warning bg-opacity-10 border-warning mb-4">
                    <div className="card-body">
                      <h6 className="card-title text-warning-emphasis">Data Conflicts Detected</h6>
                      <p className="card-text text-warning-emphasis mb-3">
                        These records have conflicts between your local changes and Salesforce updates. 
                        Local changes will be preserved.
                      </p>
                      <div style={{maxHeight:'8rem'}} className="overflow-auto">
                        {reconciliationResults.conflicts.slice(0, 5).map((conflict, index) => (
                          <div key={index} className="small text-warning-emphasis mb-1">
                            <strong>{conflict.existing.clientAsk}</strong> - 
                            {conflict.conflicts.map(c => ` ${c.field}: "${c.existingValue}" vs "${c.incomingValue}"`)}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="d-flex justify-content-between">
                  <button
                    onClick={() => setShowReconciliation(false)}
                    className="btn btn-outline-secondary"
                  >
                    Back to Import
                  </button>
                  <button
                    onClick={applyReconciliation}
                    className="btn btn-success d-inline-flex align-items-center gap-2"
                  >
                    <RefreshCw size={16} />
                    <span>Apply Changes</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Final Results */}
          {results && (
            <div className="row g-4 mt-4">
              <div className="col-12">
                <div className="card bg-success bg-opacity-10 border-success">
                  <div className="card-body">
                    <div className="d-flex align-items-center gap-2 mb-3">
                      <CheckCircle size={20} className="text-success" />
                      <h6 className="mb-0 text-success-emphasis fw-semibold">Import Complete</h6>
                    </div>
                    <div className="row g-3 text-center">
                      <div className="col">
                        <div className="text-success-emphasis"><strong>Mode:</strong> {results.mode}</div>
                      </div>
                      <div className="col">
                        <div className="text-success-emphasis"><strong>Imported:</strong> {results.imported}</div>
                      </div>
                      <div className="col">
                        <div className="text-success-emphasis"><strong>Updated:</strong> {results.updated}</div>
                      </div>
                      <div className="col">
                        <div className="text-success-emphasis"><strong>Unchanged:</strong> {results.unchanged}</div>
                      </div>
                      <div className="col">
                        <div className="text-success-emphasis"><strong>Conflicts:</strong> {results.conflicts}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-top bg-light">
          <div className="d-flex justify-content-end gap-3">
            <button
              onClick={onClose}
              className="btn btn-outline-secondary"
            >
              Close
            </button>
            {results && (
              <button
                onClick={() => {
                  onImportComplete();
                  onClose();
                }}
                className="btn btn-primary"
              >
                View Updated Data
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesforceImport;