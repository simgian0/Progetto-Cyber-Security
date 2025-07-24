/**Implementazione concreta del client */

import axios, { AxiosInstance } from 'axios';
import { SplunkConfig } from '../config/SplunkConfig';
import { ISplunkAPI } from './ISplunkAPI';
import https from 'https';

export class SplunkAPIClient implements ISplunkAPI {
  private client: AxiosInstance;

  constructor() {
    const auth = Buffer.from(`${SplunkConfig.username}:${SplunkConfig.password}`).toString('base64');

    this.client = axios.create({
      baseURL: SplunkConfig.host,
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      timeout: 10000, // timeout di 10 secondi
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  }

  async callAPI(method: 'GET' | 'POST', endpoint: string, data?: any) {
    try {
      const response = await this.client.request({
        method,
        url: endpoint,
        data,
      });
      return response.data;
    } catch (error: any) {
      if (error.code === 'ECONNABORTED') { //COdice per errore di timeout lanciato da axios
        console.error('Splunk API timeout:', error.message);
        throw new Error('Splunk API request timed out.');
      } else{
      console.error('Splunk API error:', error.response?.data || error.message);
      throw error;
      }
    }
  }
}
