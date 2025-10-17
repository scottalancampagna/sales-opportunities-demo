// src/utils/constants.js

export const STAGES = [
  'New',
  'Intake',
  'Needs More Info',
  'In Research', 
  'Shaping',
  'Proposal',
  'Review',
  'Complete'
];

export const STAGE_TRANSITIONS = {
  'New': ['Intake'],
  'Intake': ['Needs More Info', 'In Research', 'Shaping', 'Proposal'],
  'Needs More Info': ['Intake'],
  'In Research': ['Shaping'],
  'Shaping': ['In Research', 'Proposal'], // Can go backwards to Research
  'Proposal': ['Review'],
  'Review': ['Complete', 'Proposal'], // Can go back to Proposal if needed
  'Complete': [] // Terminal state
};

export const USER_ROLES = [
  'Admin',
  'GTMLead',
  'GTM', 
  'PracticeLead',
  'POC'
];

export const INDUSTRIES = [
  'Healthcare & Life Sciences',
  'Banking & Financial Services',
  'Products & Technology',
  'Public Sector',
  'Manufacturing',
  'Retail & Consumer',
  'Energy & Utilities',
  'Other'
];

export const OFFERINGS = [
  'Digital Strategy',
  'Experience Design',
  'Engineering',
  'Data & AI',
  'Cloud & Infrastructure',
  'Product Management',
  'Delivery & Operations',
  'Change Management'
];

export const STAGE_COLORS = {
  'New': 'bg-light text-dark',
  'Intake': 'bg-secondary text-white',
  'Needs More Info': 'bg-danger text-white',
  'In Research': 'bg-warning text-dark',
  'Shaping': 'bg-warning text-dark',
  'Proposal': 'bg-primary text-white',
  'Review': 'bg-info text-white',
  'Complete': 'bg-success text-white'
};

export const POC_TYPES = [
  'Solution',
  'Tech', 
  'Design',
  'Strategy',
  'Delivery'
];

export const SAMPLE_USERS = [
  { id: '1', name: 'Admin User', email: 'admin@company.com', role: 'Admin' },
  { id: '2', name: 'Sarah Johnson', email: 'sarah.johnson@company.com', role: 'GTMLead' },
  { id: '3', name: 'Mike Chen', email: 'mike.chen@company.com', role: 'GTM' },
  { id: '4', name: 'Lisa Rodriguez', email: 'lisa.rodriguez@company.com', role: 'PracticeLead' },
  { id: '5', name: 'David Kim', email: 'david.kim@company.com', role: 'POC' },
  { id: '6', name: 'Emily Davis', email: 'emily.davis@company.com', role: 'GTM' },
  { id: '7', name: 'Alex Thompson', email: 'alex.thompson@company.com', role: 'POC' }
];

export const SAMPLE_OPPORTUNITIES = [
  {
    id: '1',
    sfdc_id: 'OPP-2024-001',
    specialist: 'Sarah Johnson',
    client_ask: 'Digital transformation for healthcare platform',
    needs: 'Modernize legacy systems, improve patient experience',
    why_launch: 'Strategic client relationship, high visibility project',
    stage: 'Shaping',
    client: 'MedTech Solutions',
    industry: 'Healthcare & Life Sciences',
    offerings: ['Digital Strategy', 'Experience Design', 'Engineering'],
    aop_value: 850000,
    eenu_value: 1200000,
    won_status: false,
    created_date: '2024-01-15T10:00:00Z',
    updated_date: '2024-02-01T14:30:00Z',
    assigned_resources: {
      solution_architect: 'David Kim',
      design_poc: 'Emily Davis',
      strategy_poc: 'Lisa Rodriguez',
      delivery_poc: null,
      tech_poc: 'Alex Thompson'
    },
    audit_trail: [
      {
        timestamp: '2024-01-15T10:00:00Z',
        user: 'Sarah Johnson',
        action: 'create',
        field: null,
        old_value: null,
        new_value: null
      },
      {
        timestamp: '2024-01-20T09:15:00Z',
        user: 'Sarah Johnson',
        action: 'stage_change',
        field: 'stage',
        old_value: 'New',
        new_value: 'Intake'
      }
    ]
  },
  {
    id: '2',
    sfdc_id: 'OPP-2024-002',
    specialist: 'Mike Chen',
    client_ask: 'Cloud migration and data analytics platform',
    needs: 'Move to cloud, implement real-time analytics',
    why_launch: 'Expansion opportunity with existing client',
    stage: 'Proposal',
    client: 'FinanceFirst Bank',
    industry: 'Banking & Financial Services',
    offerings: ['Cloud & Infrastructure', 'Data & AI'],
    aop_value: 650000,
    eenu_value: 950000,
    won_status: false,
    created_date: '2024-01-22T11:30:00Z',
    updated_date: '2024-02-05T16:45:00Z',
    assigned_resources: {
      solution_architect: 'Alex Thompson',
      design_poc: null,
      strategy_poc: 'Sarah Johnson',
      delivery_poc: 'David Kim',
      tech_poc: 'Alex Thompson'
    },
    audit_trail: [
      {
        timestamp: '2024-01-22T11:30:00Z',
        user: 'Mike Chen',
        action: 'create',
        field: null,
        old_value: null,
        new_value: null
      }
    ]
  },
  {
    id: '3',
    sfdc_id: 'OPP-2024-003',
    specialist: 'Emily Davis',
    client_ask: 'E-commerce platform redesign',
    needs: 'Improve conversion rates, mobile optimization',
    why_launch: 'High-profile retail client, showcase opportunity',
    stage: 'In Research',
    client: 'RetailMax Corp',
    industry: 'Retail & Consumer',
    offerings: ['Experience Design', 'Engineering'],
    aop_value: 420000,
    eenu_value: 580000,
    won_status: false,
    created_date: '2024-02-01T09:00:00Z',
    updated_date: '2024-02-10T13:20:00Z',
    assigned_resources: {
      solution_architect: 'David Kim',
      design_poc: 'Emily Davis',
      strategy_poc: null,
      delivery_poc: null,
      tech_poc: null
    },
    audit_trail: []
  }
];