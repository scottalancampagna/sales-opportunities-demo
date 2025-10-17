import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useAuth } from './AuthContext';

// Sample data for development
const SAMPLE_OPPORTUNITIES = [
  {
    id: 'opp-001',
    sfdc_id: 'SF-2024-001',
    specialist: 'Bob Specialist',
    client_ask: 'Need help building a modern customer portal with real-time data analytics and mobile responsiveness',
    needs: 'Technical architecture, UX design, and implementation support for customer-facing portal',
    why_launch: 'Client has existing relationship with Launch, tight timeline, and requires specialized fintech expertise',
    stage: 'Intake',
    created_date: '2024-10-01T10:00:00Z',
    updated_date: '2024-10-01T10:00:00Z',
    client: 'Tech Solutions Inc',
    industry: 'BFSI',
    proposal_due_date: '2024-11-15T17:00:00Z',
    assigned_resources: {
      solution_architect: 'Mike POC',
      design_poc: '',
      strategy_poc: '',
      delivery_poc: '',
      tech_poc: ''
    },
    won_status: null,
    audit_trail: [
      {
        id: 'audit-001',
        timestamp: '2024-10-01T10:00:00Z',
        user_name: 'Bob Specialist',
        action_type: 'create',
        old_values: null,
        new_values: { stage: 'New' },
        notes: 'Initial opportunity created'
      }
    ]
  },
  {
    id: 'opp-002',
    sfdc_id: 'SF-2024-002',
    specialist: 'Jane GTMLead',
    client_ask: 'Digital transformation of legacy healthcare system',
    needs: 'Cloud migration strategy, API development, and security compliance',
    why_launch: 'Launch has proven healthcare experience and security clearances',
    stage: 'Shaping',
    created_date: '2024-09-28T14:30:00Z',
    updated_date: '2024-10-05T11:20:00Z',
    client: 'Regional Health Network',
    industry: 'HCLS',
    proposal_due_date: '2024-10-25T17:00:00Z',
    assigned_resources: {
      solution_architect: 'Mike POC',
      design_poc: 'Sarah PracticeLead',
      strategy_poc: 'Jane GTMLead',
      delivery_poc: '',
      tech_poc: ''
    },
    won_status: null,
    audit_trail: [
      {
        id: 'audit-002',
        timestamp: '2024-09-28T14:30:00Z',
        user_name: 'Jane GTMLead',
        action_type: 'create',
        old_values: null,
        new_values: { stage: 'New' },
        notes: 'Opportunity created'
      },
      {
        id: 'audit-003',
        timestamp: '2024-10-05T11:20:00Z',
        user_name: 'Jane GTMLead',
        action_type: 'stage_change',
        old_values: { stage: 'Intake' },
        new_values: { stage: 'Shaping' },
        notes: 'Moved to shaping after intake review'
      }
    ]
  },
  {
    id: 'opp-003',
    sfdc_id: 'SF-2024-003',
    specialist: 'Bob Specialist',
    client_ask: 'E-commerce platform modernization',
    needs: 'Performance optimization, payment integration, inventory management',
    why_launch: 'Previous successful project with this client, urgent timeline',
    stage: 'Proposal',
    created_date: '2024-09-15T09:15:00Z',
    updated_date: '2024-10-12T16:45:00Z',
    client: 'Retail Dynamics',
    industry: 'Products',
    proposal_due_date: '2024-10-20T17:00:00Z',
    assigned_resources: {
      solution_architect: 'Mike POC',
      design_poc: 'Sarah PracticeLead',
      strategy_poc: 'Jane GTMLead',
      delivery_poc: 'Mike POC',
      tech_poc: 'Sarah PracticeLead'
    },
    won_status: null,
    audit_trail: [
      {
        id: 'audit-004',
        timestamp: '2024-09-15T09:15:00Z',
        user_name: 'Bob Specialist',
        action_type: 'create',
        old_values: null,
        new_values: { stage: 'New' },
        notes: 'Initial opportunity created'
      },
      {
        id: 'audit-005',
        timestamp: '2024-10-12T16:45:00Z',
        user_name: 'Jane GTMLead',
        action_type: 'stage_change',
        old_values: { stage: 'Shaping' },
        new_values: { stage: 'Proposal' },
        notes: 'All resources assigned, moving to proposal'
      }
    ]
  },
  {
    id: 'opp-004',
    sfdc_id: 'SF-2024-004',
    specialist: 'Sarah PracticeLead',
    client_ask: 'Government modernization initiative',
    needs: 'Legacy system replacement, security compliance, training',
    why_launch: 'Security clearances, government experience, proven track record',
    stage: 'In Research',
    created_date: '2024-10-10T08:00:00Z',
    updated_date: '2024-10-14T13:30:00Z',
    client: 'State Department',
    industry: 'Public Sector',
    proposal_due_date: '2024-11-30T17:00:00Z',
    assigned_resources: {
      solution_architect: '',
      design_poc: '',
      strategy_poc: 'Jane GTMLead',
      delivery_poc: '',
      tech_poc: ''
    },
    won_status: null,
    audit_trail: [
      {
        id: 'audit-006',
        timestamp: '2024-10-10T08:00:00Z',
        user_name: 'Sarah PracticeLead',
        action_type: 'create',
        old_values: null,
        new_values: { stage: 'New' },
        notes: 'Government opportunity identified'
      }
    ]
  },
  {
    id: 'opp-005',
    sfdc_id: 'SF-2024-005',
    specialist: 'Mike POC',
    client_ask: 'Mobile app development for customer engagement',
    needs: 'iOS/Android development, backend API, analytics integration',
    why_launch: 'Mobile expertise, existing client relationship',
    stage: 'Complete',
    created_date: '2024-08-01T10:00:00Z',
    updated_date: '2024-09-30T17:00:00Z',
    client: 'Customer First Bank',
    industry: 'BFSI',
    proposal_due_date: '2024-08-20T17:00:00Z',
    assigned_resources: {
      solution_architect: 'Mike POC',
      design_poc: 'Sarah PracticeLead',
      strategy_poc: 'Jane GTMLead',
      delivery_poc: 'Mike POC',
      tech_poc: 'Sarah PracticeLead'
    },
    won_status: true,
    audit_trail: [
      {
        id: 'audit-007',
        timestamp: '2024-08-01T10:00:00Z',
        user_name: 'Mike POC',
        action_type: 'create',
        old_values: null,
        new_values: { stage: 'New' },
        notes: 'Mobile app opportunity created'
      },
      {
        id: 'audit-008',
        timestamp: '2024-09-30T17:00:00Z',
        user_name: 'Admin User',
        action_type: 'stage_change',
        old_values: { stage: 'Review' },
        new_values: { stage: 'Complete', won_status: true },
        notes: 'Proposal accepted, deal won!'
      }
    ]
  }
];

