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
    const logs = await searchService.searchLogs('express', Ip, '*'); //La risposta di Splunk REST API /export è una stringa di JSON Lines (oggetti JSON separati da \n)
    //console.log('SPLUNK QUERY: Splunk query results:',typeof logs, logs)

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
    //console.log('First parsed entry:', parsedResults[0]);

    // 2. Calculate stats
   const stats = parsedResults.reduce((acc, entry) => {
     const httpStatus = entry.status || 'unknown';
     acc[httpStatus] = (acc[httpStatus] || 0) + 1;
     return acc;
     }, {});
   console.log(`Error stats for ${Ip}:`, stats);

    // 3. Create dashboard
    console.log("PRIMA DI CREARE DASHBOARD DASHBOARDCREATED E': ", dashboardService.getdashboardCreated());
    console.log("PRIMA DI CREARE DASHBOARD NUMBERFORNAME E': ", DashboardService.increasedNumberforName);

    if (!dashboardService.getdashboardCreated()) {
   

    dashboardService.switchdashboardCreated();
    dashboardService.increaseNumber();
    console.log("dashboardNumberName = ", DashboardService.increasedNumberforName)

    const dashboardXML1 = `<dashboard>
  <label>_IP: ${Ip} - Tipologie di Richieste_</label>
  <description>Quantità e tipologie di richieste fatte dall'Ip ${Ip}</description>
  
  <row>
    <panel>
      <title>Distribuzione richieste per stato HTTP</title>
      <chart>
        <search>
          <query>
            index=express
            | spath input=log path=request_ip output=request_ip
            | spath input=log path=type output=type
            | spath input=log path=status output=status
            | search request_ip="${Ip}" type="*"
            | stats count by status
          </query>
          <earliest>-24h@h</earliest>
          <latest>now</latest>
        </search>
        <option name="charting.chart">column</option>
        <option name="charting.drilldown">none</option>
        <option name="charting.axisLabelsX.majorLabelStyle.overflowMode">ellipsisNone</option>
        <option name="charting.axisLabelsX.majorLabelStyle.rotation">0</option>
        <option name="charting.axisTitleX.visibility">visible</option>
        <option name="charting.axisTitleY.visibility">visible</option>
        <option name="charting.axisTitleX.text">Stato HTTP</option>
        <option name="charting.axisTitleY.text">Conteggio</option>
        <option name="charting.legend.placement">right</option>
      </chart>
    </panel>
  </row>
  
  <row>
    <panel>
      <title>Dettaglio numerico</title>
      <table>
        <search>
          <query>
            index=express
            | spath input=log path=request_ip output=request_ip
            | spath input=log path=type output=type
            | spath input=log path=status output=status
            | search request_ip="${Ip}" type="*"
            | stats count by status
            | sort -count
          </query>
          <earliest>-24h@h</earliest>
          <latest>now</latest>
        </search>
        <option name="count">20</option>
        <option name="dataOverlayMode">none</option>
        <option name="drilldown">none</option>
        <option name="percentagesRow">false</option>
      </table>
    </panel>
  </row>
</dashboard>`
    console.log("INVIO RICHIESTA API PER DASHBOARD....\n")

    await dashboardService.createDashboard( Ip, dashboardXML1); //Splunk non vuole punti nel nome della dashboard, per questo sostituiti con underscore
    //await dashboardService.createDashboard('admin', 'search', `user_${DashboardService.increasedNumberforName}_errors`, dashboardXML1);
    
    
    };
    console.log("DOPO AVER CREATO DASHBOARD DASHBOARDCREATED E': ", dashboardService.getdashboardCreated());
    console.log("DOPO AVER CREATO DASHBOARD DASHBOARDCREATED E': ", DashboardService.increasedNumberforName);
    // Inietta stats per PDP
    (req as any).errorStats = stats;

    next();

  } catch (error: any) {
    console.error(`Splunk middleware error: ${error.code || "unknown"} | ${error.message || error.response?.data}`);
     if (error.response) {
        console.error(`Status: ${error.response.status}`);
     }
    //res.status(500).json({ error: 'Internal server error during Splunk processing' });
    next({
        message: error.message,
        code: error.code,
        status: error.response?.status || 500
    }); // continua senza bloccare la request in caso fallisca
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