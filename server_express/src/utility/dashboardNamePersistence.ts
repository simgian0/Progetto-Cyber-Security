import fsp from 'fs/promises';
import fs from 'fs';
import path from 'path';
import lockfile from 'proper-lockfile';
import { ensureLogDirectoryExists } from '../middleware/splunkLogger';

export class DashboardPersistenceService {
  private readonly DASHBOARDS_FILE = path.join('/app/logs', 'dashboards.json');
  private dashboardsCache: { [key: string]: boolean } = {};
  
  constructor() {
    ensureLogDirectoryExists(this.DASHBOARDS_FILE);
    this.initialize();
    
  }

  // Inizializzazione asincrona
  private async initialize(): Promise<void> {
    await this.initializeDashboardFile();
  }

  // Crea il file se non esiste
  private async initializeDashboardFile(): Promise<void> {
    try {
      await fsp.access(this.DASHBOARDS_FILE);
    } catch {
      await this.withLock(async () => {
        await fsp.writeFile(this.DASHBOARDS_FILE, JSON.stringify({ dashboards: {} }, null, 2));
      });
    }
    await this.loadDashboardsCache();
  }

  // Esegui operazione con lock
  private async withLock<T>(fn: () => Promise<T>, options?: lockfile.LockOptions): Promise<T> {
    const release = await lockfile.lock(this.DASHBOARDS_FILE, {
      retries: {
        retries: 5,
        minTimeout: 100,
        maxTimeout: 500
      },
      ...options
    });

    try {
      // Ricarica sempre la cache più recente prima di operare
      await this.loadDashboardsCache();
      return await fn();
    } finally {
      await release();
    }
  }

  // Carica in memoria il contenuto del file (senza lock, da usare solo dentro withLock)
  private async loadDashboardsCache(): Promise<void> {
    try {
      const data = await fsp.readFile(this.DASHBOARDS_FILE, 'utf8');
      const jsonData = JSON.parse(data);
      
      // Unisci con la cache esistente invece di sovrascrivere
      this.dashboardsCache = {
        ...this.dashboardsCache,
        ...(jsonData.dashboards || {})
      };
    } catch (error) {
      console.error('Error loading dashboards file:', error);
      this.dashboardsCache = {};
    }
  }

  // Scrive sul file con lock e merge degli aggiornamenti
  async writeDashboardsFile(updates: { [key: string]: boolean } = {}): Promise<void> {
    await this.withLock(async () => {
      try {
        // Carica lo stato più recente dal file
        const currentData = await this.loadCurrentFileData();
        
        // Unisci gli aggiornamenti
        const mergedData = {
          dashboards: {
            ...currentData.dashboards,
            ...updates
          }
        };

        // Aggiorna cache e file
        this.dashboardsCache = mergedData.dashboards;
        await fsp.writeFile(
          this.DASHBOARDS_FILE,
          JSON.stringify(mergedData, null, 2)
        );
      } catch (error) {
        console.error('Error writing dashboards file:', error);
        throw error;
      }
    }, { 
      // Opzioni più aggressive per le scritture
      retries: {
        retries: 10,
        minTimeout: 200,
        maxTimeout: 1000
      }
    });
  }

  // Carica i dati correnti dal file (da usare solo dentro withLock)
  private async loadCurrentFileData(): Promise<{ dashboards: { [key: string]: boolean } }> {
    try {
      const data = await fsp.readFile(this.DASHBOARDS_FILE, 'utf8');
      return JSON.parse(data);
    } catch {
      return { dashboards: {} };
    }
  }

  // Verifica se la dashboard esiste
  async dashboardExists(dashboardName: string): Promise<boolean> {
    return !!this.dashboardsCache[dashboardName];
  }

  

  // Metodi per Splunk API (esempi)
  private async createDashboard(name: string, xml: string): Promise<void> {
    console.log(`Creating dashboard: ${name}`);
    // await this.apiClient.callAPI('POST', '/servicesNS/admin/search/data/ui/views', { name, xml });
  }

  private async updateDashboard(name: string, xml: string): Promise<void> {
    console.log(`Updating dashboard: ${name}`);
    // await this.apiClient.callAPI('POST', `/servicesNS/admin/search/data/ui/views/${name}`, { xml });
  }

  // Pulisci eventuali lock rimasti (da chiamare all'avvio dell'applicazione)
  static async cleanupStaleLocks(): Promise<void> {
    try {
      await lockfile.unlock(path.resolve(__dirname, 'dashboards.json'));
    } catch (error) {
      // Ignora errori se non c'è lock
    }
  }
}