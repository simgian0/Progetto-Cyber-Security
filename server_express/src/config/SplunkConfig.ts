/** This file configures access to Splunk using environment variables */

import * as dotenv from 'dotenv';
dotenv.config();

// Splunk config and credentials
export const SplunkConfig = {
  host: process.env.SPLUNK_BASE_URL || 'https://splunk:8089',
  username: process.env.SPLUNK_USERNAME || 'admin',
  password: process.env.SPLUNK_PASSWORD || 'Chang3d!',
};
