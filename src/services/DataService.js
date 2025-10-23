// src/services/DataService.js
class DataService {
  constructor() {
    this.baseUrl = process.env.REACT_APP_API_BASE_URL || 'https://deal-tracker-api-v2-sc-g3g4gzgfdxc2ddbe.westus2-01.azurewebsites.net/api';
    this.useApi = process.env.REACT_APP_USE_API === 'true';
    
    console.log(`DataService initialized: ${this.useApi ? 'Azure API' : 'localStorage'} mode`);
  }

  // ===========================================
  // OPPORTUNITIES
  // ===========================================
  
  async getOpportunities() {
    if (this.useApi) {
      try {
        const response = await fetch(`${this.baseUrl}/opportunities`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Fetched opportunities from API:', data.length);
        return data;
      } catch (error) {
        console.error('Error fetching opportunities from API:', error);
        // Fallback to localStorage on error
        return this.getOpportunitiesFromStorage();
      }
    } else {
      return this.getOpportunitiesFromStorage();
    }
  }

  getOpportunitiesFromStorage() {
    const stored = localStorage.getItem('opportunities');
    return stored ? JSON.parse(stored) : [];
  }

  async createOpportunity(opportunity) {
    if (this.useApi) {
      try {
        const response = await fetch(`${this.baseUrl}/opportunities`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(opportunity)
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const created = await response.json();
        console.log('Created opportunity via API:', created.id);
        
        // Also create audit log
        await this.createAuditLog({
          action: 'CREATE',
          entityType: 'opportunity',
          entityId: created.id,
          changes: opportunity,
          timestamp: new Date().toISOString(),
          user: this.getCurrentUser()
        });
        
        return created;
      } catch (error) {
        console.error('Error creating opportunity via API:', error);
        // Fallback to localStorage
        return this.createOpportunityInStorage(opportunity);
      }
    } else {
      return this.createOpportunityInStorage(opportunity);
    }
  }

  createOpportunityInStorage(opportunity) {
    const opportunities = this.getOpportunitiesFromStorage();
    const newOpportunity = {
      id: this.generateId(),
      ...opportunity,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    opportunities.push(newOpportunity);
    localStorage.setItem('opportunities', JSON.stringify(opportunities));
    
    // Create audit log in storage
    this.createAuditLogInStorage({
      action: 'CREATE',
      entityType: 'opportunity',
      entityId: newOpportunity.id,
      changes: opportunity,
      timestamp: new Date().toISOString(),
      user: this.getCurrentUser()
    });
    
    return newOpportunity;
  }

  async updateOpportunity(id, updates) {
    if (this.useApi) {
      try {
        // For now, implement as delete + create since we don't have PUT endpoint
        const existing = await this.getOpportunities();
        const opportunity = existing.find(o => o.id === id);
        if (!opportunity) throw new Error('Opportunity not found');
        
        const updated = { ...opportunity, ...updates, updatedAt: new Date().toISOString() };
        
        // Create audit log for the update
        await this.createAuditLog({
          action: 'UPDATE',
          entityType: 'opportunity',
          entityId: id,
          oldValues: opportunity,
          newValues: updated,
          changes: updates,
          timestamp: new Date().toISOString(),
          user: this.getCurrentUser()
        });
        
        // For now, update in storage as fallback
        return this.updateOpportunityInStorage(id, updates);
      } catch (error) {
        console.error('Error updating opportunity via API:', error);
        return this.updateOpportunityInStorage(id, updates);
      }
    } else {
      return this.updateOpportunityInStorage(id, updates);
    }
  }

  updateOpportunityInStorage(id, updates) {
    const opportunities = this.getOpportunitiesFromStorage();
    const index = opportunities.findIndex(o => o.id === id);
    
    if (index === -1) {
      throw new Error('Opportunity not found');
    }
    
    const oldOpportunity = { ...opportunities[index] };
    opportunities[index] = {
      ...opportunities[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    localStorage.setItem('opportunities', JSON.stringify(opportunities));
    
    // Create audit log
    this.createAuditLogInStorage({
      action: 'UPDATE',
      entityType: 'opportunity',
      entityId: id,
      oldValues: oldOpportunity,
      newValues: opportunities[index],
      changes: updates,
      timestamp: new Date().toISOString(),
      user: this.getCurrentUser()
    });
    
    return opportunities[index];
  }

  // ===========================================
  // USERS
  // ===========================================
  
  async getUsers() {
    if (this.useApi) {
      try {
        const response = await fetch(`${this.baseUrl}/users`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Fetched users from API:', data.length);
        return data;
      } catch (error) {
        console.error('Error fetching users from API:', error);
        return this.getUsersFromStorage();
      }
    } else {
      return this.getUsersFromStorage();
    }
  }

  getUsersFromStorage() {
    const stored = localStorage.getItem('users');
    return stored ? JSON.parse(stored) : [];
  }

  async createUser(user) {
    if (this.useApi) {
      try {
        const response = await fetch(`${this.baseUrl}/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(user)
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const created = await response.json();
        console.log('Created user via API:', created.id);
        
        // Create audit log
        await this.createAuditLog({
          action: 'CREATE',
          entityType: 'user',
          entityId: created.id,
          changes: user,
          timestamp: new Date().toISOString(),
          user: this.getCurrentUser()
        });
        
        return created;
      } catch (error) {
        console.error('Error creating user via API:', error);
        return this.createUserInStorage(user);
      }
    } else {
      return this.createUserInStorage(user);
    }
  }

  createUserInStorage(user) {
    const users = this.getUsersFromStorage();
    const newUser = {
      id: this.generateId(),
      ...user,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    return newUser;
  }

  // ===========================================
  // AUDIT LOGS
  // ===========================================
  
  async getAuditLogs() {
    if (this.useApi) {
      try {
        // Note: GET might fail due to Azure issue, so fallback to storage
        const response = await fetch(`${this.baseUrl}/audit`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (!response.ok) {
          console.warn('Audit GET failed, using localStorage fallback');
          return this.getAuditLogsFromStorage();
        }
        
        const data = await response.json();
        console.log('Fetched audit logs from API:', data.length);
        return data;
      } catch (error) {
        console.error('Error fetching audit logs from API:', error);
        return this.getAuditLogsFromStorage();
      }
    } else {
      return this.getAuditLogsFromStorage();
    }
  }

  getAuditLogsFromStorage() {
    const stored = localStorage.getItem('auditLogs');
    return stored ? JSON.parse(stored) : [];
  }

  async createAuditLog(auditLog) {
    if (this.useApi) {
      try {
        const response = await fetch(`${this.baseUrl}/audit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(auditLog)
        });
        
        if (!response.ok) {
          console.warn('Audit POST failed, using localStorage fallback');
          return this.createAuditLogInStorage(auditLog);
        }
        
        const created = await response.json();
        console.log('Created audit log via API:', created.id);
        return created;
      } catch (error) {
        console.error('Error creating audit log via API:', error);
        return this.createAuditLogInStorage(auditLog);
      }
    } else {
      return this.createAuditLogInStorage(auditLog);
    }
  }

  createAuditLogInStorage(auditLog) {
    const auditLogs = this.getAuditLogsFromStorage();
    const newAuditLog = {
      id: this.generateId(),
      ...auditLog,
      createdAt: new Date().toISOString()
    };
    
    auditLogs.push(newAuditLog);
    localStorage.setItem('auditLogs', JSON.stringify(auditLogs));
    return newAuditLog;
  }

  // ===========================================
  // UTILITY METHODS
  // ===========================================
  
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  getCurrentUser() {
    // Get current user from your authentication system
    const session = localStorage.getItem('session');
    if (session) {
      const parsed = JSON.parse(session);
      return parsed.user?.name || 'Unknown User';
    }
    return 'System';
  }

  // ===========================================
  // DATA MIGRATION UTILITIES
  // ===========================================
  
  async migrateToApi() {
    if (!this.useApi) {
      console.warn('API mode not enabled, cannot migrate');
      return;
    }

    console.log('Starting data migration to API...');
    
    try {
      // Migrate opportunities
      const opportunities = this.getOpportunitiesFromStorage();
      console.log(`Migrating ${opportunities.length} opportunities...`);
      
      for (const opportunity of opportunities) {
        try {
          const { id, createdAt, updatedAt, ...data } = opportunity;
          await this.createOpportunity(data);
        } catch (error) {
          console.error(`Failed to migrate opportunity ${opportunity.id}:`, error);
        }
      }

      // Migrate users
      const users = this.getUsersFromStorage();
      console.log(`Migrating ${users.length} users...`);
      
      for (const user of users) {
        try {
          const { id, createdAt, updatedAt, ...data } = user;
          await this.createUser(data);
        } catch (error) {
          console.error(`Failed to migrate user ${user.id}:`, error);
        }
      }

      console.log('Migration completed!');
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  }

  // ===========================================
  // COMMENTS API METHODS
  // ===========================================

  async updateOpportunityComments(id, comments, updatedBy) {
    if (this.useApi) {
      try {
        const response = await fetch(`${this.baseUrl}/opportunities/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            comments,
            updated_by: updatedBy
          })
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const updated = await response.json();
        console.log('Updated opportunity comments via API:', id);
        
        // Also create audit log
        await this.createAuditLog({
          action: 'comment_update',
          entityType: 'opportunity',
          entityId: id,
          changes: { comments },
          timestamp: new Date().toISOString(),
          user: updatedBy
        });
        
        return updated;
      } catch (error) {
        console.error('Error updating comments via API:', error);
        // Fallback to localStorage
        return this.updateOpportunityCommentsInStorage(id, comments, updatedBy);
      }
    } else {
      return this.updateOpportunityCommentsInStorage(id, comments, updatedBy);
    }
  }

  updateOpportunityCommentsInStorage(id, comments, updatedBy) {
    const opportunities = this.getOpportunitiesFromStorage();
    const index = opportunities.findIndex(o => o.id === id);
    
    if (index === -1) {
      throw new Error('Opportunity not found');
    }
    
    const oldComments = opportunities[index].comments || '';
    opportunities[index] = {
      ...opportunities[index],
      comments,
      comments_last_updated: new Date().toISOString(),
      comments_last_updated_by: updatedBy,
      updatedAt: new Date().toISOString()
    };
    
    localStorage.setItem('opportunities', JSON.stringify(opportunities));
    
    // Create audit log
    this.createAuditLogInStorage({
      action: 'comment_update',
      entityType: 'opportunity',
      entityId: id,
      oldValues: { comments: oldComments },
      newValues: { comments },
      changes: { comments },
      timestamp: new Date().toISOString(),
      user: updatedBy
    });
    
    return opportunities[index];
  }

  // Environment switching
  switchToApi() {
    this.useApi = true;
    console.log('Switched to API mode');
  }

  switchToLocalStorage() {
    this.useApi = false;
    console.log('Switched to localStorage mode');
  }
}

// Create singleton instance
const dataService = new DataService();

// Make it globally available for console testing
if (typeof window !== 'undefined') {
  window.dataService = dataService;
}

export default dataService;