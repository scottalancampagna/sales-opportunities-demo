// src/utils/permissions.js

export const canChangeStage = (user, opportunity, targetStage) => {
  if (!user || !opportunity) return false;

  // Admin can do everything
  if (user.role === 'Admin') return true;

  const currentStage = opportunity.stage;

  switch (user.role) {
    case 'GTMLead':
      // Can change stages when opportunity is in Intake
      return currentStage === 'Intake' && 
             ['Needs More Info', 'In Research', 'Shaping', 'Proposal'].includes(targetStage);

    case 'GTM':
      // Can change stages when opportunity is in Proposal
      return currentStage === 'Proposal' && 
             ['Review', 'Complete'].includes(targetStage);

    case 'PracticeLead':
      // Can edit details on opportunities in Shaping, but not change stages
      // (This function is for stage changes, so return false)
      return false;

    case 'POC':
      // POCs cannot change stages, only update POC fields
      return false;

    default:
      // All roles can move opportunities to Intake from New
      return currentStage === 'New' && targetStage === 'Intake';
  }
};

export const canEditOpportunity = (user, opportunity) => {
  if (!user || !opportunity) return false;

  // Admin can edit everything
  if (user.role === 'Admin') return true;

  switch (user.role) {
    case 'GTMLead':
    case 'GTM':
      return true; // GTM roles can edit opportunities

    case 'PracticeLead':
      // Can edit details when opportunity is in Shaping
      return opportunity.stage === 'Shaping';

    case 'POC':
      // Can update POC fields when available (Intake or later)
      return ['Intake', 'Needs More Info', 'In Research', 'Shaping', 'Proposal', 'Review'].includes(opportunity.stage);

    default:
      // All roles can edit opportunities they created
      return opportunity.specialist === user.name;
  }
};

export const canCreateOpportunity = (user) => {
  // All authenticated users can create opportunities
  return user && user.role;
};

export const canManageUsers = (user) => {
  // Only Admins can manage users
  return user && user.role === 'Admin';
};

export const canViewOpportunity = (user, opportunity) => {
  if (!user) return false;
  
  // Admin can view everything
  if (user.role === 'Admin') return true;
  
  // All other roles can view all opportunities for now
  // Could be restricted later based on business rules
  return true;
};

export const getAvailableStages = (user, opportunity) => {
  if (!user || !opportunity) return [];

  // Admin can move to any valid stage
  if (user.role === 'Admin') {
    return getValidTransitions(opportunity.stage);
  }

  // Get valid transitions based on current stage
  const validTransitions = getValidTransitions(opportunity.stage);
  
  // Filter based on role permissions
  return validTransitions.filter(stage => canChangeStage(user, opportunity, stage));
};

const getValidTransitions = (currentStage) => {
  const transitions = {
    'New': ['Intake'],
    'Intake': ['Needs More Info', 'In Research', 'Shaping', 'Proposal'],
    'Needs More Info': ['Intake'],
    'In Research': ['Shaping'],
    'Shaping': ['In Research', 'Proposal'], // Can go backwards to Research
    'Proposal': ['Review'],
    'Review': ['Complete', 'Proposal'], // Can go back to Proposal if needed
    'Complete': [] // Terminal state
  };

  return transitions[currentStage] || [];
};