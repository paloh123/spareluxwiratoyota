const https = require('https');

const url = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSb4VFJNhlBzRs3Sl4DQ7gBO9iNYIOpVdgM2IgGCsrY8rvUFjQLfgk41Scw481JYhBwnUwZNoy2KwaP/pub?gid=1025171610&single=true&output=csv';

console.log('Testing partial fetch (100 bytes)...');
const req = https.get(url, { headers: { 'Range': 'bytes=0-100' } }, (res) => {
    console.log('Status:', res.statusCode);
    console.log('Headers:', res.headers);
    res.on('data', (d) => {
        console.log('Data:', d.toString());
        process.exit(0);
    });
});

req.on('error', (e) => {
    console.error('Error:', e.message);
    process.exit(1);
});

setTimeout(() => {
    console.error('Test timed out (20s)');
    process.exit(1);
}, 20000);
