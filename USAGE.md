# Geaux MCP Server - Usage Guide

## Installation

1. Clone the repository:
```bash
git clone https://github.com/matthewfrazier/geaux.git
cd geaux
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

## Configuration

### For Claude Desktop (macOS)

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "geaux": {
      "command": "node",
      "args": ["/absolute/path/to/geaux/dist/index.js"]
    }
  }
}
```

### For Claude Desktop (Windows)

Edit `%APPDATA%/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "geaux": {
      "command": "node",
      "args": ["C:\\absolute\\path\\to\\geaux\\dist\\index.js"]
    }
  }
}
```

### For Other MCP Clients

Use the provided `mcp-config.json` as a template and adjust paths as needed.

## Using the MCP Tools

### 1. Deploy Application

Deploy your application to a specific environment:

```typescript
// Deploy to development environment
deploy({
  environment: "dev",
  appPath: "/path/to/your/app",
  version: "v1.0.0"  // optional, auto-generated if not provided
})

// Deploy to production
deploy({
  environment: "prod",
  appPath: "/path/to/your/app",
  version: "v1.2.3"
})
```

**Parameters:**
- `environment` (required): Target environment - "dev", "preprod", or "prod"
- `appPath` (required): Absolute path to the application directory
- `version` (optional): Version identifier for this deployment

**Returns:**
```json
{
  "id": "deploy-1234567890-abc123",
  "environment": "dev",
  "version": "v1.0.0",
  "appPath": "/path/to/your/app",
  "timestamp": "2026-01-20T14:00:00.000Z",
  "status": "success",
  "message": "Successfully deployed to dev at http://localhost:3000"
}
```

### 2. Configure Credentials

Store API keys and credentials securely for deployment targets:

```typescript
// Configure GitHub credentials
configure_credentials({
  target: "github",
  credentials: {
    token: "ghp_your_github_token",
    repository: "owner/repo"
  }
})

// Configure Play Store credentials
configure_credentials({
  target: "playstore",
  credentials: {
    serviceAccountEmail: "your-service@project.iam.gserviceaccount.com",
    privateKey: "-----BEGIN PRIVATE KEY-----\n...",
    packageName: "com.yourapp.package"
  }
})

// Configure App Store credentials
configure_credentials({
  target: "appstore",
  credentials: {
    issuerId: "your-issuer-id",
    apiKey: "your-api-key",
    bundleId: "com.yourapp.bundle"
  }
})

// Configure custom server
configure_credentials({
  target: "server",
  credentials: {
    apiKey: "your-server-api-key",
    apiSecret: "your-server-secret"
  }
})
```

**Parameters:**
- `target` (required): Deployment target - "github", "playstore", "appstore", or "server"
- `credentials` (required): Object containing target-specific credentials

**Security Note:** All credentials are encrypted with AES-256-CBC and stored in `~/.geaux/credentials.json`.

### 3. List Deployments

View deployment history:

```typescript
// List all deployments
list_deployments({
  environment: "all"
})

// List only dev deployments
list_deployments({
  environment: "dev"
})
```

**Parameters:**
- `environment` (optional): Filter by environment - "dev", "preprod", "prod", or "all" (default)

**Returns:**
```json
[
  {
    "id": "deploy-1234567890-abc123",
    "environment": "dev",
    "version": "v1.0.0",
    "appPath": "/path/to/your/app",
    "timestamp": "2026-01-20T14:00:00.000Z",
    "status": "success",
    "message": "Successfully deployed to dev at http://localhost:3000"
  }
]
```

### 4. Rollback Deployment

Rollback to a previous successful deployment:

```typescript
rollback({
  environment: "prod",
  version: "v1.0.0"
})
```

**Parameters:**
- `environment` (required): Target environment - "dev", "preprod", or "prod"
- `version` (required): Version to rollback to (must be a successful deployment)

**Returns:** Same as deploy operation

### 5. Get Deployment Status

Check the current status of an environment:

```typescript
get_deployment_status({
  environment: "prod"
})
```

**Parameters:**
- `environment` (required): Target environment - "dev", "preprod", or "prod"

**Returns:**
```json
{
  "environment": "prod",
  "currentVersion": "v1.0.0",
  "lastDeployment": {
    "id": "deploy-1234567890-abc123",
    "environment": "prod",
    "version": "v1.0.0",
    "appPath": "/path/to/your/app",
    "timestamp": "2026-01-20T14:00:00.000Z",
    "status": "success",
    "message": "Successfully deployed to prod at http://localhost:3002"
  },
  "endpoint": "http://localhost:3002"
}
```

## Using MCP Resources

The server exposes resources for viewing configuration and history:

### View Configuration

```typescript
// Read the geaux://config resource
```

Returns current configuration including environment settings and deployment targets.

### View Deployment History

```typescript
// Read the geaux://deployments resource
```

Returns all deployments across all environments.

## Example Workflow

1. **Configure credentials for your targets:**
```typescript
configure_credentials({
  target: "github",
  credentials: {
    token: "your-token",
    repository: "owner/repo"
  }
})
```

2. **Deploy to development:**
```typescript
deploy({
  environment: "dev",
  appPath: "/path/to/geaux/example-app",
  version: "v1.0.0"
})
```

3. **Check deployment status:**
```typescript
get_deployment_status({
  environment: "dev"
})
```

4. **Deploy to production:**
```typescript
deploy({
  environment: "prod",
  appPath: "/path/to/geaux/example-app",
  version: "v1.0.0"
})
```

5. **If needed, rollback:**
```typescript
rollback({
  environment: "prod",
  version: "v0.9.0"
})
```

## Testing the Example App

The repository includes an example application for testing:

```bash
cd example-app
npm start
```

Visit http://localhost:8080 to see the running app.

Then deploy it using the MCP server:
```typescript
deploy({
  environment: "dev",
  appPath: "/absolute/path/to/geaux/example-app",
  version: "v1.0.0"
})
```

## Environment Configuration

The default environment endpoints are:
- **dev**: http://localhost:3000
- **preprod**: http://localhost:3001
- **prod**: http://localhost:3002 (disabled by default for safety)

These can be customized in `~/.geaux/config.json`.

## Troubleshooting

### MCP Server Not Starting

1. Ensure Node.js is installed and in your PATH
2. Verify the path in your MCP client configuration is absolute
3. Check that `npm run build` completed successfully
4. Look for errors in your MCP client's logs

### Credentials Not Working

1. Credentials are stored in `~/.geaux/credentials.json` (encrypted)
2. Encryption key is in `~/.geaux/.key` with 0o600 permissions
3. To reset credentials, delete these files and reconfigure

### Deployment Fails

1. Verify the `appPath` exists and is accessible
2. Check that the target environment is enabled in the configuration
3. Review deployment history with `list_deployments` to see error messages

## Security Best Practices

1. **Never commit credentials to version control**
2. **Use environment-specific credentials** - don't use production credentials in dev
3. **Regularly rotate API keys** - reconfigure credentials periodically
4. **Limit access** - only authorized users should have access to credential files
5. **Enable production carefully** - prod environment is disabled by default

## Next Steps

- Implement actual deployment logic for each platform
- Add CI/CD pipeline integration
- Set up webhooks for automated deployments
- Implement deployment approval workflows
- Add metrics and monitoring
- Create multi-region support

## Support

For issues or questions, please open an issue in the GitHub repository.
