import {defineConfig} from '@playwright/test';
const baseURL='http://127.0.0.1:4173'+(process.env.PAGES_BASE_PATH||'/CircuitCheck_MultiPlatform/');
export default defineConfig({
 testDir:'./pages-tests',timeout:30000,workers:1,
 use:{baseURL,channel:process.env.PW_CHANNEL||undefined,trace:'retain-on-failure',screenshot:'only-on-failure'},
 webServer:{command:'node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --mode pages --outDir dist-pages --port 4173 --strictPort',url:baseURL,timeout:30000,reuseExistingServer:!process.env.CI},
 reporter:[['list']]
});
