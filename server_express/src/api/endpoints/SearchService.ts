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
    | spath input=log path=user_id output=user_id
    | spath input=log path=status output=status
    | search user_id="${userOrIp}" status="${status}"
    | table _time, user_id, status, log
  `;;

    const params = new URLSearchParams();
    params.append('search', query);
    params.append('output_mode', 'json');

    return this.apiClient.callAPI('POST', endpoint, params);
  }
}
