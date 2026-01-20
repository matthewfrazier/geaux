import * as fs from "fs";
import * as path from "path";
import * as os from "os";

export interface Config {
  environments: {
    dev: EnvironmentConfig;
    preprod: EnvironmentConfig;
    prod: EnvironmentConfig;
  };
  deploymentTargets: {
    github?: GitHubConfig;
    playstore?: PlayStoreConfig;
    appstore?: AppStoreConfig;
    server?: ServerConfig;
  };
  localhostEndpoint: string;
}

export interface EnvironmentConfig {
  endpoint: string;
  enabled: boolean;
}

export interface GitHubConfig {
  repository: string;
  branch: string;
}

export interface PlayStoreConfig {
  packageName: string;
  track: string;
}

export interface AppStoreConfig {
  bundleId: string;
  teamId: string;
}

export interface ServerConfig {
  host: string;
  port: number;
}

export class ConfigManager {
  private configPath: string;
  private config: Config;

  constructor() {
    const homeDir = os.homedir();
    const configDir = path.join(homeDir, ".geaux");
    this.configPath = path.join(configDir, "config.json");
    this.config = this.loadConfig();
  }

  private loadConfig(): Config {
    try {
      if (fs.existsSync(this.configPath)) {
        const data = fs.readFileSync(this.configPath, "utf-8");
        return JSON.parse(data);
      }
    } catch (error) {
      console.error("Error loading config:", error);
    }

    // Return default configuration
    return {
      environments: {
        dev: {
          endpoint: "http://localhost:3000",
          enabled: true,
        },
        preprod: {
          endpoint: "http://localhost:3001",
          enabled: true,
        },
        prod: {
          endpoint: "http://localhost:3002",
          enabled: false,
        },
      },
      deploymentTargets: {},
      localhostEndpoint: "http://localhost:8080",
    };
  }

  public getConfig(): Config {
    return this.config;
  }

  public saveConfig(): void {
    const configDir = path.dirname(this.configPath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
  }

  public updateEnvironment(env: string, config: Partial<EnvironmentConfig>): void {
    if (env in this.config.environments) {
      this.config.environments[env as keyof typeof this.config.environments] = {
        ...this.config.environments[env as keyof typeof this.config.environments],
        ...config,
      };
      this.saveConfig();
    }
  }

  public updateDeploymentTarget(
    target: string,
    config: GitHubConfig | PlayStoreConfig | AppStoreConfig | ServerConfig
  ): void {
    this.config.deploymentTargets[target as keyof typeof this.config.deploymentTargets] = config as any;
    this.saveConfig();
  }
}
