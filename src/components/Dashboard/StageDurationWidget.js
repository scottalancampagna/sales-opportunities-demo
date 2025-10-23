import React, { useMemo } from 'react';
import { Clock, AlertTriangle, TrendingUp, Settings } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';

const StageDurationWidget = ({ onSettingsClick }) => {
  const { getStageAnalytics, getOverdueOpportunities, expectedDurations } = useData();
  const { user } = useAuth();
  
  const analytics = useMemo(() => getStageAnalytics(), [getStageAnalytics]);
  const overdueOpps = useMemo(() => getOverdueOpportunities(), [getOverdueOpportunities]);
  
  // Get most problematic stages (highest overdue percentage)
  const problematicStages = useMemo(() => {
    return Object.entries(analytics)
      .filter(([stage, data]) => data.count > 0 && stage !== 'Complete')
      .map(([stage, data]) => ({
        stage,
        ...data,
        overduePercentage: data.count > 0 ? Math.round((data.overdueCount / data.count) * 100) : 0
      }))
      .sort((a, b) => b.overduePercentage - a.overduePercentage)
      .slice(0, 3);
  }, [analytics]);

  const totalOverdue = overdueOpps.length;
  const totalActive = Object.values(analytics)
    .filter((_, index) => Object.keys(analytics)[index] !== 'Complete')
    .reduce((sum, stage) => sum + stage.count, 0);

  return (
    <div className="bg-white rounded border p-4">
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div className="d-flex align-items-center">
          <Clock size={20} className="text-primary me-2" />
          <h6 className="mb-0 fw-semibold">Stage Duration Insights</h6>
        </div>
        
        {user?.role === 'Admin' && (
          <button
            onClick={onSettingsClick}
            className="btn btn-sm btn-outline-secondary"
            title="Configure expected durations"
          >
            <Settings size={14} />
          </button>
        )}
      </div>

      {/* Overview Stats */}
      <div className="row g-3 mb-4">
        <div className="col-6">
          <div className="text-center p-3 bg-light rounded">
            <div className="h4 mb-1 text-danger fw-bold">{totalOverdue}</div>
            <div className="small text-muted">Overdue Opportunities</div>
          </div>
        </div>
        <div className="col-6">
          <div className="text-center p-3 bg-light rounded">
            <div className="h4 mb-1 text-primary fw-bold">
              {totalActive > 0 ? Math.round((totalOverdue / totalActive) * 100) : 0}%
            </div>
            <div className="small text-muted">Overdue Rate</div>
          </div>
        </div>
      </div>

      {/* Problematic Stages */}
      <div className="mb-4">
        <h6 className="small fw-medium text-muted mb-3">STAGES NEEDING ATTENTION</h6>
        <div className="d-flex flex-column gap-2">
          {problematicStages.length > 0 ? (
            problematicStages.map(({ stage, count, overdueCount, overduePercentage, avgDays, expectedDays }) => (
              <div key={stage} className="d-flex align-items-center justify-content-between p-2 bg-light rounded">
                <div className="d-flex align-items-center">
                  <AlertTriangle 
                    size={16} 
                    className={`me-2 ${
                      overduePercentage > 50 ? 'text-danger' :
                      overduePercentage > 25 ? 'text-warning' : 'text-success'
                    }`} 
                  />
                  <div>
                    <div className="small fw-medium">{stage}</div>
                    <div className="small text-muted">
                      {overdueCount}/{count} overdue • Avg: {avgDays}d (Expected: {expectedDays}d)
                    </div>
                  </div>
                </div>
                <span className={`badge ${
                  overduePercentage > 50 ? 'bg-danger' :
                  overduePercentage > 25 ? 'bg-warning' : 'bg-success'
                }`}>
                  {overduePercentage}%
                </span>
              </div>
            ))
          ) : (
            <div className="text-center text-muted small py-2">
              All stages are performing well! 🎉
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="border-top pt-3">
        <div className="d-flex gap-2">
          <button
            onClick={() => window.location.hash = '#/dashboard?filter=overdue'}
            className="btn btn-sm btn-outline-danger flex-fill"
          >
            View Overdue ({totalOverdue})
          </button>
          <button
            onClick={() => window.location.hash = '#/analytics/stages'}
            className="btn btn-sm btn-outline-primary flex-fill"
          >
            <TrendingUp size={14} className="me-1" />
            Full Analytics
          </button>
        </div>
      </div>
    </div>
  );
};

export default StageDurationWidget;