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
    /*
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

    */// 3. Create dashboard
    
     const dashboardXMLFinale = `<dashboard>
  <label>Report per IP: ${Ip}</label>
  <description>Dashboard di monitoraggio per l'utente/IP specifico. Include informazioni sull'utente, pattern temporali di attività, score di sicurezza e tipologie di richieste.</description>
  <!-- Sezione Informazioni Utente -->
  <!-- Sezione Pattern Temporale Attività -->
  <!-- Sezione Score -->
  <!-- Sezione Tipologie Richieste -->
  <row>
    <panel>
      <title>Informazioni Utente</title>
      <single>
        <title>IP</title>
        <search>
          <query>index=express | spath input=log path=request_ip output=request_ip | search request_ip="${Ip}" | stats latest(request_ip) as IP</query>
        </search>
        <option name="colorMode">block</option>
        <option name="drilldown">none</option>
        <option name="height">102</option>
        <option name="rangeColors">["0x53a051","0x0877a6","0xf8be34","0xf1813f","0xdc4e41"]</option>
        <option name="trellis.enabled">1</option>
        <option name="useColors">0</option>
      </single>
      <single>
        <title>ID Utente</title>
        <search>
          <query>index=express | spath input=log path=request_ip output=request_ip | spath input=log path=user_id output=user_id | search request_ip="${Ip}" | stats latest(user_id) as "ID Utente"</query>
        </search>
        <option name="height">100</option>
        <option name="trellis.enabled">1</option>
        <option name="trellis.size">medium</option>
      </single>
      <single>
        <title>Nome Utente</title>
        <search>
          <query>index=express | spath input=log path=request_ip output=request_ip | spath input=log path=user_name output=user_name | search request_ip="${Ip}" | where user_name != " " | stats latest(user_name) as Nome</query>
        </search>
        <option name="height">100</option>
        <option name="rangeColors">["0x53a051","0x0877a6","0xf8be34","0xf1813f","0xdc4e41"]</option>
        <option name="trellis.enabled">1</option>
      </single>
      <single>
        <title>Ruolo Utente</title>
        <search>
          <query>index=express | spath input=log path=request_ip output=request_ip | spath input=log path=user_role output=user_role | search request_ip="${Ip}" | where user_role != " " | stats latest(user_role) as Ruolo</query>
        </search>
        <option name="height">113</option>
        <option name="trellis.enabled">1</option>
      </single>
      <single>
        <title>Team Utente</title>
        <search>
          <query>index=express | spath input=log path=request_ip output=request_ip | spath input=log path=user_team output=user_team | search request_ip="${Ip}" | where user_team != " " | stats latest(user_team) as Team</query>
        </search>
        <option name="height">96</option>
        <option name="trellis.enabled">1</option>
      </single>
    </panel>
  </row>
  <row>
    <panel>
      <title>Pattern Temporale Attività</title>
      <chart>
        <title>Fasce Orarie Lavorative nei diversi Giorni Della Settimana</title>
        <search>
          <query>index=express | spath input=log path=request_ip output=request_ip 
          | search request_ip="${Ip}" 
          | eval time_range=case(tonumber(strftime(_time, "%H"))&lt;7, "Notte (00:00-07:00)", 
                                tonumber(strftime(_time, "%H"))&lt;13, "Mattina (07:00-13:00)", 
                                tonumber(strftime(_time, "%H"))&lt;19, "Pomeriggio (13:00-19:00)", 
                                true(), "Sera (19:00-24:00)") 
          | bin _time span=1d  
          | eval day=strftime(_time, "%a %b %d %Y") 
          | stats count by day, time_range 
          | xyseries day time_range count</query>
          <earliest>-7d@d</earliest>
          <latest>now</latest>
          <refresh>1m</refresh>
        </search>
        <option name="charting.axisTitleX.text">Giorno</option>
        <option name="charting.axisTitleY.text">Numero Richieste</option>
        <option name="charting.chart">column</option>
        <option name="charting.drilldown">none</option>
        <option name="charting.fieldColors">{"Notte (00:00-07:00)": "#2c3e50", "Mattina (07:00-13:00)": "#3498db", "Pomeriggio (13:00-19:00)": "#e67e22", "Sera (19:00-24:00)": "#9b59b6"}</option>
        <option name="charting.legend.placement">right</option>
      </chart>
    </panel>
  </row>
  <row>
    <panel>
      <title>Andamento Score</title>
      <chart>
        <title>Variazione dello Score nell'ultima Ora</title>
        <search>
          <query>index=score | spath input=log path=request_ip output=request_ip  | spath input=log path=score output=score | search request_ip="${Ip}" | where isnotnull(score) AND score != "" | timechart span=2m latest(score) as score</query>
          <earliest>-1h</earliest>
          <latest>now</latest>
          <refresh>1m</refresh>
        </search>
        <option name="charting.axisLabelsY2.majorUnit">10</option>
        <option name="charting.axisTitleX.text">Tempo</option>
        <option name="charting.axisTitleY.text">Score</option>
        <option name="charting.axisY2.enabled">0</option>
        <option name="charting.axisY2.maximumNumber">100</option>
        <option name="charting.axisY2.minimumNumber">1</option>
        <option name="charting.chart">line</option>
        <option name="charting.chart.nullValueMode">connect</option>
        <option name="charting.chart.showDataLabels">none</option>
        <option name="charting.drilldown">all</option>
      </chart>
    </panel>
  </row>
  <row>
    <panel>
      <title>Score di Fiducia</title>
      <single>
        <title>Score Corrente</title>
        <search>
          <query>index=score | spath input=log path=request_ip output=request_ip | spath input=log path=score output=score | search request_ip="${Ip}" | where isnotnull(score) AND score != "" | stats latest(score) as Score
            | eval color=case(
                Score&lt;20,"red",
                Score&lt;40,"orange",
                Score&lt;60,"yellow",
                Score&lt;80,"lightgreen",
                Score&lt;100,"green")
          </query>
          <earliest>-15m</earliest>
          <latest>now</latest>
          <refresh>1m</refresh>
        </search>
        <option name="colorMode">block</option>
        <option name="rangeColors">["0xd41f1f","0xe98300","0xf8be34","0x118832","0x003f24"]</option>
        <option name="rangeValues">[20,40,60,80]</option>
        <option name="trellis.enabled">0</option>
        <option name="useColors">1</option>
      </single>
    </panel>
    <panel>
      <title>Range Score</title>
      <chart>
        <title>Min 0 - Max 100</title>
        <search>
          <query>index=score | spath input=log path=request_ip output=request_ip | spath input=log path=score output=score | search request_ip="${Ip}" | where isnotnull(score) AND score != "" | stats latest(score) as Score</query>
          <earliest>-15m</earliest>
          <latest>now</latest>
          <sampleRatio>1</sampleRatio>
          <refresh>1m</refresh>
          <refreshType>delay</refreshType>
        </search>
        <option name="charting.axisLabelsX.majorLabelStyle.overflowMode">ellipsisNone</option>
        <option name="charting.axisLabelsX.majorLabelStyle.rotation">0</option>
        <option name="charting.axisTitleX.visibility">visible</option>
        <option name="charting.axisTitleY.visibility">visible</option>
        <option name="charting.axisTitleY2.visibility">visible</option>
        <option name="charting.axisX.abbreviation">none</option>
        <option name="charting.axisX.scale">linear</option>
        <option name="charting.axisY.abbreviation">none</option>
        <option name="charting.axisY.scale">linear</option>
        <option name="charting.axisY2.abbreviation">none</option>
        <option name="charting.axisY2.enabled">0</option>
        <option name="charting.axisY2.scale">inherit</option>
        <option name="charting.chart">markerGauge</option>
        <option name="charting.chart.bubbleMaximumSize">50</option>
        <option name="charting.chart.bubbleMinimumSize">10</option>
        <option name="charting.chart.bubbleSizeBy">area</option>
        <option name="charting.chart.nullValueMode">gaps</option>
        <option name="charting.chart.rangeValues">[1,20,40,60,80,100]</option>
        <option name="charting.chart.showDataLabels">none</option>
        <option name="charting.chart.sliceCollapsingThreshold">0.01</option>
        <option name="charting.chart.stackMode">default</option>
        <option name="charting.chart.style">minimal</option>
        <option name="charting.gaugeColors">["0xd41f1f","0xff8700","0xcba700","0x118832","0x003f24"]</option>
        <option name="charting.layout.splitSeries">0</option>
        <option name="charting.layout.splitSeries.allowIndependentYRanges">0</option>
        <option name="charting.legend.labelStyle.overflowMode">ellipsisMiddle</option>
        <option name="charting.legend.mode">standard</option>
        <option name="charting.legend.placement">right</option>
        <option name="charting.lineWidth">2</option>
        <option name="refresh.display">none</option>
        <option name="trellis.enabled">0</option>
        <option name="trellis.scales.shared">1</option>
        <option name="trellis.size">medium</option>
      </chart>
    </panel>
  </row>
  <row>
    <panel>
      <title>Stato Richieste</title>
      <chart>
        <title>Distribuzione delle richieste dell'utente in base a Http Status</title>
        <search>
          <query>index=express | spath input=log path=request_ip output=request_ip  | spath input=log path=status output=status 
          | search request_ip="${Ip}" 
          | eval status_type=case(status=200, "Successo (200)", 
                                 status=201, "Creato (201)", 
                                 status=403, "Forbidden (403)", 
                                 true(), "Altro (" + status + ")") 
          | stats count by status_type</query>
          <earliest>-7d@d</earliest>
          <latest>now</latest>
          <refresh>1m</refresh>
        </search>
        <option name="charting.chart">pie</option>
        <option name="charting.drilldown">none</option>
        <option name="charting.legend.placement">right</option>
      </chart>
    </panel>
  </row>
  <row>
    <panel>
      <title>Dettaglio Richieste Recenti</title>
      <table>
        <title>Struttura al dettaglio delle ultime 10 richieste fatte dall'utente</title>
        <search>
          <query>index=express 
          | spath input=log path=request_ip output=request_ip  
          | spath input=log path=body output=body 
          | spath input=log path=body.success output=body.success 
          | spath input=log path=body.success.description output=body.success.description 
          | spath input=log path=body.error output=body.error 
          | spath input=log path=body.error.description output=body.error.description 
          | spath input=log path=status output=status 
          | spath input=log path=body.data output=body.data 
          | spath input=log path=body.data.target_team output=body.data.target_team
          | spath input=log path=method output=method 
          | spath input=log path=path output=path 
          | search request_ip="${Ip}" 
          | eval method_path=method + " " + path 
          | eval description=if(isnotnull('body.error.description'), 'body.error.description', 
                              if(isnotnull('body.success.description'), 'body.success.description', "N/A")) 
          | eval target_team=if(isnotnull('body.data.target_team'), 'body.data.target_team', "N/A") 
          | table _time, method_path, status, description, target_team 
          | sort - _time 
          | head 10</query>
          <earliest>-24h@h</earliest>
          <latest>now</latest>
          <refresh>1m</refresh>
        </search>
        <option name="dataOverlayMode">none</option>
        <option name="drilldown">row</option>
        <option name="rowNumbers">false</option>
        <option name="wrap">true</option>
        <fields>["_time","method_path","status","description","target_team"]</fields>
      </table>
    </panel>
  </row>
</dashboard>`
    console.log("PRIMA DI CREARE DASHBOARD NUMBERFORNAME ");

    await dashboardService.createOrUpdateDashboard(Ip,dashboardXMLFinale);
    
    console.log("DOPO AVER CREATO DASHBOARD DASHBOARDCREATED ");
    
    next();

  } catch (error: any) {
    console.error(`Splunk middleware error: ${error.code || "unknown"} | ${error.message || error.response?.data}`);
     if (error.response) {
        console.error(`Status: ${error.response.status}`);
     }
        const message = errorMessageFactory.createMessage(ErrorMessage.generalError, 'Error with dashboard request');
    return res.json({ error: message });

  };
};


 /*export const statusforAllIP = async(req: Request, res: Response, next: NextFunction) => {
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

    next();

  } catch (error) {
    console.error('Splunk middleware error:', error);
    //res.status(500).json({ error: 'Internal server error during Splunk processing' });
    next(); // continua senza bloccare la request in caso fallisca
  }
};*/