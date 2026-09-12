import { getEnv } from './config/env.js';

const env = getEnv();
const status = document.querySelector('#runtime-status');

if (status) {
  status.textContent = `Ambiente: ${env.appEnv} | Provider: ${env.dataProvider}`;
}
