import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { ConfigManager } from "./config.js";
import { CredentialManager } from "./credentials.js";

export interface Deployment {
  id: string;
  environment: string;
  version: string;
  appPath: string;
  timestamp: string;
  status: "pending" | "in-progress" | "success" | "failed";
  message?: string;
}

export class DeploymentService {
  private deploymentsPath: string;
  private deployments: Deployment[];
  private configManager: ConfigManager;
  private credentialManager: CredentialManager;

  constructor(configManager: ConfigManager, credentialManager: CredentialManager) {
    this.configManager = configManager;
    this.credentialManager = credentialManager;
    
    const homeDir = os.homedir();
    const configDir = path.join(homeDir, ".geaux");
    this.deploymentsPath = path.join(configDir, "deployments.json");
    this.deployments = this.loadDeployments();
  }

  private loadDeployments(): Deployment[] {
    try {
      if (fs.existsSync(this.deploymentsPath)) {
        const data = fs.readFileSync(this.deploymentsPath, "utf-8");
        return JSON.parse(data);
      }
    } catch (error) {
      console.error("Error loading deployments:", error);
    }
    return [];
  }

  private saveDeployments(): void {
    const configDir = path.dirname(this.deploymentsPath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    fs.writeFileSync(this.deploymentsPath, JSON.stringify(this.deployments, null, 2));
  }

  private generateId(): string {
    return `deploy-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  public async deploy(
    environment: string,
    appPath: string,
    version?: string
  ): Promise<Deployment> {
    const config = this.configManager.getConfig();
    const envConfig = config.environments[environment as keyof typeof config.environments];

    if (!envConfig) {
      throw new Error(`Unknown environment: ${environment}`);
    }

    if (!envConfig.enabled) {
      throw new Error(`Environment ${environment} is not enabled`);
    }

    // Generate version if not provided
    const deployVersion = version || `v${Date.now()}`;

    const deployment: Deployment = {
      id: this.generateId(),
      environment,
      version: deployVersion,
      appPath,
      timestamp: new Date().toISOString(),
      status: "in-progress",
    };

    this.deployments.unshift(deployment);
    this.saveDeployments();

    try {
      // Simulate deployment process
      await this.performDeployment(deployment, envConfig.endpoint);

      deployment.status = "success";
      deployment.message = `Successfully deployed to ${environment} at ${envConfig.endpoint}`;
    } catch (error) {
      deployment.status = "failed";
      deployment.message = error instanceof Error ? error.message : String(error);
    }

    this.saveDeployments();
    return deployment;
  }

  private async performDeployment(deployment: Deployment, endpoint: string): Promise<void> {
    // Check if app path exists
    if (!fs.existsSync(deployment.appPath)) {
      throw new Error(`Application path does not exist: ${deployment.appPath}`);
    }

    // Simulate deployment steps
    await this.sleep(1000);

    // In a real implementation, this would:
    // 1. Build the application
    // 2. Upload to the target environment
    // 3. Run health checks
    // 4. Update routing/load balancers
    
    console.log(`Deploying ${deployment.version} to ${endpoint}...`);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  public async listDeployments(environment: string): Promise<Deployment[]> {
    if (environment === "all") {
      return this.deployments;
    }
    return this.deployments.filter((d) => d.environment === environment);
  }

  public async rollback(environment: string, version: string): Promise<Deployment> {
    const targetDeployment = this.deployments.find(
      (d) => d.environment === environment && d.version === version && d.status === "success"
    );

    if (!targetDeployment) {
      throw new Error(
        `No successful deployment found for ${environment} with version ${version}`
      );
    }

    return this.deploy(environment, targetDeployment.appPath, version);
  }

  public async getStatus(environment: string): Promise<{
    environment: string;
    currentVersion?: string;
    lastDeployment?: Deployment;
    endpoint: string;
  }> {
    const config = this.configManager.getConfig();
    const envConfig = config.environments[environment as keyof typeof config.environments];

    if (!envConfig) {
      throw new Error(`Unknown environment: ${environment}`);
    }

    const lastDeployment = this.deployments.find(
      (d) => d.environment === environment && d.status === "success"
    );

    return {
      environment,
      currentVersion: lastDeployment?.version,
      lastDeployment,
      endpoint: envConfig.endpoint,
    };
  }
}
