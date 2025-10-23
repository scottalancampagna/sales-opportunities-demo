import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, DollarSign, Clock, Plus, ArrowRight, Bot, Star, BarChart3 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { STAGES } from '../../utils/constants';
import dataService from '../../services/DataService';
import { useOpportunityScoring } from '../Scoring/ScoreComponents';
import { ScoreBadge } from '../Scoring/ScoreComponents';
import { PermissionGuard } from '../RBAC/RBACComponents';
import StageDurationWidget from './StageDurationWidget';
import StageSettingsModal from '../Admin/StageSettingsModal';
import OverdueOpportunitiesModal from './OverdueOpportunitiesModal';

const Dashboard = () => {
  const { user } = useAuth();
  const { scores, batchScore } = useOpportunityScoring();
  const [opportunities, setOpportunities] = useState([]);
  const [stats, setStats] = useState({});
  const [scoreStats, setScoreStats] = useState({});
  const [recentActivity, setRecentActivity] = useState([]);
  const [showStageSettings, setShowStageSettings] = useState(false);
  const [showOverdueModal, setShowOverdueModal] = useState(false);
  const [scoringInProgress, setScoringInProgress] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('Dashboard: Loading data via DataService...');
        const opps = await dataService.getOpportunities();
        console.log('Dashboard: Loaded opportunities:', opps.length);
        setOpportunities(opps);
        
        // Calculate basic stats
        const statistics = {
          totalOpportunities: opps.length,
          totalValue: opps.reduce((sum, opp) => sum + (opp.aop_value || 0), 0),
          stageBreakdown: STAGES.reduce((acc, stage) => {
            acc[stage] = opps.filter(opp => opp.stage === stage).length;
            return acc;
          }, {}),
          myOpportunities: opps.filter(opp => opp.specialist === user?.name).length
        };
        setStats(statistics);

        // Calculate AI scoring stats
        const scoringStatistics = calculateScoringStats(opps);
        setScoreStats(scoringStatistics);

        // Get recent activity from audit service
        const auditLogs = await dataService.getAuditLogs();
        const activity = auditLogs
          .filter(log => log.entityType === 'opportunity')
          .map(log => ({
            ...log,
            opportunity: log.entityId || 'Unknown',
            user: log.user || 'System',
            timestamp: log.timestamp || log.createdAt
          }));
        
        // Also get activity from opportunity audit trails (legacy support)
        opps.forEach(opp => {
          if (opp.audit_trail) {
            opp.audit_trail.forEach(entry => {
              activity.push({
                ...entry,
                opportunity: opp.sfdc_id || opp.client_ask?.substring(0, 50) + '...'
              });
            });
          }
        });
        
        // Sort by timestamp and take recent 10
        const sortedActivity = activity
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .slice(0, 10);
        setRecentActivity(sortedActivity);

      } catch (error) {
        console.error('Error loading dashboard data:', error);
      }
    };
    
    loadData();
  }, [user?.name, scores]);

  const calculateScoringStats = (opportunities) => {
    const scoredOpportunities = opportunities.filter(opp => scores.get(opp.id));
    const priorityDistribution = { A: 0, B: 0, C: 0, Nurture: 0, Deprioritize: 0 };
    let totalScore = 0;
    let highValueScored = 0;

    scoredOpportunities.forEach(opp => {
      const score = scores.get(opp.id);
      if (score) {
        priorityDistribution[score.priority]++;
        totalScore += score.totalScore;
        if (score.priority === 'A' && (opp.aop_value || 0) > 1000000) {
          highValueScored++;
        }
      }
    });

    return {
      totalScored: scoredOpportunities.length,
      unscored: opportunities.length - scoredOpportunities.length,
      averageScore: scoredOpportunities.length > 0 ? Math.round(totalScore / scoredOpportunities.length) : 0,
      priorityDistribution,
      highValueScored
    };
  };

  const handleBatchScore = async () => {
    const unscored = opportunities.filter(opp => !scores.get(opp.id));
    if (unscored.length === 0) {
      alert('All opportunities are already scored!');
      return;
    }

    setScoringInProgress(true);
    try {
      const opportunityIds = unscored.slice(0, 10).map(opp => opp.id); // Score up to 10 at a time
      await batchScore(opportunityIds);
    } catch (error) {
      console.error('Batch scoring failed:', error);
    } finally {
      setScoringInProgress(false);
    }
  };

  // Show loading state
  if (!stats.totalOpportunities && stats.totalOpportunities !== 0) {
    return (
      <div className="h-100 d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  const StatCard = ({ title, value, icon: Icon, color = 'primary', subtitle, onClick, badge }) => (
    <div className="col-lg-3 col-md-6 mb-4">
      <div 
        className={`card h-100 shadow-sm ${onClick ? 'cursor-pointer' : ''}`}
        onClick={onClick}
        style={onClick ? { cursor: 'pointer' } : {}}
      >
        <div className="card-body">
          <div className="d-flex align-items-center justify-content-between">
            <div>
              <p className="text-muted small mb-1 text-uppercase">{title}</p>
              <div className="d-flex align-items-center">
                <h3 className={`fw-bold text-${color} mb-0 me-2`}>{value}</h3>
                {badge && badge}
              </div>
              {subtitle && <p className="text-muted small mt-1 mb-0">{subtitle}</p>}
            </div>
            <div className={`p-3 rounded-circle bg-${color} bg-opacity-10`}>
              <Icon className={`text-${color}`} size={24} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-100 overflow-auto">
      <div className="container-fluid p-4">
        {/* Header */}
        <div className="d-flex align-items-center justify-content-between mb-4">
          <div>
            <h1 className="h2 fw-bold text-dark mb-1">
              Good morning, {user?.name?.split(' ')[0]}!
            </h1>
            <p className="text-muted mb-0">Here's what's happening with your pipeline today.</p>
          </div>
          <div className="d-flex gap-2">
            <PermissionGuard permission="opportunities:create">
              <button
                onClick={() => window.location.hash = '#/add'}
                className="btn btn-primary d-flex align-items-center"
              >
                <Plus size={18} className="me-2" />
                New Opportunity
              </button>
            </PermissionGuard>
          </div>
        </div>

        {/* Stats Grid - Enhanced with AI Scoring */}
        <div className="row">
          <StatCard
            title="Total Opportunities"
            value={stats.totalOpportunities || 0}
            icon={TrendingUp}
            color="primary"
          />
          <StatCard
            title="AI Scored"
            value={scoreStats.totalScored || 0}
            icon={Bot}
            color="success"
            subtitle={`${scoreStats.unscored || 0} remaining`}
            onClick={scoreStats.unscored > 0 ? handleBatchScore : null}
            badge={scoringInProgress ? <div className="spinner-border spinner-border-sm text-success" role="status"></div> : null}
          />
          <StatCard
            title="Average Score"
            value={scoreStats.averageScore ? `${scoreStats.averageScore}/100` : 'N/A'}
            icon={BarChart3}
            color="info"
            subtitle="AI Assessment"
          />
          <StatCard
            title="Priority A Deals"
            value={scoreStats.priorityDistribution?.A || 0}
            icon={Star}
            color="warning"
            subtitle="High Priority"
          />
        </div>

        {/* AI Scoring Overview */}
        {scoreStats.totalScored > 0 && (
          <div className="card mb-4 shadow-sm">
            <div className="card-header bg-white">
              <div className="d-flex justify-content-between align-items-center">
                <h4 className="card-title mb-0">AI Scoring Overview</h4>
                {scoreStats.unscored > 0 && (
                  <button
                    onClick={handleBatchScore}
                    className="btn btn-outline-primary btn-sm"
                    disabled={scoringInProgress}
                  >
                    {scoringInProgress ? (
                      <>
                        <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                        Scoring...
                      </>
                    ) : (
                      <>
                        <Bot size={16} className="me-2" />
                        Score Remaining ({scoreStats.unscored})
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
            <div className="card-body">
              <div className="row g-3">
                {Object.entries(scoreStats.priorityDistribution).map(([priority, count]) => {
                  const getBadgeColor = (priority) => {
                    const colors = { 'A': 'success', 'B': 'primary', 'C': 'warning', 'Nurture': 'secondary', 'Deprioritize': 'danger' };
                    return colors[priority] || 'secondary';
                  };

                  return (
                    <div key={priority} className="col-xl-2 col-lg-3 col-md-4 col-sm-6">
                      <div className="card text-center h-100 border-0 bg-light">
                        <div className="card-body p-3">
                          <ScoreBadge 
                            priority={priority} 
                            score={priority}
                            size="large"
                            showTooltip={false}
                          />
                          <h3 className="h4 fw-bold mt-2 mb-1">{count}</h3>
                          <h6 className="card-title small text-muted mb-0">Priority {priority}</h6>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Stage Breakdown */}
        <div className="card mb-4 shadow-sm">
          <div className="card-header bg-white">
            <h4 className="card-title mb-0">Pipeline by Stage</h4>
          </div>
          <div className="card-body">
            <div className="row g-3">
              {STAGES.map(stage => {
                const count = stats.stageBreakdown?.[stage] || 0;
                const getStageColorClass = (stage) => {
                  const colors = {
                    'New': 'bg-secondary',
                    'Intake': 'bg-primary',
                    'Needs More Info': 'bg-danger',
                    'In Research': 'bg-warning',
                    'Shaping': 'bg-info',
                    'Proposal': 'bg-primary',
                    'Review': 'bg-dark',
                    'Complete': 'bg-success'
                  };
                  return colors[stage] || 'bg-secondary';
                };

                return (
                  <div key={stage} className="col-xl-3 col-lg-4 col-md-6 col-sm-6">
                    <div className="card text-center h-100 border-0 bg-light">
                      <div className="card-body p-3">
                        <div className={`badge ${getStageColorClass(stage)} bg-opacity-10 text-dark mb-2 w-100`}>
                          <h2 className="h4 fw-bold mb-0">{count}</h2>
                        </div>
                        <h6 className="card-title small text-muted mb-2">{stage}</h6>
                        {count > 0 && (
                          <button
                            onClick={() => window.location.hash = `#/list/${stage.toLowerCase().replace(' ', '-')}`}
                            className="btn btn-outline-primary btn-sm d-flex align-items-center justify-content-center mx-auto"
                          >
                            <small className="me-1">View</small>
                            <ArrowRight size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="row g-4">
          {/* Stage Duration Widget */}
          <div className="col-lg-6">
            <StageDurationWidget 
              onSettingsClick={() => setShowStageSettings(true)}
            />
          </div>

          {/* Recent Activity */}
          <div className="col-lg-6">
            <div className="card shadow-sm h-100">
              <div className="card-header bg-white">
                <h5 className="card-title mb-0">Recent Activity</h5>
              </div>
              <div className="card-body">
                <div className="activity-timeline">
                  {recentActivity.length > 0 ? (
                    recentActivity.map((activity, index) => (
                      <div key={index} className="d-flex mb-3">
                        <div className="flex-shrink-0 me-3 mt-1">
                          <div className="bg-primary rounded-circle" style={{width: '8px', height: '8px'}}></div>
                        </div>
                        <div className="flex-grow-1">
                          <p className="mb-1 small">
                            <span className="fw-semibold text-primary">{activity.user}</span>
                            <span className="text-muted ms-1">
                              {activity.action === 'create' && 'created'}
                              {activity.action === 'edit' && 'updated'}
                              {activity.action === 'stage_change' && 'moved'}
                              {activity.action === 'opportunity_scored' && 'scored'}
                            </span>
                            <br />
                            <span className="fw-medium">{activity.opportunity}</span>
                          </p>
                          <p className="text-muted small mb-0">
                            <Clock size={12} className="me-1" />
                            {new Date(activity.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4">
                      <Clock size={48} className="text-muted mb-3" />
                      <p className="text-muted">No recent activity</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="col-lg-12">
            <div className="card shadow-sm h-100">
              <div className="card-header bg-white">
                <h5 className="card-title mb-0">Quick Actions</h5>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <PermissionGuard permission="opportunities:create">
                      <button
                        onClick={() => window.location.hash = '#/add'}
                        className="btn btn-outline-primary d-flex align-items-center justify-content-between p-3 text-start w-100"
                      >
                        <div className="d-flex align-items-center">
                          <div className="bg-primary bg-opacity-10 rounded p-2 me-3">
                            <Plus className="text-primary" size={20} />
                          </div>
                          <div>
                            <div className="fw-semibold">Add New Opportunity</div>
                            <small className="text-muted">Create a new sales opportunity</small>
                          </div>
                        </div>
                        <ArrowRight className="text-muted" size={16} />
                      </button>
                    </PermissionGuard>
                  </div>
                  
                  <div className="col-md-6">
                    <button
                      onClick={() => window.location.hash = '#/kanban'}
                      className="btn btn-outline-success d-flex align-items-center justify-content-between p-3 text-start w-100"
                    >
                      <div className="d-flex align-items-center">
                        <div className="bg-success bg-opacity-10 rounded p-2 me-3">
                          <TrendingUp className="text-success" size={20} />
                        </div>
                        <div>
                          <div className="fw-semibold">View Kanban Board</div>
                          <small className="text-muted">Drag and drop interface</small>
                        </div>
                      </div>
                      <ArrowRight className="text-muted" size={16} />
                    </button>
                  </div>
                  
                  <div className="col-md-6">
                    <button
                      onClick={() => window.location.hash = '#/list'}
                      className="btn btn-outline-info d-flex align-items-center justify-content-between p-3 text-start w-100"
                    >
                      <div className="d-flex align-items-center">
                        <div className="bg-info bg-opacity-10 rounded p-2 me-3">
                          <Users className="text-info" size={20} />
                        </div>
                        <div>
                          <div className="fw-semibold">All Opportunities</div>
                          <small className="text-muted">Advanced list view with filters</small>
                        </div>
                      </div>
                      <ArrowRight className="text-muted" size={16} />
                    </button>
                  </div>

                  <PermissionGuard role="Admin">
                    <div className="col-md-6">
                      <button
                        onClick={() => window.location.hash = '#/users'}
                        className="btn btn-outline-warning d-flex align-items-center justify-content-between p-3 text-start w-100"
                      >
                        <div className="d-flex align-items-center">
                          <div className="bg-warning bg-opacity-10 rounded p-2 me-3">
                            <Users className="text-warning" size={20} />
                          </div>
                          <div>
                            <div className="fw-semibold">User Management</div>
                            <small className="text-muted">Manage system users</small>
                          </div>
                        </div>
                        <ArrowRight className="text-muted" size={16} />
                      </button>
                    </div>
                  </PermissionGuard>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stage Duration Modals */}
        <StageSettingsModal
          isOpen={showStageSettings}
          onClose={() => setShowStageSettings(false)}
        />

        <OverdueOpportunitiesModal
          isOpen={showOverdueModal}
          onClose={() => setShowOverdueModal(false)}
        />
      </div>
    </div>
  );
};

export default Dashboard;