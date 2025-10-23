import React, { useState } from 'react';
import { Edit, Power, PowerOff, Mail, Calendar, Activity, ChevronDown, ChevronUp } from 'lucide-react';

const UserTable = ({ users, selectedUsers, setSelectedUsers, onEditUser, onToggleStatus }) => {
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleSelectAll = () => {
    if (users.length === selectedUsers.size) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(users.map(u => u.id)));
    }
  };

  const handleSelectUser = (userId) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  // Sort users
  const sortedUsers = [...users].sort((a, b) => {
    let aVal = a[sortConfig.key];
    let bVal = b[sortConfig.key];

    // Handle different data types
    if (sortConfig.key === 'created_date' || sortConfig.key === 'last_login') {
      aVal = aVal ? new Date(aVal) : new Date(0);
      bVal = bVal ? new Date(bVal) : new Date(0);
    } else if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    } else if (typeof aVal === 'boolean') {
      aVal = aVal ? 1 : 0;
      bVal = bVal ? 1 : 0;
    }

    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) {
      return <ChevronDown className="ms-1 text-secondary" size={16} />;
    }
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="ms-1 text-primary" size={16} />
      : <ChevronDown className="ms-1 text-primary" size={16} />;
  };

  const getRoleColor = (role) => {
    const colors = {
      'Admin': 'bg-danger bg-opacity-10 text-danger',
      'GTMLead': 'bg-secondary bg-opacity-10 text-secondary',
      'GTM': 'bg-primary bg-opacity-10 text-primary',
      'PracticeLead': 'bg-success bg-opacity-10 text-success',
      'POC': 'bg-warning bg-opacity-10 text-warning'
    };
    return colors[role] || 'bg-light text-dark';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };
  const formatDateTime = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };
  const isAllSelected = users.length > 0 && users.length === selectedUsers.size;
  const isSomeSelected = selectedUsers.size > 0 && selectedUsers.size < users.length;

  return (
    <div className="table-responsive h-100">
      <table className="table table-hover align-middle mb-0">
        <thead className="table-light sticky-top">
          <tr>
            <th scope="col">
              <input
                type="checkbox"
                checked={isAllSelected}
                ref={input => { if (input) input.indeterminate = isSomeSelected; }}
                onChange={handleSelectAll}
              />
            </th>
            <th scope="col" style={{cursor:'pointer'}} onClick={() => handleSort('active')}>
              <span className="d-flex align-items-center">Status<SortIcon columnKey="active" /></span>
            </th>
            <th scope="col" style={{cursor:'pointer'}} onClick={() => handleSort('name')}>
              <span className="d-flex align-items-center">User<SortIcon columnKey="name" /></span>
            </th>
            <th scope="col" style={{cursor:'pointer'}} onClick={() => handleSort('role')}>
              <span className="d-flex align-items-center">Role<SortIcon columnKey="role" /></span>
            </th>
            <th scope="col" style={{cursor:'pointer'}} onClick={() => handleSort('created_date')}>
              <span className="d-flex align-items-center">Created<SortIcon columnKey="created_date" /></span>
            </th>
            <th scope="col" style={{cursor:'pointer'}} onClick={() => handleSort('last_login')}>
              <span className="d-flex align-items-center">Last Login<SortIcon columnKey="last_login" /></span>
            </th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedUsers.map((user) => (
            <tr key={user.id} className={selectedUsers.has(user.id) ? 'table-primary' : ''}>
              <td>
                <input
                  type="checkbox"
                  checked={selectedUsers.has(user.id)}
                  onChange={() => handleSelectUser(user.id)}
                />
              </td>
              <td>
                {user.active !== false ? (
                  <span className="text-success d-flex align-items-center"><Power className="me-1" size={16} />Active</span>
                ) : (
                  <span className="text-danger d-flex align-items-center"><PowerOff className="me-1" size={16} />Inactive</span>
                )}
              </td>
              <td>
                <div className="d-flex align-items-center gap-2">
                  <div className="rounded-circle bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center" style={{width:40,height:40}}>
                    <span className="fw-bold">
                      {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="fw-bold">{user.name}</div>
                    <div className="text-muted small d-flex align-items-center"><Mail className="me-1" size={14} />{user.email}</div>
                  </div>
                </div>
              </td>
              <td>
                <span className={`badge rounded-pill ${getRoleColor(user.role)}`}>{user.role}</span>
              </td>
              <td>
                <span className="d-flex align-items-center"><Calendar className="me-1" size={16} />{formatDate(user.created_date)}</span>
                {user.created_by && <div className="text-muted small">by {user.created_by}</div>}
              </td>
              <td>
                <span className="d-flex align-items-center"><Activity className="me-1" size={16} />{formatDateTime(user.last_login)}</span>
                {user.login_count > 0 && <div className="text-muted small">{user.login_count} logins</div>}
              </td>
              <td>
                <div className="d-flex align-items-center gap-2">
                  <button onClick={() => onEditUser(user)} className="btn btn-link text-primary p-0" title="Edit User"><Edit size={16} /></button>
                  <button
                    onClick={() => onToggleStatus(user.id)}
                    className={`btn btn-link p-0 ${user.active !== false ? 'text-danger' : 'text-success'}`}
                    title={user.active !== false ? 'Deactivate User' : 'Activate User'}
                  >
                    {user.active !== false ? <PowerOff size={16} /> : <Power size={16} />}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {users.length === 0 && (
        <div className="text-center py-5 text-muted">No users found</div>
      )}
    </div>
  );
};

export default UserTable;