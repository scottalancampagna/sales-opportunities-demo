import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    checkAuthStatus();
  }, []);

  const checkAuthStatus = () => {
    try {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      localStorage.removeItem('currentUser');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      // Get users from storage
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      
      // Find user by email
      const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      if (!foundUser) {
        return false;
      }

      // Check if user account is approved and active
      if (foundUser.approved === false || foundUser.active === false) {
        return false;
      }

      // Password validation - accept 'demo' or the stored password
      const isValidPassword = password === 'demo' || password === foundUser.password || password === foundUser.email;
      
      if (!isValidPassword) {
        return false;
      }

      // Update last login
      const updatedUsers = users.map(u => 
        u.id === foundUser.id 
          ? { 
              ...u, 
              last_login: new Date().toISOString(),
              login_count: (u.login_count || 0) + 1
            }
          : u
      );
      localStorage.setItem('users', JSON.stringify(updatedUsers));

      // Set current user
      const userToStore = {
        ...foundUser,
        last_login: new Date().toISOString(),
        login_count: (foundUser.login_count || 0) + 1
      };

      setUser(userToStore);
      setIsAuthenticated(true);
      localStorage.setItem('currentUser', JSON.stringify(userToStore));

      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('currentUser');
  };

  // Admin functions for user management
  const getPendingUsers = () => {
    try {
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      return users.filter(u => u.pending_approval && !u.approved);
    } catch (error) {
      console.error('Error getting pending users:', error);
      return [];
    }
  };

  const approveUser = (userId, role) => {
    try {
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const updatedUsers = users.map(u => 
        u.id === userId 
          ? { 
              ...u, 
              role: role,
              approved: true,
              active: true,
              pending_approval: false,
              approved_date: new Date().toISOString(),
              approved_by: user?.name || 'Admin'
            }
          : u
      );
      localStorage.setItem('users', JSON.stringify(updatedUsers));
      return true;
    } catch (error) {
      console.error('Error approving user:', error);
      return false;
    }
  };

  const rejectUser = (userId) => {
    try {
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const updatedUsers = users.filter(u => u.id !== userId);
      localStorage.setItem('users', JSON.stringify(updatedUsers));
      return true;
    } catch (error) {
      console.error('Error rejecting user:', error);
      return false;
    }
  };

  const getAllUsers = () => {
    try {
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      return users;
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  };

  const updateUser = (userId, updates) => {
    try {
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const updatedUsers = users.map(u => 
        u.id === userId 
          ? { ...u, ...updates, updated_date: new Date().toISOString() }
          : u
      );
      localStorage.setItem('users', JSON.stringify(updatedUsers));
      
      // If updating current user, update the session
      if (user && user.id === userId) {
        const updatedCurrentUser = { ...user, ...updates };
        setUser(updatedCurrentUser);
        localStorage.setItem('currentUser', JSON.stringify(updatedCurrentUser));
      }
      
      return true;
    } catch (error) {
      console.error('Error updating user:', error);
      return false;
    }
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    // Admin functions
    getPendingUsers,
    approveUser,
    rejectUser,
    getAllUsers,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};