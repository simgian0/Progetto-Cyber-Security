/** Concrete implementation of the Splunk API client. Uses Axios to perform HTTP requests to the Splunk REST API. */

import axios, { AxiosInstance } from 'axios';
import { SplunkConfig } from '../config/SplunkConfig';
import { ISplunkAPI } from './ISplunkAPI';
import https from 'https';

export class SplunkAPIClient implements ISplunkAPI {
    private client: AxiosInstance;

    constructor() {
        // Encode username and password for basic authentication
        const auth = Buffer.from(`${SplunkConfig.username}:${SplunkConfig.password}`).toString('base64');

        // Initialize Axios client with default configuration
        this.client = axios.create({
            baseURL: SplunkConfig.host,
            httpsAgent: new https.Agent({ rejectUnauthorized: false }),
            timeout: 10000, // 10 sec
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });
    }

    // Generic API call method to interact with Splunk endpoints.
    async callAPI(method: 'GET' | 'POST', endpoint: string, data?: any) {
        try {
            const response = await this.client.request({
                method,
                url: endpoint,
                data,
            });
            return response.data;
        } catch (error: any) {
            if (error.code === 'ECONNABORTED') {
                console.error('Splunk API timeout:', error.message);
                throw new Error('Splunk API request timed out.');
            } else {
                console.error('Splunk API error:', error.response?.data || error.message);
                throw error;
            }
        }
    }
}