const fs = require('fs');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

async function download() {
    try {
        const response = await fetch('https://docs.google.com/spreadsheets/d/e/2PACX-1vSb4VFJNhlBzRs3Sl4DQ7gBO9iNYIOpVdgM2IgGCsrY8rvUFjQLfgk41Scw481JYhBwnUwZNoy2KwaP/pub?gid=1025171610&single=true&output=csv');
        const text = await response.text();
        fs.writeFileSync('gsheet_sample.csv', text);
        console.log('Download complete');
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

download();
