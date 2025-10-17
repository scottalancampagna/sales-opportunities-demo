// src/services/DataService.js
// This should replace or update your existing DataService

class DataService {
  constructor() {
    this.STORAGE_KEYS = {
      USERS: 'sales_users',
      OPPORTUNITIES: 'sales_opportunities',
      CURRENT_USER: 'sales_current_user',
      AUDIT_TRAIL: 'sales_audit_trail'
    };
    
    // Initialize data on service creation
    this.initialize();
  }

  initialize() {
    try {
      // Check if this is the first time running the app
      if (!this.isInitialized()) {
        console.log('🔄 Initializing Sales Opportunities App with sample data...');
        this.loadSampleData();
        this.markAsInitialized();
        console.log('✅ Sample data loaded successfully');
      } else {
        console.log('✅ App already initialized with data');
      }
    } catch (error) {
      console.error('❌ Error during initialization:', error);
      // If there's an error, force reload sample data
      this.loadSampleData();
    }
  }

  isInitialized() {
    // Check if we have users and they're properly formatted
    try {
      const users = this.getUsers();
      return users && Array.isArray(users) && users.length > 0;
    } catch {
      return false;
    }
  }

  markAsInitialized() {
    localStorage.setItem('sales_app_initialized', 'true');
  }

  loadSampleData() {
    // Sample users
    const sampleUsers = [
      {
        id: '1',
        name: 'Scott Campagna',
        email: 'scott.campagna@nttdata.com',
        password: 'demo',
        role: 'Admin',
        status: 'approved',
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        name: 'Sarah Johnson',
        email: 'sarah.johnson@nttdata.com',
        password: 'demo',
        role: 'GTMLead',
        status: 'approved',
        createdAt: new Date().toISOString()
      },
      {
        id: '3',
        name: 'David Kim',
        email: 'david.kim@nttdata.com',
        password: 'demo',
        role: 'POC',
        status: 'approved',
        createdAt: new Date().toISOString()
      },
      {
        id: '4',
        name: 'Lisa Chen',
        email: 'lisa.chen@nttdata.com',
        password: 'demo',
        role: 'GTM',
        status: 'approved',
        createdAt: new Date().toISOString()
      },
      {
        id: '5',
        name: 'Mark Taylor',
        email: 'mark.taylor@nttdata.com',
        password: 'demo',
        role: 'PracticeLead',
        status: 'approved',
        createdAt: new Date().toISOString()
      }
    ];

    // Sample opportunities
    const sampleOpportunities = [
      {
        id: '1',
        specialist: 'Scott Campagna',
        clientAsk: 'Digital transformation strategy for retail platform',
        needs: 'Cloud migration and modernization of legacy systems',
        whyLaunch: 'Client has legacy systems limiting growth and customer experience',
        sfdcId: 'OPP-001',
        stage: 'New',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
        updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(), // 1 day ago
        pocFields: {},
        auditTrail: [
          {
            id: '1',
            timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
            user: 'Scott Campagna',
            action: 'create',
            details: 'Opportunity created'
          }
        ]
      },
      {
        id: '2',
        specialist: 'Sarah Johnson',
        clientAsk: 'AI-powered customer analytics platform',
        needs: 'Machine learning implementation for customer insights',
        whyLaunch: 'Competitive advantage through data-driven customer understanding',
        sfdcId: 'OPP-002',
        stage: 'Intake',
        createdAt: new Date(Date.now() - 86400000 * 5).toISOString(), // 5 days ago
        updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(), // 1 day ago
        pocFields: {
          solution: 'Azure ML + Power BI integration',
          tech: 'Python, TensorFlow, Azure ML',
          design: 'Modern analytics dashboard with real-time insights',
          strategy: 'Phased rollout approach with pilot program',
          delivery: '12-week implementation timeline'
        },
        auditTrail: [
          {
            id: '1',
            timestamp: new Date(Date.now() - 86400000 * 5).toISOString(),
            user: 'Sarah Johnson',
            action: 'create',
            details: 'Opportunity created'
          },
          {
            id: '2',
            timestamp: new Date(Date.now() - 86400000 * 3).toISOString(),
            user: 'Sarah Johnson',
            action: 'stage_change',
            details: 'Stage changed from New to Intake'
          }
        ]
      },
      {
        id: '3',
        specialist: 'David Kim',
        clientAsk: 'Microservices architecture migration',
        needs: 'Legacy monolith to microservices transformation',
        whyLaunch: 'Scalability and maintainability requirements for growth',
        sfdcId: 'OPP-003',
        stage: 'In Research',
        createdAt: new Date(Date.now() - 86400000 * 7).toISOString(), // 7 days ago
        updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
        pocFields: {
          solution: 'Container-based microservices with Kubernetes',
          tech: 'Docker, Kubernetes, .NET Core',
          design: 'API-first architecture with event-driven communication',
          strategy: 'Strangler fig pattern for gradual migration',
          delivery: '16-week phased migration plan'
        },
        auditTrail: [
          {
            id: '1',
            timestamp: new Date(Date.now() - 86400000 * 7).toISOString(),
            user: 'David Kim',
            action: 'create',
            details: 'Opportunity created'
          },
          {
            id: '2',
            timestamp: new Date(Date.now() - 86400000 * 5).toISOString(),
            user: 'Sarah Johnson',
            action: 'stage_change',
            details: 'Stage changed from New to Intake'
          },
          {
            id: '3',
            timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
            user: 'Sarah Johnson',
            action: 'stage_change',
            details: 'Stage changed from Intake to In Research'
          }
        ]
      }
    ];

    // Store the sample data
    try {
      localStorage.setItem(this.STORAGE_KEYS.USERS, JSON.stringify(sampleUsers));
      localStorage.setItem(this.STORAGE_KEYS.OPPORTUNITIES, JSON.stringify(sampleOpportunities));
      localStorage.setItem(this.STORAGE_KEYS.AUDIT_TRAIL, JSON.stringify([]));
      
      console.log('✅ Sample data stored successfully');
      console.log('Demo login credentials available:');
      sampleUsers.forEach(user => {
        console.log(`- ${user.email} / ${user.password} (${user.role})`);
      });
    } catch (error) {
      console.error('❌ Error storing sample data:', error);
    }
  }

