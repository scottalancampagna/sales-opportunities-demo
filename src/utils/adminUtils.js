// src/utils/adminUtils.js

export const validateUserData = (userData, existingUsers, editingUserId = null) => {
  const errors = [];

  // Name validation
  if (!userData.name || !userData.name.trim()) {
    errors.push('Name is required');
  } else if (userData.name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long');
  }

  // Email validation
  if (!userData.email || !userData.email.trim()) {
    errors.push('Email is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
    errors.push('Please enter a valid email address');
  } else {
    // Check for duplicate email
    const duplicateUser = existingUsers.find(u => 
      u.email.toLowerCase() === userData.email.toLowerCase() && 
      u.id !== editingUserId
    );
    if (duplicateUser) {
      errors.push('Email address is already in use');
    }
  }

  // Role validation
  const validRoles = ['Admin', 'GTMLead', 'GTM', 'PracticeLead', 'POC'];
  if (!userData.role || !validRoles.includes(userData.role)) {
    errors.push('Please select a valid role');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const exportUsersToCSV = (users) => {
  const headers = [
    'ID',
    'Name', 
    'Email',
    'Role',
    'Status',
    'Created Date',
    'Created By',
    'Last Login',
    'Login Count',
    'Updated Date',
    'Updated By'
  ];

  const csvData = users.map(user => [
    user.id,
    user.name,
    user.email,
    user.role,
    user.active !== false ? 'Active' : 'Inactive',
    user.created_date ? new Date(user.created_date).toLocaleDateString() : '',
    user.created_by || '',
    user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never',
    user.login_count || 0,
    user.updated_date ? new Date(user.updated_date).toLocaleDateString() : '',
    user.updated_by || ''
  ]);

  const csvContent = [
    headers.join(','),
    ...csvData.map(row => 
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    )
  ].join('\n');

  // Download CSV
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const checkSystemHealth = () => {
  const issues = [];
  let isHealthy = true;

  try {
    // Check localStorage availability
    const testKey = 'health_check_test';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
  } catch (e) {
    issues.push('Local storage not available');
    isHealthy = false;
  }

  // Check user data integrity
  try {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    // Check for duplicate emails
    const emails = users.map(u => u.email.toLowerCase());
    const duplicateEmails = emails.filter((email, index) => emails.indexOf(email) !== index);
    if (duplicateEmails.length > 0) {
      issues.push(`Duplicate email addresses found: ${duplicateEmails.join(', ')}`);
      isHealthy = false;
    }

    // Check for users without required fields
    const invalidUsers = users.filter(u => !u.name || !u.email || !u.role);
    if (invalidUsers.length > 0) {
      issues.push(`${invalidUsers.length} users with missing required fields`);
      isHealthy = false;
    }

    // Check for admin users
    const adminUsers = users.filter(u => u.role === 'Admin' && u.active !== false);
    if (adminUsers.length === 0) {
      issues.push('No active admin users found');
      isHealthy = false;
    }
  } catch (e) {
    issues.push('User data corruption detected');
    isHealthy = false;
  }

  // Check opportunities data integrity
  try {
    const opportunities = JSON.parse(localStorage.getItem('opportunities') || '[]');
    
    // Check for opportunities without required fields
    const invalidOpportunities = opportunities.filter(opp => 
      !opp.specialist || !opp.stage || !opp.client_ask
    );
    if (invalidOpportunities.length > 0) {
      issues.push(`${invalidOpportunities.length} opportunities with missing required fields`);
      isHealthy = false;
    }
  } catch (e) {
    issues.push('Opportunities data corruption detected');
    isHealthy = false;
  }

  return {
    isHealthy,
    issues,
    checkedAt: new Date().toISOString()
  };
};

export const getUserStats = (users) => {
  const stats = {
    total: users.length,
    active: users.filter(u => u.active !== false).length,
    inactive: users.filter(u => u.active === false).length,
    byRole: {},
    recentLogins: users.filter(u => {
      if (!u.last_login) return false;
      const loginDate = new Date(u.last_login);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return loginDate > weekAgo;
    }).length,
    neverLoggedIn: users.filter(u => !u.last_login).length
  };

  // Count by role
  const roles = ['Admin', 'GTMLead', 'GTM', 'PracticeLead', 'POC'];
  roles.forEach(role => {
    stats.byRole[role] = users.filter(u => u.role === role).length;
  });

  return stats;
};

export const generateUserReport = (users) => {
  const stats = getUserStats(users);
  const health = checkSystemHealth();
  
  const report = {
    generatedAt: new Date().toISOString(),
    stats,
    health,
    recentActivity: users
      .filter(u => u.last_login)
      .sort((a, b) => new Date(b.last_login) - new Date(a.last_login))
      .slice(0, 10)
      .map(u => ({
        name: u.name,
        email: u.email,
        role: u.role,
        lastLogin: u.last_login,
        loginCount: u.login_count || 0
      })),
    inactiveUsers: users
      .filter(u => u.active === false)
      .map(u => ({
        name: u.name,
        email: u.email,
        role: u.role,
        deactivatedDate: u.updated_date
      }))
  };

  return report;
};

export const resetUserPassword = (userId) => {
  // In a real system, this would trigger a password reset email
  // For this demo, we'll just log the action
  console.log(`Password reset requested for user ID: ${userId}`);
  
  // Add to audit trail if needed
  const auditEntry = {
    timestamp: new Date().toISOString(),
    action: 'password_reset_requested',
    userId: userId,
    requestedBy: 'system_admin'
  };
  
  // Store audit entry
  const auditTrail = JSON.parse(localStorage.getItem('user_audit_trail') || '[]');
  auditTrail.push(auditEntry);
  localStorage.setItem('user_audit_trail', JSON.stringify(auditTrail));
  
  return true;
};

export const bulkUserImport = (csvData) => {
  // Parse CSV and validate user data for bulk import
  const results = {
    success: 0,
    errors: [],
    users: []
  };

  try {
    const lines = csvData.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    // Required headers
    const requiredHeaders = ['name', 'email', 'role'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    
    if (missingHeaders.length > 0) {
      results.errors.push(`Missing required headers: ${missingHeaders.join(', ')}`);
      return results;
    }

    // Process each row
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue; // Skip empty lines
      
      const values = lines[i].split(',').map(v => v.trim());
      const userData = {};
      
      headers.forEach((header, index) => {
        userData[header] = values[index] || '';
      });

      // Validate user data
      const validation = validateUserData(userData, [], null);
      
      if (validation.isValid) {
        results.users.push({
          id: Date.now().toString() + Math.random(),
          name: userData.name,
          email: userData.email,
          role: userData.role,
          active: true,
          created_date: new Date().toISOString(),
          created_by: 'bulk_import',
          last_login: null,
          login_count: 0
        });
        results.success++;
      } else {
        results.errors.push(`Row ${i + 1}: ${validation.errors.join(', ')}`);
      }
    }
  } catch (error) {
    results.errors.push(`CSV parsing error: ${error.message}`);
  }

  return results;
};
