# Deal Tracker MCP Server

This Model Context Protocol (MCP) server provides Claude with direct access to your Deal Tracker application data.

## Features

The MCP server exposes 8 powerful tools:

1. **get_opportunities** - List and filter opportunities by stage, specialist, or client
2. **get_opportunity** - Get detailed information about a specific opportunity
3. **create_opportunity** - Create new opportunities
4. **update_opportunity** - Update existing opportunities
5. **get_users** - List users, optionally filtered by role
6. **get_audit_logs** - View audit trail for opportunities
7. **analyze_pipeline** - Get insights on stage distribution, workload, durations, and overdue items
8. **search_opportunities** - Full-text search across opportunity fields

## Installation

```bash
cd mcp-server
npm install
```

## Configuration

The server connects to your Azure API by default. You can override the API URL by setting the environment variable:

```bash
export DEAL_TRACKER_API_URL="https://your-api-url.com/api"
```

## Running the Server

### Test Run (Development)
```bash
npm start
```

### With Auto-Reload (Development)
```bash
npm run dev
```

## Configuring in Claude Desktop

To enable this MCP server in Claude Desktop, add it to your configuration:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "deal-tracker": {
      "command": "node",
      "args": ["/Users/a314590/Desktop/deal-tracker-fresh/mcp-server/index.js"]
    }
  }
}
```

After updating the config, restart Claude Desktop.

## Usage Examples

Once configured, you can ask Claude questions like:

- "Show me all opportunities in the Shaping stage"
- "What's the workload distribution across specialists?"
- "Which opportunities are overdue?"
- "Create a new opportunity for Microsoft Azure migration"
- "Search for opportunities related to cloud infrastructure"
- "What's the average time deals spend in each stage?"

## Tool Details

### get_opportunities
Filters available:
- `stage`: Filter by workflow stage
- `specialist`: Filter by specialist name
- `client`: Filter by client name (searches in clientAsk field)

### analyze_pipeline
Metrics available:
- `stage_distribution`: Count of opportunities per stage
- `specialist_workload`: Number of opportunities per specialist
- `stage_duration`: Average days spent in each stage
- `overdue_opportunities`: Opportunities exceeding expected stage duration

### update_opportunity
**Note**: Requires PATCH endpoint implementation in Azure Functions (see below)

## Azure Functions TODO

The `update_opportunity` tool requires a PATCH endpoint. Add this to your Azure Functions:

```javascript
// opportunities/[id]/function.json
{
  "bindings": [
    {
      "authLevel": "anonymous",
      "type": "httpTrigger",
      "direction": "in",
      "name": "req",
      "methods": ["patch"],
      "route": "opportunities/{id}"
    },
    {
      "type": "http",
      "direction": "out",
      "name": "res"
    }
  ]
}
```

## Troubleshooting

### Server Not Starting
- Check that Node.js is installed: `node --version` (should be v18 or higher)
- Verify dependencies: `npm install`
- Check console output for error messages

### Claude Can't Connect
- Ensure the config file path is correct
- Check that the path to `index.js` is absolute
- Restart Claude Desktop after config changes
- Check Claude Desktop logs for MCP connection errors

### API Errors
- Verify your Azure Functions are running
- Test the API directly: `curl https://deal-tracker-api-v2-sc-g3g4gzgfdxc2ddbe.westus2-01.azurewebsites.net/api/opportunities`
- Check CORS settings in Azure if getting connection errors

## Development

To add new tools:

1. Add tool definition to `ListToolsRequestSchema` handler
2. Add case handler in `CallToolRequestSchema` switch statement
3. Test with `npm start` and manual stdin/stdout testing
4. Update this README with usage examples

## License

MIT