const STAGES = [
  'New',
  'Intake', 
  'Needs More Info',
  'In Research',
  'Shaping',
  'Proposal',
  'Review',
  'Complete'
];

const INDUSTRIES = [
  'HCLS',
  'BFSI', 
  'Products',
  'Public Sector'
];

const DataContext = createContext();

// Data reducer
const dataReducer = (state, action) => {
  switch (action.type) {
    case 'LOAD_DATA':
      return {
        ...state,
        opportunities: action.payload.opportunities,
        isLoading: false
      };
    
    case 'CREATE_OPPORTUNITY':
      const newOpportunity = {
        ...action.payload,
        id: `opp-${Date.now()}`,
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
        audit_trail: [
          {
            id: `audit-${Date.now()}`,
            timestamp: new Date().toISOString(),
            user_name: action.user_name,
            action_type: 'create',
            old_values: null,
            new_values: { stage: action.payload.stage },
            notes: 'Opportunity created'
          }
        ]
      };
      
      const updatedOpportunities = [...state.opportunities, newOpportunity];
      localStorage.setItem('dealtracker_opportunities', JSON.stringify(updatedOpportunities));
      
      return {
        ...state,
        opportunities: updatedOpportunities
      };
    
    case 'UPDATE_OPPORTUNITY':
      const updatedOpps = state.opportunities.map(opp => {
        if (opp.id === action.payload.id) {
          const updatedOpp = {
            ...opp,
            ...action.payload.changes,
            updated_date: new Date().toISOString(),
            audit_trail: [
              ...opp.audit_trail,
              {
                id: `audit-${Date.now()}`,
                timestamp: new Date().toISOString(),
                user_name: action.user_name,
                action_type: action.payload.action_type || 'edit',
                old_values: action.payload.old_values,
                new_values: action.payload.changes,
                notes: action.payload.notes || 'Opportunity updated'
              }
            ]
          };
          return updatedOpp;
        }
        return opp;
      });
      
      localStorage.setItem('dealtracker_opportunities', JSON.stringify(updatedOpps));
      
      return {
        ...state,
        opportunities: updatedOpps
      };
    
    case 'DELETE_OPPORTUNITY':
      const filteredOpps = state.opportunities.filter(opp => opp.id !== action.payload.id);
      localStorage.setItem('dealtracker_opportunities', JSON.stringify(filteredOpps));
      
      return {
        ...state,
        opportunities: filteredOpps
      };
    
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      };
    
    default:
      return state;
  }
};

