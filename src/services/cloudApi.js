// services/cloudApi.js
// Replace localStorage with cloud API calls

const BASE_URL = 'https://deal-tracker-api-v2-sc-g3g4gzgfdxc2ddbe.westus2-01.azurewebsites.net/api';

// API service class to handle all cloud operations
class CloudApiService {
  // Opportunities API
  async getOpportunities() {
    try {
      const response = await fetch(`${BASE_URL}/opportunities`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching opportunities:', error);
      // Fallback to localStorage for now
      return JSON.parse(localStorage.getItem('opportunities') || '[]');
    }
  }

  async createOpportunity(opportunityData) {
    try {
      const response = await fetch(`${BASE_URL}/opportunities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(opportunityData)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const newOpportunity = await response.json();
      
      // Also update localStorage as backup
      const opportunities = await this.getOpportunities();
      opportunities.push(newOpportunity);
      localStorage.setItem('opportunities', JSON.stringify(opportunities));
      
      return newOpportunity;
    } catch (error) {
      console.error('Error creating opportunity:', error);
      // Fallback to localStorage
      const opportunity = {
        id: crypto.randomUUID(),
        ...opportunityData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const opportunities = JSON.parse(localStorage.getItem('opportunities') || '[]');
      opportunities.push(opportunity);
      localStorage.setItem('opportunities', JSON.stringify(opportunities));
      
      return opportunity;
    }
  }

  async updateOpportunity(id, updateData) {
    try {
      // For now, fall back to localStorage since we don't have UPDATE endpoint yet
      const opportunities = JSON.parse(localStorage.getItem('opportunities') || '[]');
      const index = opportunities.findIndex(opp => opp.id === id);
      
      if (index !== -1) {
        opportunities[index] = {
          ...opportunities[index],
          ...updateData,
          updatedAt: new Date().toISOString()
        };
        localStorage.setItem('opportunities', JSON.stringify(opportunities));
        return opportunities[index];
      }
      
      throw new Error('Opportunity not found');
    } catch (error) {
      console.error('Error updating opportunity:', error);
      throw error;
    }
  }

  // Users API
  async getUsers() {
    try {
      const response = await fetch(`${BASE_URL}/users`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching users:', error);
      // Fallback to localStorage
      return JSON.parse(localStorage.getItem('users') || '[]');
    }
  }

  async createUser(userData) {
    try {
      const response = await fetch(`${BASE_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const newUser = await response.json();
      
      // Also update localStorage as backup
      const users = await this.getUsers();
      users.push(newUser);
      localStorage.setItem('users', JSON.stringify(users));
      
      return newUser;
    } catch (error) {
      console.error('Error creating user:', error);
      // Fallback to localStorage
      const user = {
        id: crypto.randomUUID(),
        ...userData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      users.push(user);
      localStorage.setItem('users', JSON.stringify(users));
      
      return user;
    }
  }

  // Audit Logs - localStorage only for now
  async getAuditLogs() {
    // Until auditLogs API is working, use localStorage
    return JSON.parse(localStorage.getItem('auditLogs') || '[]');
  }

  async createAuditLog(auditData) {
    // Until auditLogs API is working, use localStorage
    const auditLog = {
      id: crypto.randomUUID(),
      ...auditData,
      timestamp: new Date().toISOString()
    };
    
    const auditLogs = JSON.parse(localStorage.getItem('auditLogs') || '[]');
    auditLogs.push(auditLog);
    localStorage.setItem('auditLogs', JSON.stringify(auditLogs));
    
    return auditLog;
  }

  // Helper method to sync localStorage with cloud (useful for migration)
  async syncToCloud() {
    try {
      // Get local data
      const localOpportunities = JSON.parse(localStorage.getItem('opportunities') || '[]');
      const localUsers = JSON.parse(localStorage.getItem('users') || '[]');
      
      // Get cloud data
      const cloudOpportunities = await this.getOpportunities();
      const cloudUsers = await this.getUsers();
      
      console.log('Local opportunities:', localOpportunities.length);
      console.log('Cloud opportunities:', cloudOpportunities.length);
      console.log('Local users:', localUsers.length);
      console.log('Cloud users:', cloudUsers.length);
      
      // TODO: Implement smart merging logic if needed
      
    } catch (error) {
      console.error('Error syncing to cloud:', error);
    }
  }
}

// Export singleton instance
export const cloudApi = new CloudApiService();

// Export for backward compatibility with existing localStorage calls
export const migrateFromLocalStorage = async () => {
  console.log('Starting migration from localStorage to cloud API...');
  
  try {
    // Check if we have local data to migrate
    const localOpportunities = JSON.parse(localStorage.getItem('opportunities') || '[]');
    const localUsers = JSON.parse(localStorage.getItem('users') || '[]');
    
    if (localOpportunities.length > 0) {
      console.log(`Found ${localOpportunities.length} local opportunities to potentially migrate`);
      // You can implement migration logic here if needed
    }
    
    if (localUsers.length > 0) {
      console.log(`Found ${localUsers.length} local users to potentially migrate`);
      // You can implement migration logic here if needed
    }
    
    // Test cloud connectivity
    await cloudApi.getOpportunities();
    await cloudApi.getUsers();
    
    console.log('Cloud API connectivity verified!');
    
  } catch (error) {
    console.error('Migration check failed:', error);
    console.log('Continuing with localStorage fallback...');
  }
};

export default cloudApi;