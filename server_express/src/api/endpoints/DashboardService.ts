import { SplunkAPIClient } from '../SplunkAPIClient';
import { DashboardPersistenceService } from '../../utility/dashboardNamePersistence';


 const user: string = "admin"
 const app: string ="search"
 const dashboardNameJson = new DashboardPersistenceService();

export class DashboardService {
  private apiClient: SplunkAPIClient;
  private static dashboardCreated: boolean = false;
  static increasedNumberforName: number = 1;

  constructor() {
    this.apiClient = new SplunkAPIClient();
  }
  //TO IMPROVE: Passare i parametri direttamente come parametro
  async createDashboard(Ip: string, xml: string) {
    const dashboardName = this.createDashboardName(Ip);
    const endpoint = `/servicesNS/${user}/${app}/data/ui/views`;

    console.log(`CREAETING DASHBOARD: ${dashboardName}`);

    const params = new URLSearchParams();
    params.append('name', dashboardName);
    params.append('eai:data', xml);
    

    return this.apiClient.callAPI('POST', endpoint, params);
  }

   async updateDashboard(Ip : string, xml: string) {
    const dashboardName = this.createDashboardName(Ip);
    const endpoint = `/servicesNS/${user}/${app}/data/ui/views/${dashboardName}`;

    console.log(`UPDATING DASHBOARD: ${dashboardName}`)

    const params = new URLSearchParams();
    params.append('eai:data', xml);
    
    const response = await this.apiClient.callAPI('POST', endpoint, params);
    

    //return this.apiClient.callAPI('POST', endpoint, params);
    return response;
  }

  // Crea o aggiorna una dashboard
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
    } catch (error) {
      console.error(`Error in createOrUpdateDashboard for ${dashboardName}:`, error);
      throw error;
    }
  }
//Funzione che crea il nome delle dashboard
  createDashboardName(Ip: string) : string {
    return `IP_${Ip.replace(/\./g, '_')}_requests`
  }
  
}
