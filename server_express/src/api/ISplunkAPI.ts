/**Interface client API: */

export interface ISplunkAPI {
  callAPI(
    method: 'GET' | 'POST',
    endpoint: string,
    data?: URLSearchParams | any
  ): Promise<any>;
}
