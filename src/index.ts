#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { DeploymentService } from "./services/deployment.js";
import { CredentialManager } from "./services/credentials.js";
import { ConfigManager } from "./services/config.js";

const server = new Server(
  {
    name: "geaux-mcp-server",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// Initialize services
const configManager = new ConfigManager();
const credentialManager = new CredentialManager();
const deploymentService = new DeploymentService(configManager, credentialManager);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "deploy",
        description: "Deploy application to specified environment (dev, preprod, prod)",
        inputSchema: {
          type: "object",
          properties: {
            environment: {
              type: "string",
              enum: ["dev", "preprod", "prod"],
              description: "Target environment for deployment",
            },
            appPath: {
              type: "string",
              description: "Path to the application to deploy",
            },
            version: {
              type: "string",
              description: "Version number for this deployment",
            },
          },
          required: ["environment", "appPath"],
        },
      },
      {
        name: "configure_credentials",
        description: "Configure API keys and credentials for deployment targets",
        inputSchema: {
          type: "object",
          properties: {
            target: {
              type: "string",
              enum: ["github", "playstore", "appstore", "server"],
              description: "Deployment target to configure",
            },
            credentials: {
              type: "object",
              description: "Credentials object with required keys",
            },
          },
          required: ["target", "credentials"],
        },
      },
      {
        name: "list_deployments",
        description: "List all deployments across environments",
        inputSchema: {
          type: "object",
          properties: {
            environment: {
              type: "string",
              enum: ["dev", "preprod", "prod", "all"],
              description: "Filter by environment (default: all)",
            },
          },
        },
      },
      {
        name: "rollback",
        description: "Rollback to a previous deployment version",
        inputSchema: {
          type: "object",
          properties: {
            environment: {
              type: "string",
              enum: ["dev", "preprod", "prod"],
              description: "Target environment",
            },
            version: {
              type: "string",
              description: "Version to rollback to",
            },
          },
          required: ["environment", "version"],
        },
      },
      {
        name: "get_deployment_status",
        description: "Get the current deployment status for an environment",
        inputSchema: {
          type: "object",
          properties: {
            environment: {
              type: "string",
              enum: ["dev", "preprod", "prod"],
              description: "Target environment",
            },
          },
          required: ["environment"],
        },
      },
    ],
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (!args) {
      throw new Error("Missing arguments");
    }

    switch (name) {
      case "deploy": {
        const result = await deploymentService.deploy(
          args.environment as string,
          args.appPath as string,
          args.version as string
        );
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "configure_credentials": {
        const result = await credentialManager.configure(
          args.target as string,
          args.credentials as Record<string, string>
        );
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "list_deployments": {
        const result = await deploymentService.listDeployments(
          (args.environment as string) || "all"
        );
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "rollback": {
        const result = await deploymentService.rollback(
          args.environment as string,
          args.version as string
        );
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "get_deployment_status": {
        const result = await deploymentService.getStatus(
          args.environment as string
        );
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ error: errorMessage }, null, 2),
        },
      ],
      isError: true,
    };
  }
});

// List available resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: "geaux://config",
        name: "Deployment Configuration",
        description: "Current deployment configuration settings",
        mimeType: "application/json",
      },
      {
        uri: "geaux://deployments",
        name: "Deployment History",
        description: "History of all deployments",
        mimeType: "application/json",
      },
    ],
  };
});

// Read resources
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  switch (uri) {
    case "geaux://config": {
      const config = configManager.getConfig();
      return {
        contents: [
          {
            uri,
            mimeType: "application/json",
            text: JSON.stringify(config, null, 2),
          },
        ],
      };
    }

    case "geaux://deployments": {
      const deployments = await deploymentService.listDeployments("all");
      return {
        contents: [
          {
            uri,
            mimeType: "application/json",
            text: JSON.stringify(deployments, null, 2),
          },
        ],
      };
    }

    default:
      throw new Error(`Unknown resource: ${uri}`);
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Geaux MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
