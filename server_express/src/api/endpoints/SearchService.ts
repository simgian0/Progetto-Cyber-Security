import { SplunkAPIClient } from '../SplunkAPIClient';

/**
 * Service class responsible for executing search queries
 * to Splunk via the SplunkAPIClient.
 */
export class SearchService {
    private apiClient: SplunkAPIClient;

    constructor() {
        this.apiClient = new SplunkAPIClient();
    }

    // General-purpose search for logs based on IP and status.
    async searchLogs(index: string, userOrIp: string, status: string) {

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

    // Returns the count of requests grouped by HTTP status code for a specific IP within the last hour.
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
    /*async searchScore(ip: string) {
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
    }*/

    // Returns the average score for a given subnet.
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

    // Returns the average score for a given MAC address.
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

    // Returns the average score for a specific IP address.
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

    /**
     * Returns the number of requests made by an IP outside working hours (based on last 24 hours).
     */
    async searchOutsideWorkHours(ip: string) {
        const endpoint = '/services/search/jobs/export';
        const query = `
            search index=squid earliest=-24h
            | spath input=log path=allowed_hours output=allowed_hours
            | spath input=log path=client_ip output=client_ip
            | search allowed_hours=false client_ip=${ip}
            | stats count by client_ip
            | table client_ip, count
        `;

        const params = new URLSearchParams();
        params.append('search', query);
        params.append('output_mode', 'json');

        return this.apiClient.callAPI('POST', endpoint, params);
    }

    // Calculates the average time between the last 25 requests from a specific IP.
    async searchDosAttackbyAvgBetweenRequest(ip: string) {
        const endpoint = '/services/search/jobs/export';
        const query = `
            search index=express earliest=-20m
            | spath input=log path=request_ip output=request_ip
            | search request_ip="${ip}"
            | fields _time, request_ip
            | sort 0-_time 
            | streamstats count as attempt
            | where attempt <= 25 
            | sort 0 _time
            | streamstats current=f last(_time) as prev_time 
            | eval diff=if(isnull(prev_time), 0, _time - prev_time)
            | stats avg(diff) as avg_time_between_attempts
            | table avg_time_between_attempts
        `;

        const params = new URLSearchParams();
        params.append('search', query);
        params.append('output_mode', 'json');

        return this.apiClient.callAPI('POST', endpoint, params);
    }

    // Evaluates how many of the last 25 requests were HTTP 403 (forbidden).
    async searchDosAttackbyNumberOfNearBadRequest(ip: string) {
        const endpoint = '/services/search/jobs/export';
        const query = `
            search index=express earliest=-10m
            | spath input=log path=request_ip output=request_ip
            | spath input=log path=status output=status
            | search request_ip="${ip}"
            | sort -_time
            | head 25
            | eval is_forbidden=if(status=403, 1, 0)
            | stats sum(is_forbidden) as forbidden_count, count as total_requests, avg(_time) as avg_time by request_ip
            | eval forbidden_ratio=round((forbidden_count/total_requests)*100, 2)
            | eval score_penalty=if(forbidden_ratio >= 75, 10, if(forbidden_ratio >= 50, 5, 0))
            | table request_ip, total_requests, forbidden_count, forbidden_ratio, score_penalty
        `;

        const params = new URLSearchParams();
        params.append('search', query);
        params.append('output_mode', 'json');

        return this.apiClient.callAPI('POST', endpoint, params);
    }

}