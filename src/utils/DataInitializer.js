import { SAMPLE_USERS, SAMPLE_OPPORTUNITIES } from './constants';

class DataInitializer {
  static async initialize() {
    try {
      // Initialize users if none exist
      if (!this.hasData('users')) {
        this.initializeUsers();
        console.log('✅ Sample users initialized');
      }

      // Initialize opportunities if none exist
      if (!this.hasData('opportunities')) {
        this.initializeOpportunities();
        console.log('✅ Sample opportunities initialized');
      }

      // Initialize other required data
      this.initializeSystemData();

      console.log('🚀 Application data initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize application data:', error);
      throw new Error(`Data initialization failed: ${error.message}`);
    }
  }

  static hasData(key) {
    try {
      const data = localStorage.getItem(key);
      return data && JSON.parse(data).length > 0;
    } catch (error) {
      console.warn(`Error checking data for ${key}:`, error);
      return false;
    }
  }

  static initializeUsers() {
    const users = SAMPLE_USERS.map(user => ({
      ...user,
      active: true,
      created_date: new Date().toISOString(),
      created_by: 'system',
      last_login: null,
      login_count: 0
    }));

    localStorage.setItem('users', JSON.stringify(users));
  }

  static initializeOpportunities() {
    const opportunities = SAMPLE_OPPORTUNITIES.map(opp => ({
      ...opp,
      audit_trail: opp.audit_trail || [
        {
          timestamp: opp.created_date,
          user: opp.specialist,
          action: 'create',
          field: null,
          old_value: null,
          new_value: null
        }
      ]
    }));

    localStorage.setItem('opportunities', JSON.stringify(opportunities));
  }

  static initializeSystemData() {
    // Initialize saved filters if none exist
    if (!localStorage.getItem('savedFilters')) {
      const defaultFilters = [
        {
          id: Date.now(),
          name: 'High Value Opportunities',
          filters: [
            { field: 'aop_value', operator: 'greater_than', value: '500000', id: Date.now() }
          ]
        },
        {
          id: Date.now() + 1,
          name: 'Healthcare Opportunities',
          filters: [
            { field: 'industry', operator: 'contains', value: 'Healthcare', id: Date.now() + 1 }
          ]
        }
      ];
      localStorage.setItem('savedFilters', JSON.stringify(defaultFilters));
    }

    // Initialize application settings
    if (!localStorage.getItem('appSettings')) {
      const defaultSettings = {
        theme: 'light',
        dateFormat: 'MM/dd/yyyy',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        notifications: {
          emailNotifications: true,
          pushNotifications: false,
          auditTrailEmails: false
        },
        defaultView: 'dashboard',
        itemsPerPage: 25
      };
      localStorage.setItem('appSettings', JSON.stringify(defaultSettings));
    }

    // Initialize error logs array
    if (!localStorage.getItem('errorLogs')) {
      localStorage.setItem('errorLogs', JSON.stringify([]));
    }

    // Initialize performance metrics
    if (!localStorage.getItem('performanceMetrics')) {
      const metrics = {
        lastInitialized: new Date().toISOString(),
        loadTimes: [],
        errorCount: 0,
        sessionCount: 0
      };
      localStorage.setItem('performanceMetrics', JSON.stringify(metrics));
    }
  }

  static async reset() {
    const confirmed = window.confirm(
      'This will delete all data and reset the application to its initial state. Are you sure?'
    );

    if (!confirmed) {
      return false;
    }

    try {
      // Clear all application data
      const keysToRemove = [
        'users',
        'opportunities', 
        'currentUser',
        'savedFilters',
        'appSettings',
        'errorLogs',
        'performanceMetrics'
      ];

      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });

      // Reinitialize with fresh data
      await this.initialize();
      
      console.log('🔄 Application data reset successfully');
      alert('Application has been reset successfully. Please reload the page.');
      
      return true;
    } catch (error) {
      console.error('❌ Failed to reset application:', error);
      throw new Error(`Reset failed: ${error.message}`);
    }
  }

  static exportData() {
    try {
      const data = {
        users: JSON.parse(localStorage.getItem('users') || '[]'),
        opportunities: JSON.parse(localStorage.getItem('opportunities') || '[]'),
        savedFilters: JSON.parse(localStorage.getItem('savedFilters') || '[]'),
        appSettings: JSON.parse(localStorage.getItem('appSettings') || '{}'),
        exportDate: new Date().toISOString(),
        version: '1.0.0'
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { 
        type: 'application/json' 
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sales-opportunities-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return true;
    } catch (error) {
      console.error('❌ Failed to export data:', error);
      throw new Error(`Export failed: ${error.message}`);
    }
  }

  static async importData(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        try {
          const data = JSON.parse(event.target.result);
          
          // Validate data structure
          if (!data.users || !data.opportunities) {
            throw new Error('Invalid backup file format');
          }

          // Confirm import
          const confirmed = window.confirm(
            'This will replace all current data with the imported data. Are you sure?'
          );

          if (!confirmed) {
            resolve(false);
            return;
          }

          // Import data
          localStorage.setItem('users', JSON.stringify(data.users));
          localStorage.setItem('opportunities', JSON.stringify(data.opportunities));
          
          if (data.savedFilters) {
            localStorage.setItem('savedFilters', JSON.stringify(data.savedFilters));
          }
          
          if (data.appSettings) {
            localStorage.setItem('appSettings', JSON.stringify(data.appSettings));
          }

          console.log('📥 Data imported successfully');
          alert('Data imported successfully. Please reload the page.');
          resolve(true);
        } catch (error) {
          console.error('❌ Failed to import data:', error);
          reject(new Error(`Import failed: ${error.message}`));
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsText(file);
    });
  }

  static getSystemInfo() {
    return {
      dataInitialized: new Date().toISOString(),
      userCount: this.getDataCount('users'),
      opportunityCount: this.getDataCount('opportunities'),
      savedFilterCount: this.getDataCount('savedFilters'),
      errorLogCount: this.getDataCount('errorLogs'),
      storageUsed: this.getStorageUsage(),
      version: '1.0.0',
      browser: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language
    };
  }

  static getDataCount(key) {
    try {
      const data = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(data) ? data.length : 0;
    } catch (error) {
      return 0;
    }
  }

  static getStorageUsage() {
    let totalSize = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        totalSize += localStorage[key].length;
      }
    }
    return `${(totalSize / 1024).toFixed(2)} KB`;
  }
}

export default DataInitializer;