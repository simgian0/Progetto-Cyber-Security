import { SplunkAPIClient } from '../SplunkAPIClient';

export class DashboardService {
  private apiClient: SplunkAPIClient;

  constructor() {
    this.apiClient = new SplunkAPIClient();
  }
  //TO IMPROVE: Passare i parametri direttamente come parametro
  async createDashboard(user: string, app: string, dashboardName: string, xml: string) {
    const endpoint = `/servicesNS/${user}/${app}/data/ui/views`;
    const params = new URLSearchParams();
    params.append('name', dashboardName);
    params.append('eai:data', xml);
    params.append('isVisible', '1');
    params.append('label', dashboardName);

    return this.apiClient.callAPI('POST', endpoint, params);
  }
}
