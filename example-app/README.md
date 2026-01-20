# Example Localhost App

This is a simple example application that can be deployed using the Geaux MCP server.

## Structure

```
example-app/
├── index.html
├── package.json
└── server.js
```

## Running the App

```bash
cd example-app
npm install
npm start
```

The app will be available at http://localhost:8080

## Deploying with Geaux

Use the MCP server to deploy this app:

```typescript
deploy({
  environment: "dev",
  appPath: "/path/to/geaux/example-app",
  version: "v1.0.0"
})
```
