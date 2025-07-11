import { Request, Response, NextFunction } from 'express';
import { SearchService } from '../api/endpoints/SearchService';
import { DashboardService } from '../api/endpoints/DashboardService';

export const splunkTrustMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const userOrIp = req.headers['x-user-id'] as string || req.ip as string;

  const searchService = new SearchService();
  const dashboardService = new DashboardService();

  try {
    // 1. Search logs
    const logs = await searchService.searchLogs('express', userOrIp, 'error');
    console.log('Splunk query results:', logs)

    // 2. Calculate stats
    const stats = logs.results.reduce((acc: any, log: any) => {
      const status = log.result.status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    console.log(`Error stats for ${userOrIp}:`, stats);

    // 3. Create dashboard
    const dashboardXML = `
<dashboard>
  <label>User ${userOrIp} Error Stats</label>
  <row>
    <panel>
      <title>Error Counts</title>
      <chart>
        <searchString>search index=squid (user="${userOrIp}" OR ip_address="${userOrIp}") status="error" | stats count by status</searchString>
        <option name="charting.chart">pie</option>
      </chart>
    </panel>
  </row>
</dashboard>
    `;

    await dashboardService.createDashboard('admin', 'search', `user_${userOrIp}_errors`, dashboardXML);

    // Inietta stats per PDP
    (req as any).errorStats = stats;

    next();
  } catch (error) {
    console.error('Splunk middleware error:', error);
    res.status(500).json({ error: 'Internal server error during Splunk processing' });
  }
};