  // User methods
  getUsers() {
    try {
      const users = localStorage.getItem(this.STORAGE_KEYS.USERS);
      return users ? JSON.parse(users) : [];
    } catch (error) {
      console.error('Error getting users:', error);
      return [];
    }
  }

  authenticateUser(email, password) {
    try {
      const users = this.getUsers();
      const user = users.find(u => u.email === email && u.password === password && u.status === 'approved');
      
      if (user) {
        // Store current user
        localStorage.setItem(this.STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
        console.log(`✅ User authenticated: ${user.name} (${user.role})`);
        return user;
      } else {
        console.log(`❌ Authentication failed for: ${email}`);
        return null;
      }
    } catch (error) {
      console.error('Error authenticating user:', error);
      return null;
    }
  }

  getCurrentUser() {
    try {
      const user = localStorage.getItem(this.STORAGE_KEYS.CURRENT_USER);
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  logout() {
    localStorage.removeItem(this.STORAGE_KEYS.CURRENT_USER);
    console.log('✅ User logged out');
  }

  // Opportunity methods
  getOpportunities() {
    try {
      const opportunities = localStorage.getItem(this.STORAGE_KEYS.OPPORTUNITIES);
      return opportunities ? JSON.parse(opportunities) : [];
    } catch (error) {
      console.error('Error getting opportunities:', error);
      return [];
    }
  }

  saveOpportunity(opportunity) {
    try {
      const opportunities = this.getOpportunities();
      const existingIndex = opportunities.findIndex(o => o.id === opportunity.id);
      
      if (existingIndex >= 0) {
        opportunities[existingIndex] = { ...opportunity, updatedAt: new Date().toISOString() };
      } else {
        const newOpportunity = {
          ...opportunity,
          id: opportunity.id || Date.now().toString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        opportunities.push(newOpportunity);
      }
      
      localStorage.setItem(this.STORAGE_KEYS.OPPORTUNITIES, JSON.stringify(opportunities));
      return true;
    } catch (error) {
      console.error('Error saving opportunity:', error);
      return false;
    }
  }

  // Audit trail methods
  addAuditEntry(opportunityId, action, details, oldValue = null, newValue = null) {
    try {
      const currentUser = this.getCurrentUser();
      if (!currentUser) return;

      const opportunities = this.getOpportunities();
      const opportunityIndex = opportunities.findIndex(o => o.id === opportunityId);
      
      if (opportunityIndex >= 0) {
        const auditEntry = {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          user: currentUser.name,
          action,
          details,
          oldValue,
          newValue
        };

        if (!opportunities[opportunityIndex].auditTrail) {
          opportunities[opportunityIndex].auditTrail = [];
        }
        
        opportunities[opportunityIndex].auditTrail.push(auditEntry);
        localStorage.setItem(this.STORAGE_KEYS.OPPORTUNITIES, JSON.stringify(opportunities));
        
        console.log(`✅ Audit entry added: ${action} by ${currentUser.name}`);
      }
    } catch (error) {
      console.error('Error adding audit entry:', error);
    }
  }

  // Reset method for development/testing
  reset() {
    const confirmed = window.confirm(
      'This will delete all data and reset the application. Are you sure?'
    );
    
    if (confirmed) {
      localStorage.clear();
      this.initialize();
      window.location.reload();
    }
  }
}

// Create and export singleton instance
const dataService = new DataService();
export default dataService;