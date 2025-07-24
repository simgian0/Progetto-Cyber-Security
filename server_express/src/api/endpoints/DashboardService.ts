import { SplunkAPIClient } from '../SplunkAPIClient';

export class DashboardService {
  private apiClient: SplunkAPIClient;
  private static dashboardCreated: boolean = false;
  static increasedNumberforName: number = 1;

  constructor() {
    this.apiClient = new SplunkAPIClient();
  }
  //TO IMPROVE: Passare i parametri direttamente come parametro
  async createDashboard(user: string, app: string, dashboardName: string, xml: string) {
    const endpoint = `/servicesNS/${user}/${app}/data/ui/views`;
    const params = new URLSearchParams();
    params.append('name', dashboardName);
    params.append('eai:data', xml);
    

    return this.apiClient.callAPI('POST', endpoint, params);
  }

  //Funzione che fa da switch e mi indica se ho inizializzato la struttura della dashboard per la prima volta
  switchdashboardCreated(){
    DashboardService.dashboardCreated = true
  }

  getdashboardCreated(){
    return DashboardService.dashboardCreated
  }

  increaseNumber(){
    DashboardService.increasedNumberforName =  DashboardService.increasedNumberforName + 1;
  }

  
}
