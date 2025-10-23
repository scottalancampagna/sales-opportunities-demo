import React from 'react';
import { X, Shield, Check, Minus, AlertTriangle } from 'lucide-react';
import { USER_ROLES, STAGES } from '../../utils/constants';

const RolePermissionMatrix = ({ onClose }) => {
  // Define permission matrix
  const permissions = {
    'Create Opportunities': {
      'Admin': 'full',
      'GTMLead': 'full',
      'GTM': 'full',
      'PracticeLead': 'full',
      'POC': 'full'
    },
    'Move to Intake': {
      'Admin': 'full',
      'GTMLead': 'full',
      'GTM': 'full',
      'PracticeLead': 'full',
      'POC': 'full'
    },
    'Change from Intake': {
      'Admin': 'full',
      'GTMLead': 'full',
      'GTM': 'none',
      'PracticeLead': 'none',
      'POC': 'none'
    },
    'Change from Proposal': {
      'Admin': 'full',
      'GTMLead': 'none',
      'GTM': 'full',
      'PracticeLead': 'none',
      'POC': 'none'
    },
    'Edit in Shaping': {
      'Admin': 'full',
      'GTMLead': 'full',
      'GTM': 'full',
      'PracticeLead': 'full',
      'POC': 'limited'
    },
    'Update POC Fields': {
      'Admin': 'full',
      'GTMLead': 'full',
      'GTM': 'full',
      'PracticeLead': 'limited',
      'POC': 'full'
    },
    'View All Opportunities': {
      'Admin': 'full',
      'GTMLead': 'full',
      'GTM': 'full',
      'PracticeLead': 'full',
      'POC': 'full'
    },
    'Manage Users': {
      'Admin': 'full',
      'GTMLead': 'none',
      'GTM': 'none',
      'PracticeLead': 'none',
      'POC': 'none'
    },
    'Export Data': {
      'Admin': 'full',
      'GTMLead': 'full',
      'GTM': 'limited',
      'PracticeLead': 'limited',
      'POC': 'limited'
    }
  };

  // Stage transition matrix
  const stageTransitions = STAGES.reduce((acc, fromStage) => {
    acc[fromStage] = {};
    USER_ROLES.forEach(role => {
      const transitions = [];
      
      if (role === 'Admin') {
        // Admin can make any valid transition
        if (fromStage === 'New') transitions.push('Intake');
        if (fromStage === 'Intake') transitions.push('Needs More Info', 'In Research', 'Shaping', 'Proposal');
        if (fromStage === 'Needs More Info') transitions.push('Intake');
        if (fromStage === 'In Research') transitions.push('Shaping');
        if (fromStage === 'Shaping') transitions.push('In Research', 'Proposal');
        if (fromStage === 'Proposal') transitions.push('Review');
        if (fromStage === 'Review') transitions.push('Complete', 'Proposal');
      } else if (role === 'GTMLead') {
        // GTMLead can change from Intake
        if (fromStage === 'New') transitions.push('Intake');
        if (fromStage === 'Intake') transitions.push('Needs More Info', 'In Research', 'Shaping', 'Proposal');
      } else if (role === 'GTM') {
        // GTM can change from Proposal
        if (fromStage === 'New') transitions.push('Intake');
        if (fromStage === 'Proposal') transitions.push('Review');
      } else {
        // Other roles can only move to Intake from New
        if (fromStage === 'New') transitions.push('Intake');
      }
      
      acc[fromStage][role] = transitions;
    });
    return acc;
  }, {});

  const getPermissionIcon = (level) => {
    switch (level) {
      case 'full':
        return <Check className="w-4 h-4 text-green-600" />;
      case 'limited':
        return <Minus className="w-4 h-4 text-yellow-600" />;
      case 'none':
        return <X className="w-4 h-4 text-red-600" />;
      default:
        return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  const getPermissionColor = (level) => {
    switch (level) {
      case 'full':
        return 'bg-green-50 border-green-200';
      case 'limited':
        return 'bg-yellow-50 border-yellow-200';
      case 'none':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Shield className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold">Role Permission Matrix</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Legend */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Permission Levels:</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-green-600" />
                <span>Full Access - Complete permissions</span>
              </div>
              <div className="flex items-center space-x-2">
                <Minus className="w-4 h-4 text-yellow-600" />
                <span>Limited - Restricted permissions</span>
              </div>
              <div className="flex items-center space-x-2">
                <X className="w-4 h-4 text-red-600" />
                <span>No Access - Permission denied</span>
              </div>
            </div>
          </div>

          {/* General Permissions Matrix */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">General Permissions</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">
                      Permission
                    </th>
                    {USER_ROLES.map(role => (
                      <th key={role} className="px-4 py-3 text-center text-sm font-medium text-gray-700 border-b border-l">
                        {role}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(permissions).map(([permission, rolePerms], index) => (
                    <tr key={permission} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 border-b">
                        {permission}
                      </td>
                      {USER_ROLES.map(role => (
                        <td key={role} className={`px-4 py-3 text-center border-b border-l ${getPermissionColor(rolePerms[role])}`}>
                          {getPermissionIcon(rolePerms[role])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Stage Transition Matrix */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Stage Transition Permissions</h3>
            <div className="text-sm text-gray-600 mb-4">
              Shows which stages each role can transition opportunities TO from each current stage:
            </div>
            
            <div className="space-y-4">
              {STAGES.map(stage => (
                <div key={stage} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 border-b">
                    <h4 className="font-medium text-gray-900">From: {stage}</h4>
                  </div>
                  
                  <div className="p-4">
                    <div className="grid grid-cols-5 gap-4">
                      {USER_ROLES.map(role => (
                        <div key={role} className="space-y-2">
                          <div className="font-medium text-sm text-gray-700">{role}</div>
                          <div className="space-y-1">
                            {stageTransitions[stage][role].length > 0 ? (
                              stageTransitions[stage][role].map(targetStage => (
                                <div key={targetStage} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                  → {targetStage}
                                </div>
                              ))
                            ) : (
                              <div className="text-xs text-gray-500">No transitions</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Role Descriptions */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 mb-3">Role Descriptions:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium text-blue-800">Admin</div>
                <div className="text-blue-700">Full system access - can manage users, edit all opportunities, change any stage</div>
              </div>
              <div>
                <div className="font-medium text-blue-800">GTMLead</div>
                <div className="text-blue-700">Can manage intake process - change stages from Intake to other stages</div>
              </div>
              <div>
                <div className="font-medium text-blue-800">GTM</div>
                <div className="text-blue-700">Can manage proposals - change stages when opportunities are in Proposal</div>
              </div>
              <div>
                <div className="font-medium text-blue-800">PracticeLead</div>
                <div className="text-blue-700">Can edit opportunity details when in Shaping stage</div>
              </div>
              <div>
                <div className="font-medium text-blue-800">POC</div>
                <div className="text-blue-700">Can update POC fields when opportunities are in Intake or later stages</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RolePermissionMatrix;