
import { PrismaClient } from '@prisma/client';


const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:5000'; // Assuming dev server is running on 5000

async function main() {
    console.log('🔍 Verifying Closer EOD Form...');

    // 1. Verify Public Closers Endpoint
    console.log('Checking GET /api/public/closers...');
    try {
        const res = await fetch(`${BASE_URL}/api/public/closers`);
        if (!res.ok) {
            throw new Error(`Failed to fetch closers: ${res.status} ${res.statusText}`);
        }
        const data = await res.json();
        console.log(`✅ Fetched ${data.members.length} closers`);

        if (data.members.length === 0) {
            console.warn('⚠️ No closers found. Seeding might be needed.');
            return;
        }

        const closerId = data.members[0].id;
        console.log(`Using closer ID: ${closerId} (${data.members[0].name})`);

        // 2. Verify Form Submission
        console.log('Checking POST /api/sales/closer-eod...');
        const payload = {
            closerId: closerId,
            date: new Date().toISOString().split('T')[0],
            scheduledCalls: 5,
            liveCalls: 4,
            offersMade: 3,
            closes: 2,
            cashCollected: 1500.00,
            struggles: 'Verification Test Struggle',
            notes: 'Verification Test Note'
        };

        const submitRes = await fetch(`${BASE_URL}/api/sales/closer-eod`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!submitRes.ok) {
            const err = await submitRes.text();
            throw new Error(`Failed to submit EOD: ${submitRes.status} ${submitRes.statusText} - ${err}`);
        }

        const submitData = await submitRes.json();
        console.log('✅ EOD Report submitted successfully');

        // 3. Verify Database Update
        console.log('Verifying database...');
        const metric = await prisma.dailyMetric.findFirst({
            where: {
                teamMemberId: closerId,
                date: {
                    gte: new Date(new Date().setHours(0, 0, 0, 0)),
                    lt: new Date(new Date().setHours(23, 59, 59, 999)),
                }
            }
        });

        if (!metric) {
            throw new Error('❌ Metric not found in database');
        }

        if (
            metric.scheduledCalls === payload.scheduledCalls &&
            metric.liveCalls === payload.liveCalls &&
            metric.offersMade === payload.offersMade &&
            metric.closes === payload.closes &&
            Number(metric.cashCollected) === payload.cashCollected &&
            metric.struggles === payload.struggles &&
            metric.notes === payload.notes
        ) {
            console.log('✅ Database verification passed');
        } else {
            console.error('❌ Database verification failed. Data mismatch:', metric);
        }

    } catch (error) {
        console.error('❌ Verification failed:', error);
        process.exit(1);
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
