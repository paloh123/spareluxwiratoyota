const { syncWithGSheet } = require('./utils/gsheetSync');

async function testSync() {
    console.log('--- Manual Sync Test Start ---');
    const result = await syncWithGSheet();
    if (result.success) {
        console.log('SUCCESS:', result.message || 'Sync completed successfully');
        console.log('Count:', result.count);
        console.log('Time:', result.time, 's');
    } else {
        console.error('FAILED:', result.error);
    }
    console.log('--- Manual Sync Test End ---');
    process.exit(result.success ? 0 : 1);
}

testSync();
