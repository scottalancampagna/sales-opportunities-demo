import React from 'react';
import { ScoreBadge, ScoreOpportunityButton, ScoreBreakdown } from '../Scoring/ScoreComponents';

// Simple test component to verify our new scoring components work
const ScoringTest = ({ opportunity }) => {
  return (
    <div className="card">
      <div className="card-header">
        <h5>AI Scoring Test</h5>
      </div>
      <div className="card-body">
        <div className="row">
          <div className="col-md-6">
            <h6>Score Badge Test:</h6>
            <ScoreBadge score={85} priority="A" />
            
            <h6 className="mt-3">Score Button Test:</h6>
            <ScoreOpportunityButton 
              opportunityId={opportunity?.id || 'test-id'} 
              onScoreUpdate={(data) => console.log('Score updated:', data)}
            />
          </div>
          <div className="col-md-6">
            <h6>Score Breakdown Test:</h6>
            <ScoreBreakdown 
              scoreData={{
                totalScore: 85,
                priority: 'A',
                categoryBreakdown: {
                  strategicFit: 25,
                  serviceAlignment: 20,
                  problemSolutionFit: 18,
                  engagementIndicators: 12,
                  competitiveAdvantage: 10
                },
                keyStrengths: ['Strong strategic alignment', 'Clear problem definition'],
                concerns: ['Resource availability needs confirmation'],
                recommendations: ['Prioritize for immediate action'],
                reasoning: 'This is a test scoring result to verify the component works correctly.'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScoringTest;