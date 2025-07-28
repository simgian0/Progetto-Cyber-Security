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
        `;

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

    // fa una tabella con: time, score, minuti dall'ultima richiesta, recovered_score ovvero possibile nuovo punteggio recuperato nel frattempo, ip richiesta
    async searchScore(ip: string) {
        const endpoint = '/services/search/jobs/export';
        const query = `
            search index=score
            | spath input=log path=request_ip output=request_ip
            | spath input=log path=score output=score
            | spath input=log path=time output=time
            | spath input=log path=mac_address output=mac_address
            | spath input=log path=subnet output=subnet
            | eval score = tonumber(score)
            | search request_ip="${ip}"
            | where isnotnull(score) AND score != ""
            | sort -time
            | head 1
            | eval minutes_since = (now() - _time) / 60
            | eval recovered_score = if(score < 100, score + (score * 0.1), score)
            | table time, score, minutes_since, recovered_score, request_ip
        `;

        const params = new URLSearchParams();
        params.append('search', query);
        params.append('output_mode', 'json');

        return this.apiClient.callAPI('POST', endpoint, params);
    }

    // fa una tabella con avg score della subnet di riferimento
    async getAvgScoreBySubnet(subnet: string) {
        const endpoint = '/services/search/jobs/export';
        const query = `
            search index=score
            | spath input=log path=subnet output=subnet
            | spath input=log path=score output=score
            | spath input=log path=time output=time
            | eval score = tonumber(score)
            | search subnet="${subnet}" AND score != ""
            | sort -time
            | head 100
            | stats avg(score) as avg_score
            | table avg_score
        `;

        const params = new URLSearchParams();
        params.append('search', query);
        params.append('output_mode', 'json');

        return this.apiClient.callAPI('POST', endpoint, params);
    }

    // fa una tabella con avg score del mac di riferimento
    async getAvgScoreByMac(mac: string) {
        const endpoint = '/services/search/jobs/export';
        const query = `
            search index=score
            | spath input=log path=mac_address output=mac_address
            | spath input=log path=score output=score
            | spath input=log path=time output=time
            | eval score = tonumber(score)
            | search mac_address="${mac}" AND score != ""
            | sort -time
            | head 100
            | stats avg(score) as avg_score
            | table avg_score
        `;

        const params = new URLSearchParams();
        params.append('search', query);
        params.append('output_mode', 'json');

        return this.apiClient.callAPI('POST', endpoint, params);
    }

    // Fa una tabella con avg score dell'IP specificato
    async getAvgScoreByIp(ip: string) {
        const endpoint = '/services/search/jobs/export';
        const query = `
            search index=score
            | spath input=log path=request_ip output=request_ip
            | spath input=log path=score output=score
            | spath input=log path=time output=time
            | eval score = tonumber(score)
            | search request_ip="${ip}" AND score != ""
            | sort -time
            | head 100
            | stats avg(score) as avg_score
            | table avg_score
        `;

        const params = new URLSearchParams();
        params.append('search', query);
        params.append('output_mode', 'json');

        return this.apiClient.callAPI('POST', endpoint, params);
    }
}