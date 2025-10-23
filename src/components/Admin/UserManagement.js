import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Download, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { canManageUsers } from '../../utils/permissions';
import { USER_ROLES } from '../../utils/constants';

const UserManagement = () => {
  const { user, getPendingUsers, approveUser, rejectUser, getAllUsers } = useAuth();
  const [users, setUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [activeTab, setActiveTab] = useState('users');
  const [confirmReject, setConfirmReject] = useState({ show: false, userId: null });

  // Redirect if not admin
  useEffect(() => {
    if (!canManageUsers(user)) {
      window.location.hash = '#/dashboard';
      return;
    }
  }, [user]);

  // Load users and pending users
  useEffect(() => {
    loadUsers();
    loadPendingUsers();
  }, []);

  // Filter users based on search and filters
  useEffect(() => {
    let filtered = [...users];

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(u => 
        u.name?.toLowerCase().includes(search) ||
        u.email?.toLowerCase().includes(search) ||
        u.role?.toLowerCase().includes(search)
      );
    }

    // Role filter
    if (selectedRole !== 'all') {
      filtered = filtered.filter(u => u.role === selectedRole);
    }

    // Status filter
    if (selectedStatus !== 'all') {
      const isActive = selectedStatus === 'active';
      filtered = filtered.filter(u => (u.active !== false) === isActive);
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, selectedRole, selectedStatus]);

  const loadUsers = () => {
    const allUsers = getAllUsers();
    // Only show approved users in the main users tab
    setUsers(allUsers.filter(u => u.approved !== false));
  };

  const loadPendingUsers = () => {
    const pending = getPendingUsers();
    setPendingUsers(pending);
  };

  const handleApproveUser = (userId, role) => {
    const success = approveUser(userId, role);
    if (success) {
      loadUsers();
      loadPendingUsers();
    }
  };

  const handleRejectUser = (userId) => {
    setConfirmReject({ show: true, userId });
  };

  const confirmRejectUser = () => {
    const success = rejectUser(confirmReject.userId);
    if (success) {
      loadPendingUsers();
    }
    setConfirmReject({ show: false, userId: null });
  };

  const cancelRejectUser = () => {
    setConfirmReject({ show: false, userId: null });
  };

  const handleToggleUserStatus = (userId) => {
    const allUsers = getAllUsers();
    const updatedUsers = allUsers.map(u => 
      u.id === userId 
        ? { 
            ...u, 
            active: !u.active,
            updated_date: new Date().toISOString(),
            updated_by: user.name
          }
        : u
    );
    localStorage.setItem('users', JSON.stringify(updatedUsers));
    loadUsers();
  };

  const handleExportUsers = () => {
    const headers = ['Name', 'Email', 'Role', 'Status', 'Created Date', 'Last Login'];
    const csvData = filteredUsers.map(u => [
      u.name,
      u.email,
      u.role,
      u.active !== false ? 'Active' : 'Inactive',
      new Date(u.created_date).toLocaleDateString(),
      u.last_login ? new Date(u.last_login).toLocaleDateString() : 'Never'
    ]);
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Get statistics
  const stats = {
    total: users.length,
    active: users.filter(u => u.active !== false).length,
    inactive: users.filter(u => u.active === false).length,
    pending: pendingUsers.length,
    byRole: USER_ROLES.reduce((acc, role) => {
      acc[role] = users.filter(u => u.role === role).length;
      return acc;
    }, {})
  };

  if (!canManageUsers(user)) {
    return null;
  }

  return (
    <div className="bg-white d-flex flex-column h-100">
      {/* Header */}
      <div className="border-bottom p-4">
        <div className="d-flex align-items-center justify-content-between mb-4">
          <div className="d-flex align-items-center gap-2">
            <Users className="me-2 text-primary" size={32} />
            <div>
              <h1 className="h4 fw-bold mb-0">User Management</h1>
              <p className="text-muted mb-0">Manage system users, roles, and permissions</p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-4">
          <ul className="nav nav-tabs">
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'users' ? 'active' : ''}`}
                onClick={() => setActiveTab('users')}
              >
                <Users size={16} className="me-1" />
                Active Users ({stats.total})
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'pending' ? 'active' : ''} ${pendingUsers.length > 0 ? 'text-warning' : ''}`}
                onClick={() => setActiveTab('pending')}
              >
                <Clock size={16} className="me-1" />
                Pending Approval ({stats.pending})
                {pendingUsers.length > 0 && <span className="badge bg-warning text-dark ms-1">{pendingUsers.length}</span>}
              </button>
            </li>
          </ul>
        </div>

        {/* Statistics Cards */}
        <div className="row g-3 mb-4">
          <div className="col-md-3">
            <div className="card bg-primary bg-opacity-10 border-0">
              <div className="card-body text-center">
                <div className="h3 fw-bold text-primary mb-0">{stats.total}</div>
                <div className="small text-primary">Active Users</div>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-warning bg-opacity-10 border-0">
              <div className="card-body text-center">
                <div className="h3 fw-bold text-warning mb-0">{stats.pending}</div>
                <div className="small text-warning">Pending Approval</div>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-success bg-opacity-10 border-0">
              <div className="card-body text-center">
                <div className="h3 fw-bold text-success mb-0">{stats.active}</div>
                <div className="small text-success">Active</div>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-secondary bg-opacity-10 border-0">
              <div className="card-body text-center">
                <div className="h3 fw-bold text-secondary mb-0">{stats.byRole.Admin || 0}</div>
                <div className="small text-secondary">Administrators</div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters for Active Users Tab */}
        {activeTab === 'users' && (
          <div className="d-flex align-items-center gap-2 mb-3">
            <div className="position-relative flex-grow-1" style={{maxWidth:'350px'}}>
              <Search className="position-absolute top-50 start-0 translate-middle-y ms-2 text-secondary" size={16} />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-control ps-5"
              />
            </div>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="form-select w-auto"
            >
              <option value="all">All Roles</option>
              {USER_ROLES.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="form-select w-auto"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
            <button
              onClick={handleExportUsers}
              className="btn btn-outline-secondary d-flex align-items-center"
            >
              <Download className="me-2" />
              Export
            </button>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-grow-1 overflow-auto">
        {activeTab === 'users' ? (
          // Simple Users Table
          <div className="table-responsive h-100">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light sticky-top">
                <tr>
                  <th>Status</th>
                  <th>User</th>
                  <th>Role</th>
                  <th>Created</th>
                  <th>Last Login</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id}>
                    <td>
                      {u.active !== false ? (
                        <span className="text-success">Active</span>
                      ) : (
                        <span className="text-danger">Inactive</span>
                      )}
                    </td>
                    <td>
                      <div>
                        <div className="fw-bold">{u.name}</div>
                        <div className="text-muted small">{u.email}</div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${
                        u.role === 'Admin' ? 'bg-danger' :
                        u.role === 'GTMLead' ? 'bg-success' :
                        u.role === 'PracticeLead' ? 'bg-info' :
                        'bg-primary'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td>{new Date(u.created_date).toLocaleDateString()}</td>
                    <td>{u.last_login ? new Date(u.last_login).toLocaleDateString() : 'Never'}</td>
                    <td>
                      <button
                        onClick={() => handleToggleUserStatus(u.id)}
                        className={`btn btn-sm ${u.active !== false ? 'btn-outline-danger' : 'btn-outline-success'}`}
                      >
                        {u.active !== false ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          // Pending Users Table
          <div className="p-4">
            {pendingUsers.length === 0 ? (
              <div className="text-center py-5">
                <Clock className="text-muted mb-3" size={48} />
                <h5 className="text-muted">No Pending Approvals</h5>
                <p className="text-muted">All user registrations have been processed.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead className="table-light">
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Registered</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingUsers.map(pendingUser => (
                      <tr key={pendingUser.id}>
                        <td className="fw-medium">{pendingUser.name}</td>
                        <td>{pendingUser.email}</td>
                        <td className="text-muted">
                          {new Date(pendingUser.created_date).toLocaleDateString()}
                        </td>
                        <td>
                          <div className="d-flex gap-1">
                            {USER_ROLES.map(role => (
                              <button
                                key={role}
                                onClick={() => handleApproveUser(pendingUser.id, role)}
                                className={`btn btn-sm ${
                                  role === 'Admin' ? 'btn-danger' :
                                  role === 'GTMLead' ? 'btn-success' :
                                  role === 'PracticeLead' ? 'btn-info' :
                                  'btn-primary'
                                }`}
                                title={`Approve as ${role}`}
                              >
                                <CheckCircle size={14} className="me-1" />
                                {role}
                              </button>
                            ))}
                            <button
                              onClick={() => handleRejectUser(pendingUser.id)}
                              className="btn btn-sm btn-outline-danger"
                              title="Reject registration"
                            >
                              <XCircle size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Reject User Confirmation Modal */}
      {confirmReject.show && (
        <>
          <div className="modal-backdrop show"></div>
          <div className="modal show d-block" tabIndex="-1" role="dialog">
            <div className="modal-dialog modal-dialog-centered" role="document">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    <XCircle className="text-danger me-2" size={20} />
                    Reject User Registration
                  </h5>
                </div>
                <div className="modal-body">
                  <p>Are you sure you want to reject this user registration?</p>
                  <p className="text-muted small mb-0">
                    This action cannot be undone. The user will need to register again.
                  </p>
                </div>
                <div className="modal-footer">
                  <button
                    onClick={cancelRejectUser}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmRejectUser}
                    className="btn btn-danger"
                  >
                    Reject User
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UserManagement;