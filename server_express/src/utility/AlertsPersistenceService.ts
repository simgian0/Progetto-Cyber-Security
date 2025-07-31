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

  // Carica il file all'avvio (senza lock, dato che è eseguito una volta sola)
  private async initialize(): Promise<void> {
    try {
      await this.ensureAlertFileExists();
    } catch (error) {
      console.error('Errore durante l\'inizializzazione di AlertPersistenceService:', error);
    }
  }

  // Crea il file se non esiste
  private async ensureAlertFileExists(): Promise<void> {
    try {
      await fsp.access(this.ALERTS_FILE);
    } catch {
      await fsp.writeFile(this.ALERTS_FILE, JSON.stringify({}, null, 2));
    }
  }

  // Verifica se un alert è già stato creato (lettura diretta dal file)
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

  // Segna un alert come creato (scrittura diretta sul file)
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
        // Usa un lock per evitare race conditions
        const lockFile = this.ALERTS_FILE + '.lock';
        
        // Crea un lock file
        await fsp.writeFile(lockFile, '');
        
        try {
            const alreadyExists = await this.isAlertInitialized(alertName);
            
            if (!alreadyExists) {
                await this.markAlertAsInitialized(alertName);
                return true; // Alert deve essere creato
            }
            
            return false; // Alert già esiste, non creare
        } finally {
            // Rimuovi il lock file
            await fsp.unlink(lockFile).catch(() => {});
        }
    } catch (error) {
        console.error(`Errore durante l'inizializzazione dell'alert ${alertName}:`, error);
        throw error;
    }
}

}