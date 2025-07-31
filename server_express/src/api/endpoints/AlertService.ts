import { SplunkAPIClient } from '../SplunkAPIClient';
import { AlertPersistenceService } from '../../utility/AlertsPersistenceService';
import { ensureLogDirectoryExists } from '../../middleware/splunkLogger';
import path from 'path';
import fs from 'fs';




const user: string = "admin"
const app: string = "search"
const AlertNameJson = new AlertPersistenceService();

export class AlertService {
    private apiClient: SplunkAPIClient;
    private readonly ALERTS_PARAMS_FILE = path.join('/app/logs', 'alertsParams.json');

    constructor() {
        this.apiClient = new SplunkAPIClient();
    }

    async setAlerts() {

        const endpoint = `/servicesNS/${user}/${app}/saved/searches`;

        // Checks if file and directory exists otherwise it create them 
        ensureLogDirectoryExists(this.ALERTS_PARAMS_FILE);

        const alerts = JSON.parse(fs.readFileSync(this.ALERTS_PARAMS_FILE, "utf-8"));

        alerts.forEach(async (alert: Record<string, string>) => {
            const params = new URLSearchParams();

            for (const [key, value] of Object.entries(alert)) {
                params.append(key, value);
            }

            try {

                const shouldCreate = await AlertNameJson.checkAndInitializeAlert(alert.name);

                if (shouldCreate) {
                    // Aggiungi un piccolo ritardo tra le operazioni
                    await new Promise(resolve => setTimeout(resolve, 10000));

                    const response = await this.apiClient.callAPI('POST', endpoint, params);
                    console.log(`Alert "${alert.name}" creato`);

                }

            } catch (error: any) {
                if (error.response?.status === 409) {
                    console.warn(`Alert "${alert.name}" già esistente. Considera l'aggiornamento invece della creazione.`);
                } else {
                    console.error(`Errore per "${alert.name}":`, error.response?.data, error.message);
                }
                throw error;
            }
        });
    }

}
