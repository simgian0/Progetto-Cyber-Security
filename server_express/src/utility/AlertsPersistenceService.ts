import fsp from 'fs/promises';
import fs from 'fs';
import path from 'path';
import { ensureLogDirectoryExists } from '../middleware/splunkLogger';

export class AlertPersistenceService {
  private readonly ALERTS_FILE = path.join('/app/logs', 'alertsNames.json');

  constructor() {
    ensureLogDirectoryExists(this.ALERTS_FILE);
    this.initialize();
  }

  // Load the file at startup (without a lock, since it runs only once).
  private async initialize(): Promise<void> {
    try {
      await this.ensureAlertFileExists();
    } catch (error) {
      console.error('Errore durante l\'inizializzazione di AlertPersistenceService:', error);
    }
  }

  // Create the file if it doesn't exist
  private async ensureAlertFileExists(): Promise<void> {
    try {
      await fsp.access(this.ALERTS_FILE);
    } catch {
      await fsp.writeFile(this.ALERTS_FILE, JSON.stringify({}, null, 2));
    }
  }

  // Check if an alert has already been created
  async isAlertInitialized(alertName: string): Promise<boolean> {
    try {
      const content = await fsp.readFile(this.ALERTS_FILE, 'utf8');
      const alerts = JSON.parse(content);
      return !!alerts[alertName];
    } catch (error) {
      console.error('Errore nella lettura del file alerts.json:', error);
      return false;
    }
  }

  // Mark an alert as created
  async markAlertAsInitialized(alertName: string): Promise<void> {
    try {
      const content = await fsp.readFile(this.ALERTS_FILE, 'utf8');
      const alerts = JSON.parse(content);

      if (!alerts[alertName]) {
        alerts[alertName] = true;
        await fsp.writeFile(this.ALERTS_FILE, JSON.stringify(alerts, null, 2));
      }
    } catch (error) {
      console.error('Errore nella scrittura del file:', error);
      throw error;
    }
  }
  
  async checkAndInitializeAlert(alertName: string): Promise<boolean> {
    try {
        // Use a lock to prevent race conditions
        const lockFile = this.ALERTS_FILE + '.lock';
        
        // Create a lock file
        await fsp.writeFile(lockFile, '');
        
        try {
            const alreadyExists = await this.isAlertInitialized(alertName);
            
            if (!alreadyExists) {
                await this.markAlertAsInitialized(alertName);
                return true; // Alert needs to be created
            }
            
            return false; // Alert already exists, don't create
        } finally {
            // Remove the lock file
            await fsp.unlink(lockFile).catch(() => {});
        }
    } catch (error) {
        console.error(`Error during alert initialization ${alertName}:`, error);
        throw error;
    }
}

}