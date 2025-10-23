import React, { useState } from 'react';
import { ScoreBadge, ScoreOpportunityButton } from '../Scoring/ScoreComponents';

// Simple component to test scoring without breaking existing functionality
const ScoringQuickTest = () => {
  const [testResults, setTestResults] = useState([]);

  const addTestResult = (message) => {
    setTestResults(prev => [...prev, { 
      message, 
      timestamp: new Date().toLocaleTimeString() 
    }]);
  };

  return (
    <div className="card mt-4">
      <div className="card-header">
        <h5 className="mb-0">
          <i className="bi bi-robot me-2"></i>
          AI Scoring Quick Test
        </h5>
      </div>
      <div className="card-body">
        <div className="row">
          <div className="col-md-6">
            <h6>Score Badge Examples:</h6>
            <div className="d-flex gap-2 mb-3">
              <ScoreBadge score={85} priority="A" size="small" />
              <ScoreBadge score={72} priority="B" size="medium" />
              <ScoreBadge score={45} priority="C" size="large" />
              <ScoreBadge priority="Nurture" size="medium" />
              <ScoreBadge loading={true} size="medium" />
            </div>

            <h6>Scoring Button Test:</h6>
            <ScoreOpportunityButton 
              opportunityId="test-opportunity-123" 
              onScoreUpdate={(data) => {
                addTestResult(`✅ Scoring completed: ${data.totalScore}/100 (${data.priority})`);
              }}
            />

            <div className="mt-3">
              <small className="text-muted">
                <i className="bi bi-info-circle me-1"></i>
                This will test the connection to your Azure Functions API
              </small>
            </div>
          </div>
          
          <div className="col-md-6">
            <h6>Test Results:</h6>
            <div className="border rounded p-2" style={{ minHeight: '150px', maxHeight: '200px', overflowY: 'auto' }}>
              {testResults.length === 0 ? (
                <small className="text-muted">No test results yet. Try clicking the Score button!</small>
              ) : (
                testResults.map((result, index) => (
                  <div key={index} className="small mb-1">
                    <span className="text-muted">[{result.timestamp}]</span> {result.message}
                  </div>
                ))
              )}
            </div>
            
            <button 
              className="btn btn-outline-secondary btn-sm mt-2"
              onClick={() => setTestResults([])}
            >
              Clear Results
            </button>
          </div>
        </div>

        <hr />
        
        <div className="alert alert-info small">
          <strong>Test Instructions:</strong>
          <ol className="mb-0 mt-1">
            <li>Score badges above should display correctly with different colors</li>
            <li>Click "Score Opportunity" to test API connection</li>
            <li>Check test results for success/error messages</li>
            <li>If successful, the full system is ready!</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default ScoringQuickTest;