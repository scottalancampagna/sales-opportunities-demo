#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import fetch from 'node-fetch';

// Azure API Configuration
const BASE_URL = process.env.DEAL_TRACKER_API_URL || 
  'https://deal-tracker-api-v2-sc-g3g4gzgfdxc2ddbe.westus2-01.azurewebsites.net/api';

// Create MCP server instance
const server = new Server(
  {
    name: 'deal-tracker-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function apiRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

// ============================================================================
// TOOL HANDLERS
// ============================================================================

// List all available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'get_opportunities',
        description: 'Retrieve all opportunities or filter by stage, specialist, or client',
        inputSchema: {
          type: 'object',
          properties: {
            stage: {
              type: 'string',
              description: 'Filter by stage (New, Intake, Needs More Info, In Research, Shaping, Proposal, Review, Complete)',
              enum: ['New', 'Intake', 'Needs More Info', 'In Research', 'Shaping', 'Proposal', 'Review', 'Complete']
            },
            specialist: {
              type: 'string',
              description: 'Filter by specialist name'
            },
            client: {
              type: 'string',
              description: 'Filter by client name'
            }
          }
        }
      },
      {
        name: 'get_opportunity',
        description: 'Get details of a specific opportunity by ID',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'The opportunity ID'
            }
          },
          required: ['id']
        }
      },
      {
        name: 'create_opportunity',
        description: 'Create a new opportunity',
        inputSchema: {
          type: 'object',
          properties: {
            specialist: {
              type: 'string',
              description: 'Name of the specialist'
            },
            clientAsk: {
              type: 'string',
              description: 'Brief description of what the client is asking for'
            },
            needs: {
              type: 'string',
              description: 'Description of needs'
            },
            whyLaunch: {
              type: 'string',
              description: 'Why Launch is the right fit'
            },
            sfdcId: {
              type: 'string',
              description: 'Salesforce opportunity ID'
            }
          },
          required: ['specialist', 'clientAsk']
        }
      },
      {
        name: 'update_opportunity',
        description: 'Update an existing opportunity',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'The opportunity ID'
            },
            updates: {
              type: 'object',
              description: 'Fields to update (stage, specialist, clientAsk, needs, whyLaunch, sfdcId, etc.)'
            }
          },
          required: ['id', 'updates']
        }
      },
      {
        name: 'get_users',
        description: 'Get all users in the system',
        inputSchema: {
          type: 'object',
          properties: {
            role: {
              type: 'string',
              description: 'Filter by role',
              enum: ['Admin', 'GTMLead', 'GTM', 'GM', 'PracticeLead', 'POC']
            }
          }
        }
      },
      {
        name: 'get_audit_logs',
        description: 'Get audit trail for an opportunity',
        inputSchema: {
          type: 'object',
          properties: {
            opportunityId: {
              type: 'string',
              description: 'Filter audit logs by opportunity ID'
            },
            limit: {
              type: 'number',
              description: 'Number of logs to return (default: 50)'
            }
          }
        }
      },
      {
        name: 'analyze_pipeline',
        description: 'Analyze pipeline metrics like opportunities per stage, specialist workload, average time in stages',
        inputSchema: {
          type: 'object',
          properties: {
            metric: {
              type: 'string',
              description: 'Type of analysis',
              enum: ['stage_distribution', 'specialist_workload', 'stage_duration', 'overdue_opportunities']
            }
          },
          required: ['metric']
        }
      },
      {
        name: 'search_opportunities',
        description: 'Search opportunities by text in clientAsk, needs, or whyLaunch fields',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query'
            }
          },
          required: ['query']
        }
      }
    ]
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'get_opportunities': {
        let opportunities = await apiRequest('/opportunities');
        
        // Apply filters
        if (args.stage) {
          opportunities = opportunities.filter(opp => opp.stage === args.stage);
        }
        if (args.specialist) {
          opportunities = opportunities.filter(opp => 
            opp.specialist?.toLowerCase().includes(args.specialist.toLowerCase())
          );
        }
        if (args.client) {
          opportunities = opportunities.filter(opp => 
            opp.clientAsk?.toLowerCase().includes(args.client.toLowerCase())
          );
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(opportunities, null, 2)
            }
          ]
        };
      }

      case 'get_opportunity': {
        const opportunities = await apiRequest('/opportunities');
        const opportunity = opportunities.find(opp => opp.id === args.id);
        
        if (!opportunity) {
          throw new Error(`Opportunity with ID ${args.id} not found`);
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(opportunity, null, 2)
            }
          ]
        };
      }

      case 'create_opportunity': {
        const newOpportunity = await apiRequest('/opportunities', {
          method: 'POST',
          body: JSON.stringify({
            specialist: args.specialist,
            clientAsk: args.clientAsk,
            needs: args.needs || '',
            whyLaunch: args.whyLaunch || '',
            sfdcId: args.sfdcId || '',
            stage: 'New',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })
        });

        return {
          content: [
            {
              type: 'text',
              text: `Created opportunity: ${JSON.stringify(newOpportunity, null, 2)}`
            }
          ]
        };
      }

      case 'update_opportunity': {
        // Note: You'll need to implement the PATCH endpoint in your Azure Functions
        const updateData = {
          ...args.updates,
          updatedAt: new Date().toISOString()
        };

        const updated = await apiRequest(`/opportunities/${args.id}`, {
          method: 'PATCH',
          body: JSON.stringify(updateData)
        });

        return {
          content: [
            {
              type: 'text',
              text: `Updated opportunity: ${JSON.stringify(updated, null, 2)}`
            }
          ]
        };
      }

      case 'get_users': {
        let users = await apiRequest('/users');
        
        if (args.role) {
          users = users.filter(user => user.role === args.role);
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(users, null, 2)
            }
          ]
        };
      }

      case 'get_audit_logs': {
        const logs = await apiRequest('/auditLogs');
        let filtered = logs;

        if (args.opportunityId) {
          filtered = logs.filter(log => log.opportunityId === args.opportunityId);
        }

        const limit = args.limit || 50;
        filtered = filtered.slice(0, limit);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(filtered, null, 2)
            }
          ]
        };
      }

      case 'analyze_pipeline': {
        const opportunities = await apiRequest('/opportunities');
        let analysis = {};

        switch (args.metric) {
          case 'stage_distribution': {
            const distribution = {};
            opportunities.forEach(opp => {
              distribution[opp.stage] = (distribution[opp.stage] || 0) + 1;
            });
            analysis = {
              metric: 'Stage Distribution',
              data: distribution,
              total: opportunities.length
            };
            break;
          }

          case 'specialist_workload': {
            const workload = {};
            opportunities.forEach(opp => {
              if (opp.specialist) {
                workload[opp.specialist] = (workload[opp.specialist] || 0) + 1;
              }
            });
            analysis = {
              metric: 'Specialist Workload',
              data: workload,
              total: opportunities.length
            };
            break;
          }

          case 'stage_duration': {
            // Calculate average time in each stage
            const now = new Date();
            const durations = {};
            
            opportunities.forEach(opp => {
              const created = new Date(opp.createdAt);
              const daysInStage = Math.floor((now - created) / (1000 * 60 * 60 * 24));
              
              if (!durations[opp.stage]) {
                durations[opp.stage] = { total: 0, count: 0 };
              }
              durations[opp.stage].total += daysInStage;
              durations[opp.stage].count += 1;
            });

            const averages = {};
            Object.keys(durations).forEach(stage => {
              averages[stage] = Math.round(durations[stage].total / durations[stage].count);
            });

            analysis = {
              metric: 'Average Days in Stage',
              data: averages
            };
            break;
          }

          case 'overdue_opportunities': {
            // Define expected durations (in days)
            const expectedDurations = {
              'New': 2,
              'Intake': 3,
              'Needs More Info': 5,
              'In Research': 7,
              'Shaping': 10,
              'Proposal': 14,
              'Review': 3,
              'Complete': 0
            };

            const now = new Date();
            const overdue = opportunities.filter(opp => {
              const created = new Date(opp.createdAt);
              const daysInStage = Math.floor((now - created) / (1000 * 60 * 60 * 24));
              const expected = expectedDurations[opp.stage] || 0;
              return daysInStage > expected;
            }).map(opp => ({
              id: opp.id,
              specialist: opp.specialist,
              stage: opp.stage,
              clientAsk: opp.clientAsk?.substring(0, 50) + '...',
              daysInStage: Math.floor((now - new Date(opp.createdAt)) / (1000 * 60 * 60 * 24))
            }));

            analysis = {
              metric: 'Overdue Opportunities',
              count: overdue.length,
              data: overdue
            };
            break;
          }
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(analysis, null, 2)
            }
          ]
        };
      }

      case 'search_opportunities': {
        const opportunities = await apiRequest('/opportunities');
        const query = args.query.toLowerCase();
        
        const results = opportunities.filter(opp => 
          opp.clientAsk?.toLowerCase().includes(query) ||
          opp.needs?.toLowerCase().includes(query) ||
          opp.whyLaunch?.toLowerCase().includes(query) ||
          opp.specialist?.toLowerCase().includes(query)
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(results, null, 2)
            }
          ]
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`
        }
      ],
      isError: true
    };
  }
});

// ============================================================================
// START SERVER
// ============================================================================

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Deal Tracker MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
