const axios = require('axios');

const url = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSb4VFJNhlBzRs3Sl4DQ7gBO9iNYIOpVdgM2IgGCsrY8rvUFjQLfgk41Scw481JYhBwnUwZNoy2KwaP/pub?gid=1025171610&single=true&output=csv';

async function test() {
    console.log('Fetching URL...');
    try {
        const res = await axios.get(url, { timeout: 30000 });
        console.log('Status:', res.status);
        console.log('Content-Type:', res.headers['content-type']);
        console.log('Body Preview (1000 chars):');
        console.log(res.data.toString().substring(0, 1000));
    } catch (e) {
        console.error('Error:', e.message);
        if (e.response) {
            console.log('Error Status:', e.response.status);
            console.log('Error Body:', e.response.data.toString().substring(0, 500));
        }
    }
}

test();
