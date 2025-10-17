import React, { useState, useEffect } from 'react';
import { User, Lock, AlertCircle, UserPlus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const LoginScreen = () => {
  const { login } = useAuth();
  const [activeTab, setActiveTab] = useState('login');
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  const [registerData, setRegisterData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Initialize demo users including Scott as admin
  useEffect(() => {
    initializeDemoUsers();
  }, []);

  const initializeDemoUsers = () => {
    console.log('🚀 Initializing demo users...');
    
    const existingUsers = localStorage.getItem('users');
    console.log('📦 Existing users in storage:', existingUsers);
    
    if (!existingUsers) {
      console.log('✨ Creating fresh demo users');
      const demoUsers = [
        { 
          id: '1', 
          name: 'Scott Campagna', 
          email: 'scott.campagna@nttdata.com', 
          password: 'demo', // Store the password explicitly
          role: 'Admin',
          active: true,
          approved: true,
          pending_approval: false,
          created_date: new Date().toISOString(),
          last_login: null,
          login_count: 0
        },
        { 
          id: '2', 
          name: 'Sarah Johnson', 
          email: 'sarah.johnson@nttdata.com', 
          password: 'demo',
          role: 'GTMLead',
          active: true,
          approved: true,
          pending_approval: false,
          created_date: new Date().toISOString(),
          last_login: null,
          login_count: 0
        },
        { 
          id: '3', 
          name: 'Mike Chen', 
          email: 'mike.chen@nttdata.com', 
          password: 'demo',
          role: 'GTM',
          active: true,
          approved: true,
          pending_approval: false,
          created_date: new Date().toISOString(),
          last_login: null,
          login_count: 0
        },
        { 
          id: '4', 
          name: 'Lisa Rodriguez', 
          email: 'lisa.rodriguez@nttdata.com', 
          password: 'demo',
          role: 'PracticeLead',
          active: true,
          approved: true,
          pending_approval: false,
          created_date: new Date().toISOString(),
          last_login: null,
          login_count: 0
        },
        { 
          id: '5', 
          name: 'David Kim', 
          email: 'david.kim@nttdata.com', 
          password: 'demo',
          role: 'POC',
          active: true,
          approved: true,
          pending_approval: false,
          created_date: new Date().toISOString(),
          last_login: null,
          login_count: 0
        }
      ];
      
      localStorage.setItem('users', JSON.stringify(demoUsers));
      console.log('💾 Demo users saved to localStorage:', demoUsers);
    } else {
      console.log('👥 Users already exist in storage');
      const users = JSON.parse(existingUsers);
      console.log('📋 Current users:', users.map(u => ({ email: u.email, role: u.role, approved: u.approved, active: u.active })));
    }
  };

  const handleLoginChange = (field, value) => {
    setLoginData(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  const handleRegisterChange = (field, value) => {
    setRegisterData(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    console.log('🔐 Attempting login with:', { email: loginData.email, password: loginData.password });

    try {
      const success = await login(loginData.email, loginData.password);
      if (!success) {
        setError('Invalid email or password. Please check your credentials and try again.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validation
      if (!registerData.firstName.trim() || !registerData.lastName.trim()) {
        setError('First and last name are required');
        return;
      }

      if (!registerData.email.includes('@nttdata.com')) {
        setError('Email must be an @nttdata.com address');
        return;
      }

      if (registerData.password.length < 4) {
        setError('Password must be at least 4 characters');
        return;
      }

      if (registerData.password !== registerData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      // Check if user already exists
      const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
      const userExists = existingUsers.find(u => u.email.toLowerCase() === registerData.email.toLowerCase());
      
      if (userExists) {
        setError('An account with this email already exists');
        return;
      }

      // Create new user (pending approval)
      const newUser = {
        id: Date.now().toString(),
        name: `${registerData.firstName.trim()} ${registerData.lastName.trim()}`,
        email: registerData.email.toLowerCase(),
        password: registerData.password, // Store password for demo purposes
        role: null, // Will be assigned by admin
        active: false, // Inactive until approved by admin
        approved: false,
        pending_approval: true,
        created_date: new Date().toISOString(),
        last_login: null,
        login_count: 0
      };

      const updatedUsers = [...existingUsers, newUser];
      localStorage.setItem('users', JSON.stringify(updatedUsers));

      setSuccess('Registration successful! Your account is pending admin approval. You will receive access once an administrator assigns your role.');
      
      // Clear form
      setRegisterData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: ''
      });

    } catch (err) {
      console.error('Registration error:', err);
      setError('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = (role) => {
    const demoUsers = {
      admin: { email: 'scott.campagna@nttdata.com', password: 'demo' },
      gtm: { email: 'sarah.johnson@nttdata.com', password: 'demo' },
      poc: { email: 'david.kim@nttdata.com', password: 'demo' }
    };
    
    const user = demoUsers[role];
    setLoginData(user);
    
    // Automatically try to login
    setTimeout(() => {
      console.log('🎯 Auto-login attempt for demo user:', user);
      login(user.email, user.password);
    }, 100);
  };

  const debugLocalStorage = () => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    console.log('🐛 DEBUG - Current users in localStorage:', users);
    alert(`Users in storage: ${users.length}\n${users.map(u => `${u.email} (${u.role})`).join('\n')}`);
  };

  return (
    <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center p-4">
      <div className="card shadow-lg" style={{maxWidth: 450, width: '100%'}}>
        {/* Tab Headers */}
        <div className="card-header bg-white border-bottom">
          <nav>
            <div className="nav nav-tabs card-header-tabs" role="tablist">
              <button
                className={`nav-link ${activeTab === 'login' ? 'active' : ''}`}
                onClick={() => setActiveTab('login')}
                type="button"
              >
                <User size={16} className="me-1" />
                Sign In
              </button>
              <button
                className={`nav-link ${activeTab === 'register' ? 'active' : ''}`}
                onClick={() => setActiveTab('register')}
                type="button"
              >
                <UserPlus size={16} className="me-1" />
                Register
              </button>
            </div>
          </nav>
        </div>

        <div className="card-body p-4">
          {/* Login Tab */}
          {activeTab === 'login' && (
            <>
              <div className="text-center mb-4">
                <div className="mx-auto rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center mb-3" style={{width: 64, height: 64}}>
                  <User className="text-primary" size={32} />
                </div>
                <h1 className="h4 fw-bold text-dark">Welcome Back</h1>
                <p className="text-muted mt-1 mb-0">Sign in to your sales dashboard</p>
              </div>

              {error && (
                <div className="alert alert-danger d-flex align-items-center py-2 mb-3" role="alert">
                  <AlertCircle className="me-2" size={18} />
                  <span className="small">{error}</span>
                </div>
              )}

              <form onSubmit={handleLogin}>
                <div className="mb-3">
                  <label className="form-label small">Email Address</label>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0">
                      <User className="text-secondary" size={16} />
                    </span>
                    <input
                      type="email"
                      value={loginData.email}
                      onChange={(e) => handleLoginChange('email', e.target.value)}
                      className="form-control border-start-0"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label small">Password</label>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0">
                      <Lock className="text-secondary" size={16} />
                    </span>
                    <input
                      type="password"
                      value={loginData.password}
                      onChange={(e) => handleLoginChange('password', e.target.value)}
                      className="form-control border-start-0"
                      placeholder="Enter your password"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary w-100 fw-medium mb-3"
                >
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>

              <div className="border-top pt-3">
                <div className="small text-muted text-center mb-2">Demo Accounts:</div>
                <div className="d-flex gap-2 justify-content-center mb-3">
                  <button
                    onClick={() => handleDemoLogin('admin')}
                    className="btn btn-outline-danger btn-sm px-2"
                  >
                    Admin
                  </button>
                  <button
                    onClick={() => handleDemoLogin('gtm')}
                    className="btn btn-outline-success btn-sm px-2"
                  >
                    GTM Lead
                  </button>
                  <button
                    onClick={() => handleDemoLogin('poc')}
                    className="btn btn-outline-primary btn-sm px-2"
                  >
                    POC
                  </button>
                </div>
                <div className="text-center">
                  <button 
                    onClick={debugLocalStorage}
                    className="btn btn-link btn-sm text-muted"
                  >
                    Debug Storage
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Register Tab */}
          {activeTab === 'register' && (
            <>
              <div className="text-center mb-4">
                <div className="mx-auto rounded-circle bg-success bg-opacity-10 d-flex align-items-center justify-content-center mb-3" style={{width: 64, height: 64}}>
                  <UserPlus className="text-success" size={32} />
                </div>
                <h1 className="h4 fw-bold text-dark">Join the Team</h1>
                <p className="text-muted mt-1 mb-0">Create your NTT DATA account</p>
              </div>

              {error && (
                <div className="alert alert-danger d-flex align-items-center py-2 mb-3" role="alert">
                  <AlertCircle className="me-2" size={18} />
                  <span className="small">{error}</span>
                </div>
              )}

              {success && (
                <div className="alert alert-success py-2 mb-3" role="alert">
                  <div className="small">{success}</div>
                </div>
              )}

              <form onSubmit={handleRegister}>
                <div className="row mb-3">
                  <div className="col-6">
                    <label className="form-label small">First Name</label>
                    <input
                      type="text"
                      value={registerData.firstName}
                      onChange={(e) => handleRegisterChange('firstName', e.target.value)}
                      className="form-control"
                      placeholder="First name"
                      required
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label small">Last Name</label>
                    <input
                      type="text"
                      value={registerData.lastName}
                      onChange={(e) => handleRegisterChange('lastName', e.target.value)}
                      className="form-control"
                      placeholder="Last name"
                      required
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label small">Email Address</label>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0">
                      <User className="text-secondary" size={16} />
                    </span>
                    <input
                      type="email"
                      value={registerData.email}
                      onChange={(e) => handleRegisterChange('email', e.target.value)}
                      className="form-control border-start-0"
                      placeholder="yourname@nttdata.com"
                      required
                    />
                  </div>
                  <div className="form-text">Must be an @nttdata.com email address</div>
                </div>

                <div className="mb-3">
                  <label className="form-label small">Password</label>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0">
                      <Lock className="text-secondary" size={16} />
                    </span>
                    <input
                      type="password"
                      value={registerData.password}
                      onChange={(e) => handleRegisterChange('password', e.target.value)}
                      className="form-control border-start-0"
                      placeholder="Create a password"
                      required
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label small">Confirm Password</label>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0">
                      <Lock className="text-secondary" size={16} />
                    </span>
                    <input
                      type="password"
                      value={registerData.confirmPassword}
                      onChange={(e) => handleRegisterChange('confirmPassword', e.target.value)}
                      className="form-control border-start-0"
                      placeholder="Confirm your password"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-success w-100 fw-medium"
                >
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </button>
              </form>

              <div className="mt-3 small text-muted text-center">
                After registration, an administrator will assign your role and activate your account.
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;