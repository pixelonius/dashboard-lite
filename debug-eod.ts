


const BASE_URL = 'http://localhost:5000';

async function main() {
    console.log('🔍 Debugging Closer EOD Form...');

    // 1. Fetch Closers
    console.log('Fetching closers...');
    const closersRes = await fetch(`${BASE_URL}/api/public/closers`);
    if (!closersRes.ok) {
        console.error('Failed to fetch closers:', await closersRes.text());
        return;
    }
    const closersData = await closersRes.json();
    if (closersData.members.length === 0) {
        console.error('No closers found.');
        return;
    }
    const closerId = closersData.members[0].id;
    console.log(`Using closer ID: ${closerId}`);

    // 2. Test Payload (Simulating frontend)
    const payload = {
        closerId: closerId,
        date: new Date().toISOString().split('T')[0],
        scheduledCalls: 5,
        liveCalls: 4,
        offersMade: 3,
        closes: 2,
        cashCollected: 1500.00,
        struggles: "", // Empty string as sent by frontend if empty
        notes: ""      // Empty string as sent by frontend if empty
    };

    console.log('Sending payload:', JSON.stringify(payload, null, 2));

    const res = await fetch(`${BASE_URL}/api/sales/closer-eod`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!res.ok) {
        const err = await res.text();
        console.error('❌ Submission Failed:', res.status, res.statusText);
        console.error('Response Body:', err);
    } else {
        const data = await res.json();
        console.log('✅ Submission Successful:', data);
    }
}

main().catch(console.error);
