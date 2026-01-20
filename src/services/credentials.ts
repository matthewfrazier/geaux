import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import * as crypto from "crypto";

export interface Credentials {
  target: string;
  data: Record<string, string>;
  encrypted: boolean;
}

export class CredentialManager {
  private credentialsPath: string;
  private credentials: Map<string, Credentials>;
  private encryptionKey: Buffer;

  constructor() {
    const homeDir = os.homedir();
    const configDir = path.join(homeDir, ".geaux");
    this.credentialsPath = path.join(configDir, "credentials.json");
    
    // Generate or load encryption key
    const keyPath = path.join(configDir, ".key");
    if (fs.existsSync(keyPath)) {
      this.encryptionKey = fs.readFileSync(keyPath);
    } else {
      this.encryptionKey = crypto.randomBytes(32);
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }
      fs.writeFileSync(keyPath, this.encryptionKey, { mode: 0o600 });
    }
    
    this.credentials = this.loadCredentials();
  }

  private loadCredentials(): Map<string, Credentials> {
    const creds = new Map<string, Credentials>();
    
    try {
      if (fs.existsSync(this.credentialsPath)) {
        const data = fs.readFileSync(this.credentialsPath, "utf-8");
        const parsed = JSON.parse(data);
        
        for (const [key, value] of Object.entries(parsed)) {
          const cred = value as Credentials;
          if (cred.encrypted) {
            cred.data = this.decryptData(cred.data);
          }
          creds.set(key, cred);
        }
      }
    } catch (error) {
      console.error("Error loading credentials:", error);
    }
    
    return creds;
  }

  private saveCredentials(): void {
    const configDir = path.dirname(this.credentialsPath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    const toSave: Record<string, Credentials> = {};
    
    for (const [key, value] of this.credentials.entries()) {
      const cred = { ...value };
      if (cred.encrypted) {
        cred.data = this.encryptData(cred.data);
      }
      toSave[key] = cred;
    }
    
    fs.writeFileSync(
      this.credentialsPath,
      JSON.stringify(toSave, null, 2),
      { mode: 0o600 }
    );
  }

  private encryptData(data: Record<string, string>): Record<string, string> {
    const encrypted: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(data)) {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv('aes-256-cbc', this.encryptionKey, iv);
      
      let encryptedValue = cipher.update(value, 'utf8', 'hex');
      encryptedValue += cipher.final('hex');
      
      encrypted[key] = iv.toString('hex') + ':' + encryptedValue;
    }
    
    return encrypted;
  }

  private decryptData(data: Record<string, string>): Record<string, string> {
    const decrypted: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(data)) {
      const parts = value.split(':');
      
      if (parts.length !== 2) {
        throw new Error(`Invalid encrypted data format for key: ${key}`);
      }
      
      const iv = Buffer.from(parts[0], 'hex');
      const encryptedValue = parts[1];
      
      const decipher = crypto.createDecipheriv('aes-256-cbc', this.encryptionKey, iv);
      
      let decryptedValue = decipher.update(encryptedValue, 'hex', 'utf8');
      decryptedValue += decipher.final('utf8');
      
      decrypted[key] = decryptedValue;
    }
    
    return decrypted;
  }

  public async configure(
    target: string,
    credentials: Record<string, string>
  ): Promise<{ success: boolean; message: string }> {
    try {
      this.credentials.set(target, {
        target,
        data: credentials,
        encrypted: true,
      });
      
      this.saveCredentials();
      
      return {
        success: true,
        message: `Credentials configured for ${target}`,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        message: `Failed to configure credentials: ${errorMessage}`,
      };
    }
  }

  public getCredentials(target: string): Record<string, string> | null {
    const cred = this.credentials.get(target);
    return cred ? cred.data : null;
  }

  public hasCredentials(target: string): boolean {
    return this.credentials.has(target);
  }

  public listTargets(): string[] {
    return Array.from(this.credentials.keys());
  }
}
