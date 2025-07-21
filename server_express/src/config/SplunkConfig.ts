/** Questo file configura l'accesso a Splunk usando variabili d'ambiente */

import * as dotenv from 'dotenv';
dotenv.config();

//TO IMPROVE: Usa OAuth2 o Token temporanei se Splunk lo supporta.
export const SplunkConfig = {
  host: process.env.SPLUNK_BASE_URL || 'https://splunk:8089',
  username: process.env.SPLUNK_USERNAME || 'admin',
  password: process.env.SPLUNK_PASSWORD || 'Chang3d!',
};
