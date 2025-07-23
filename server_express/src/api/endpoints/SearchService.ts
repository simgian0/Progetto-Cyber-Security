import { SplunkAPIClient } from '../SplunkAPIClient';

export class SearchService {
  private apiClient: SplunkAPIClient;

  constructor() {
    this.apiClient = new SplunkAPIClient();
  }

  //TO IMPROVE: Passare la query come parametro se vanno fatte molte query differenziate
  async searchLogs(index: string, userOrIp: string, status: string) {

    //TO IMPROVE: Vedere se è meglio usare endpoint = `/services/search/jobs` con parametro exec_mode = oneshot
    const endpoint = `/services/search/jobs/export`;
    const query = `
    search index=${index}
    | spath input=log path=request_ip output=request_ip
    | spath input=log path=type output=type
    | spath input=log path=status output=status
    | search request_ip"${userOrIp}" type"${status}"
    | table _time, request_ip, status
  `;;

    const params = new URLSearchParams();
    params.append('search', query);
    params.append('output_mode', 'json');

    return this.apiClient.callAPI('POST', endpoint, params);
  }

  async searchStatusByIp(index: string, ip: string) {
  const endpoint = '/services/search/jobs/export';
  const query = `
    search index=${index} earliest=-1h
    | spath input=log path=request_ip output=request_ip
    | spath input=log path=status output=status
    | search request_ip="${ip}"
    | stats count by status
  `;

  const params = new URLSearchParams();
  params.append('search', query);
  params.append('output_mode', 'json');

  return this.apiClient.callAPI('POST', endpoint, params);
}

}
