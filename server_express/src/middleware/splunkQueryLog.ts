//Import neccessary modules
import { Request, Response, NextFunction } from 'express';

//Import API service
import { SearchService } from '../api/endpoints/SearchService';
import { DashboardService } from '../api/endpoints/DashboardService';

//Import factory message
import { SuccesMessage, ErrorMessage } from '../factory/Messages';
import { errorFactory } from '../factory/FailMessage';
import { successFactory } from '../factory/SuccessMessage';

const errorMessageFactory: errorFactory = new errorFactory();



 export const generalRequestStatusforIP = async(req: Request, res: Response, next: NextFunction) => {
  //TO DO: Con più client modificare IP (x-forwarded-for)
  //const userOrIp = req.headers['x-user-id'] as string || req.ip as string;
  const Ip = req.ip?.startsWith('::ffff:') ? req.ip.replace('::ffff:', '') : req.ip || ''; // trasforma eventuali ipv6 in ipv4
  console.log("REQUEST IP:", Ip)

  const searchService = new SearchService();
  const dashboardService = new DashboardService();
  console.log('DENTRO SPLUNKMIDDLEWARE......')

  try {
    // 1. Search logs
    const logs = await searchService.searchLogs('express', Ip, 'error'); //La risposta di Splunk REST API /export è una stringa di JSON Lines (oggetti JSON separati da \n)
    console.log('SPLUNK QUERY: Splunk query results:',typeof logs, logs)

    // 2. Parse JSON lines string ➔ array
    const logsArray = typeof logs === 'string'
      ? logs.trim().split('\n').map(line => JSON.parse(line))
  :     Array.isArray(logs)
    ? logs
    : [];

    // 3. Estrarre il campo result
   const parsedResults = logsArray.map(entry => entry.result || {});
   console.log('Parsed results sample:', parsedResults.slice(0,3));

    console.log('SPLUNK QUERY PARSED ARRAY LENGTH:', parsedResults.length);
    console.log('First parsed entry:', parsedResults[0]);

    // 2. Calculate stats
   const stats = parsedResults.reduce((acc, entry) => {
     const httpStatus = entry.status || 'unknown';
     acc[httpStatus] = (acc[httpStatus] || 0) + 1;
     return acc;
     }, {});
   console.log(`Error stats for ${Ip}:`, stats);

    // 3. Create dashboard
    const dashboardXML = `
<dashboard>
  <label>User ${Ip} Error Stats</label>
  <row>
    <panel>
      <title>Error Counts</title>
      <chart>
        <searchString>search index=squid (user="${Ip}" OR ip_address="${Ip}") status="error" | stats count by status</searchString>
        <option name="charting.chart">pie</option>
      </chart>
    </panel>
  </row>
</dashboard>
    `;

    await dashboardService.createDashboard('admin', 'search', `user_${Ip}_errors`, dashboardXML);

    // Inietta stats per PDP
    (req as any).errorStats = stats;

    next();

  } catch (error) {
    console.error('Splunk middleware error:', error);
    //res.status(500).json({ error: 'Internal server error during Splunk processing' });
    next(); // continua senza bloccare la request in caso fallisca
  }
};


 export const statusforAllIP = async(req: Request, res: Response, next: NextFunction) => {
  //const userOrIp = req.headers['x-user-id'] as string || req.ip as string;
  const Ip = req.ip?.startsWith('::ffff:') ? req.ip.replace('::ffff:', '') : req.ip || ''; // trasforma eventuali ipv6 in ipv4

  const searchService = new SearchService();
  const dashboardService = new DashboardService();
  console.log('DENTRO SPLUNKMIDDLEWARE......')

  try {
    // 1. Search logs
    const logs = await searchService.searchStatusByIp('express', Ip);
    console.log('SPLUNK QUERY: Splunk query results:', logs, "\n")

    // 2. Calculate stats
    const logsArray = Array.isArray(logs) ? logs : [];

    const stats = logsArray.map(entry => ({
     status: entry.result.status,
      count: parseInt(entry.result.count, 10)
    }));

    console.log(`CALCULATE STATS FOR ${Ip}:`, stats);
/*
    // 3. Create dashboard
    const dashboardXML = `
<dashboard>
  <label>User ${Ip} Error Stats</label>
  <row>
    <panel>
      <title>Error Counts</title>
      <chart>
        <searchString>search index=squid (user="${Ip}" OR ip_address="${Ip}") status="error" | stats count by status</searchString>
        <option name="charting.chart">pie</option>
      </chart>
    </panel>
  </row>
</dashboard>
    `;

    await dashboardService.createDashboard('admin', 'search', `user_${Ip}_errors`, dashboardXML);

    // Inietta stats per PDP
    (req as any).errorStats = stats;
*/
    next();

  } catch (error) {
    console.error('Splunk middleware error:', error);
    //res.status(500).json({ error: 'Internal server error during Splunk processing' });
    next(); // continua senza bloccare la request in caso fallisca
  }
};