export const DataProvider = ({ children }) => {
  const { user } = useAuth();
  const [state, dispatch] = useReducer(dataReducer, {
    opportunities: [],
    isLoading: true
  });

  // Initialize sample data on first load
  useEffect(() => {
    const existingOpportunities = localStorage.getItem('dealtracker_opportunities');
    if (!existingOpportunities) {
      localStorage.setItem('dealtracker_opportunities', JSON.stringify(SAMPLE_OPPORTUNITIES));
      dispatch({ type: 'LOAD_DATA', payload: { opportunities: SAMPLE_OPPORTUNITIES } });
    } else {
      try {
        const opportunities = JSON.parse(existingOpportunities);
        dispatch({ type: 'LOAD_DATA', payload: { opportunities } });
      } catch (error) {
        console.error('Error loading opportunities:', error);
        // Fallback to sample data
        localStorage.setItem('dealtracker_opportunities', JSON.stringify(SAMPLE_OPPORTUNITIES));
        dispatch({ type: 'LOAD_DATA', payload: { opportunities: SAMPLE_OPPORTUNITIES } });
      }
    }
  }, []);

  // Business logic functions
  const createOpportunity = (opportunityData) => {
    if (!user) return;
    
    dispatch({
      type: 'CREATE_OPPORTUNITY',
      payload: {
        ...opportunityData,
        stage: 'New'
      },
      user_name: user.name
    });
  };

  const updateOpportunity = (id, changes, actionType = 'edit', notes = '') => {
    if (!user) return;
    
    const currentOpportunity = state.opportunities.find(opp => opp.id === id);
    if (!currentOpportunity) return;

    // Create old_values object for audit trail
    const old_values = {};
    Object.keys(changes).forEach(key => {
      if (currentOpportunity[key] !== changes[key]) {
        old_values[key] = currentOpportunity[key];
      }
    });

    dispatch({
      type: 'UPDATE_OPPORTUNITY',
      payload: {
        id,
        changes,
        action_type: actionType,
        old_values,
        notes
      },
      user_name: user.name
    });
  };

  const changeStage = (id, newStage, notes = '') => {
    updateOpportunity(id, { stage: newStage }, 'stage_change', notes);
  };

  const assignResource = (id, resourceType, resourceName, notes = '') => {
    const changes = {
      assigned_resources: {
        ...state.opportunities.find(opp => opp.id === id)?.assigned_resources,
        [resourceType]: resourceName
      }
    };
    updateOpportunity(id, changes, 'resource_assignment', notes);
  };

  const deleteOpportunity = (id) => {
    if (!user) return;
    dispatch({ type: 'DELETE_OPPORTUNITY', payload: { id } });
  };

  // Filter functions for different user roles
  const getVisibleOpportunities = () => {
    if (!user) return [];
    
    const { role, name } = user;
    
    switch (role) {
      case 'Admin':
      case 'GTMLead':
      case 'GM':
        return state.opportunities;
      
      case 'GTM':
        // Can see all opportunities but may have limited edit rights
        return state.opportunities;
      
      case 'PracticeLead':
        // Can see all opportunities but focus on those needing resources
        return state.opportunities;
      
      case 'POC':
        // Can see opportunities where they are assigned or all if they need visibility
        return state.opportunities.filter(opp => 
          Object.values(opp.assigned_resources || {}).includes(name) ||
          opp.specialist === name
        );
      
      default:
        return state.opportunities;
    }
  };

  // Statistics and analytics
  const getOpportunityStats = () => {
    const visibleOpps = getVisibleOpportunities();
    
    const stats = {
      total: visibleOpps.length,
      byStage: {},
      overdue: 0,
      won: 0,
      lost: 0
    };

    // Initialize stage counts
    STAGES.forEach(stage => {
      stats.byStage[stage] = 0;
    });

    // Calculate stats
    visibleOpps.forEach(opp => {
      stats.byStage[opp.stage]++;
      
      // Check for overdue (proposal due date passed and not complete)
      if (opp.proposal_due_date && opp.stage !== 'Complete') {
        const dueDate = new Date(opp.proposal_due_date);
        const now = new Date();
        if (now > dueDate) {
          stats.overdue++;
        }
      }
      
      // Count wins/losses
      if (opp.stage === 'Complete') {
        if (opp.won_status === true) {
          stats.won++;
        } else if (opp.won_status === false) {
          stats.lost++;
        }
      }
    });

    return stats;
  };

  // Get opportunities by stage
  const getOpportunitiesByStage = (stage) => {
    return getVisibleOpportunities().filter(opp => opp.stage === stage);
  };

  // Get unique values for filters
  const getFilterOptions = () => {
    const visibleOpps = getVisibleOpportunities();
    
    return {
      clients: [...new Set(visibleOpps.map(opp => opp.client).filter(Boolean))].sort(),
      specialists: [...new Set(visibleOpps.map(opp => opp.specialist).filter(Boolean))].sort(),
      industries: INDUSTRIES,
      stages: STAGES
    };
  };

  // Search and filter opportunities
  const searchOpportunities = (query, filters = {}) => {
    let opportunities = getVisibleOpportunities();
    
    // Text search
    if (query) {
      const searchTerm = query.toLowerCase();
      opportunities = opportunities.filter(opp =>
        opp.client_ask?.toLowerCase().includes(searchTerm) ||
        opp.client?.toLowerCase().includes(searchTerm) ||
        opp.specialist?.toLowerCase().includes(searchTerm) ||
        opp.sfdc_id?.toLowerCase().includes(searchTerm) ||
        opp.needs?.toLowerCase().includes(searchTerm)
      );
    }
    
    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'all') {
        if (Array.isArray(value)) {
          opportunities = opportunities.filter(opp => value.includes(opp[key]));
        } else {
          opportunities = opportunities.filter(opp => opp[key] === value);
        }
      }
    });
    
    return opportunities;
  };

  // Calculate days in current stage
  const getDaysInStage = (opportunity) => {
    const lastStageChange = opportunity.audit_trail
      .filter(entry => entry.action_type === 'stage_change')
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
    
    const referenceDate = lastStageChange 
      ? new Date(lastStageChange.timestamp)
      : new Date(opportunity.created_date);
    
    const now = new Date();
    const diffTime = Math.abs(now - referenceDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  const value = {
    // State
    opportunities: state.opportunities,
    isLoading: state.isLoading,
    
    // CRUD operations
    createOpportunity,
    updateOpportunity,
    deleteOpportunity,
    changeStage,
    assignResource,
    
    // Data access
    getVisibleOpportunities,
    getOpportunitiesByStage,
    getOpportunityStats,
    getFilterOptions,
    searchOpportunities,
    getDaysInStage,
    
    // Constants
    STAGES,
    INDUSTRIES
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};