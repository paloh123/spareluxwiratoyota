const axios = require('axios');
require('dotenv').config();

const API_URL = 'http://localhost:5001/api'; // Changed to 5001
let token = '';

async function login() {
    try {
        console.log('Attempting login...');
        const res = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@toyota.dealer',
            password: 'password123'
        });
        token = res.data.token;
        console.log('Login success');
    } catch (e) {
        console.error('Login failed', e.response ? e.response.data : e.message);
    }
}

async function testEditDelete() {
    await login();
    if (!token) return;

    try {
        // 1. Get an order
        const listRes = await axios.get(`${API_URL}/orders`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const orders = listRes.data.data;
        if (!orders || orders.length === 0) {
            console.log('No orders to test with');
            return;
        }

        const testOrder = orders[0];
        console.log(`Testing with Order ID: ${testOrder.id}, No: ${testOrder.no_order}`);

        // 2. Test Edit
        console.log('--- Testing Edit ---');
        const editRes = await axios.put(`${API_URL}/orders/${testOrder.id}`, {
            no_order: testOrder.no_order,
            tgl_order: testOrder.tgl_order,
            no_rangka: 'TEST-RANGKA-ED',
            model: 'TEST-MODEL-ED',
            no_polisi: 'B 1234 ED',
            nama_pelanggan: 'TEST-PELANGGAN-ED',
            status: 'On Order',
            parts: [
                { no_part: 'PART-ED-1', nama_part: 'EDITED PART 1', qty: 10, status_part: 'On Order' }
            ]
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Edit Result:', editRes.data);

        // 3. Verify Edit
        const verifyRes = await axios.get(`${API_URL}/orders`, {
            params: { search: 'TEST-PELANGGAN-ED' },
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Verification (Search PELANGGAN-ED):', verifyRes.data.data.length > 0 ? 'Success' : 'Failed');

        // 4. Test Delete
        console.log('--- Testing Delete ---');
        const delRes = await axios.delete(`${API_URL}/orders/${testOrder.id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Delete Result:', delRes.data);

    } catch (e) {
        console.error('Test error:', e.response ? e.response.data : e.message);
    }
}

testEditDelete();
