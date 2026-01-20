# Geaux MCP Server

An MCP (Model Context Protocol) service for managing code deployment to Dev, preproduction, and production environments.

## Features

- **Multi-Environment Deployment**: Deploy to dev, preprod, and prod environments
- **Credential Management**: Securely store and manage API keys and credentials
- **Deployment History**: Track all deployments with versioning
- **Rollback Support**: Easily rollback to previous versions
- **Play Store & App Store Integration**: Configure deployment to mobile app stores
- **GitHub Integration**: Manage GitHub-based deployments

## Installation

```bash
npm install
npm run build
```

## Configuration

The MCP server can be configured in your MCP client (like Claude Desktop) by adding it to the configuration file:

### For Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%/Claude/claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "geaux": {
      "command": "node",
      "args": ["/path/to/geaux/dist/index.js"]
    }
  }
}
```

## Usage

Once configured, the following tools are available:

### Deploy Application

```typescript
deploy({
  environment: "dev" | "preprod" | "prod",
  appPath: "/path/to/app",
  version: "v1.0.0" // optional
})
```

### Configure Credentials

```typescript
configure_credentials({
  target: "github" | "playstore" | "appstore" | "server",
  credentials: {
    apiKey: "your-api-key",
    secret: "your-secret"
    // ... other credentials
  }
})
```

### List Deployments

```typescript
list_deployments({
  environment: "all" | "dev" | "preprod" | "prod"
})
```

### Rollback Deployment

```typescript
rollback({
  environment: "dev" | "preprod" | "prod",
  version: "v1.0.0"
})
```

### Get Deployment Status

```typescript
get_deployment_status({
  environment: "dev" | "preprod" | "prod"
})
```

## Resources

The server exposes the following resources:

- `geaux://config` - View current configuration
- `geaux://deployments` - View deployment history

## Localhost Endpoint

The server is configured to run locally and can be accessed via the configured endpoint (default: http://localhost:8080).

## Security

- Credentials are encrypted using AES-256-CBC
- Configuration files are stored in `~/.geaux/`
- Encryption keys are automatically generated and stored securely

## Development

```bash
# Build the project
npm run build

# Watch mode for development
npm run watch

# Start the server
npm start
```

## MVP Features

This MVP includes:

1. ✅ MCP server structure with TypeScript
2. ✅ Multi-environment deployment management (dev, preprod, prod)
3. ✅ Secure credential management with encryption
4. ✅ API key configuration support
5. ✅ Deployment history and versioning
6. ✅ Rollback functionality
7. ✅ Status monitoring
8. ✅ GitHub service endpoint configuration
9. ✅ Play Store and App Store deployment configuration
10. ✅ Localhost-based app endpoint

## Future Enhancements

- Actual deployment implementations for each platform
- CI/CD pipeline integration
- Webhook support for automated deployments
- Deployment approval workflows
- Health check monitoring
- Deployment metrics and analytics
- Multi-region support
- Blue-green deployment strategies

## License

MIT 
