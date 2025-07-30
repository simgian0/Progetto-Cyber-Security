import { SplunkAPIClient } from '../SplunkAPIClient';
import { DashboardPersistenceService } from '../../utility/dashboardNamePersistence';


const user: string = "admin"
const app: string = "search"
// Service to manage local JSON file tracking which dashboards exist
const dashboardNameJson = new DashboardPersistenceService();

/**
 * Service for managing Splunk dashboards dynamically per IP.
 * Handles creation, updates, and naming of dashboards.
 */
export class DashboardService {
    private apiClient: SplunkAPIClient;
    private static dashboardCreated: boolean = false;
    static increasedNumberforName: number = 1;

    constructor() {
        this.apiClient = new SplunkAPIClient(); // Instantiate the Splunk API client
    }

    // creates a new dashboard for specified ip
    async createDashboard(Ip: string, xml: string) {
        const dashboardName = this.createDashboardName(Ip);
        const endpoint = `/servicesNS/${user}/${app}/data/ui/views`;

        console.log(`CREAETING DASHBOARD: ${dashboardName}`);

        const params = new URLSearchParams();
        params.append('name', dashboardName);
        params.append('eai:data', xml);


        return this.apiClient.callAPI('POST', endpoint, params);
    }

    async updateDashboard(Ip: string, xml: string) {
        const dashboardName = this.createDashboardName(Ip);
        const endpoint = `/servicesNS/${user}/${app}/data/ui/views/${dashboardName}`;

        console.log(`UPDATING DASHBOARD: ${dashboardName}`)

        const params = new URLSearchParams();
        params.append('eai:data', xml);

        const response = await this.apiClient.callAPI('POST', endpoint, params);


        //return this.apiClient.callAPI('POST', endpoint, params);
        return response;
    }

    // Create (if not exist) or update a dashboard
    async createOrUpdateDashboard(ip: string, dashboardXML: string): Promise<void> {

        console.log("INVIO RICHIESTA API PER DASHBOARD....\n")
        const dashboardName = this.createDashboardName(ip);

        try {
            const exists = await dashboardNameJson.dashboardExists(dashboardName);

            if (exists) {
                console.log(`Updating existing dashboard: ${dashboardName}`);
                await this.updateDashboard(dashboardName, dashboardXML);
            } else {
                console.log(`Creating new dashboard: ${dashboardName}`);
                await this.createDashboard(dashboardName, dashboardXML);

                // Scrittura atomica con merge
                await dashboardNameJson.writeDashboardsFile({
                    [dashboardName]: true
                });
            }
        } catch (error: any) {
            console.error(`Error in createOrUpdateDashboard for ${dashboardName}: ${error.code || "unknown"} | ${error.message || error.response?.data}`);
            throw error;
        }
    }
    // create a dashboard name from an IP address
    createDashboardName(Ip: string): string {
        return `IP_${Ip.replace(/\./g, '_')}_requests`
    }

}