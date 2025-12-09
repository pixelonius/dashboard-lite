
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const BASE_URL = "http://localhost:5000";

async function verifyDmSetterEod() {
    console.log("Starting DM Setter EOD Verification...");

    try {
        // 1. Fetch DM Setters
        console.log("\n1. Fetching DM Setters...");
        const settersRes = await fetch(`${BASE_URL}/api/public/dm-setters`);
        if (!settersRes.ok) throw new Error(`Failed to fetch DM setters: ${settersRes.statusText}`);
        const settersData = await settersRes.json();
        console.log("DM Setters fetched:", settersData.members.length);

        if (settersData.members.length === 0) {
            console.warn("No DM Setters found. Cannot proceed with submission verification.");
            return;
        }

        const testSetter = settersData.members[0];
        console.log("Using DM Setter:", testSetter);

        // 2. Submit EOD Report
        console.log("\n2. Submitting EOD Report...");
        const today = new Date().toISOString().split('T')[0];
        const payload = {
            dmSetterId: testSetter.id,
            date: today,
            dmsSent: 50,
            conversationsStarted: 20,
            bookedCalls: 5,
            reschedules: 1,
            unqualifiedLeads: 2,
            notes: "Verification Test Note",
        };

        const submitRes = await fetch(`${BASE_URL}/api/sales/dm-setter-eod`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!submitRes.ok) {
            const errorText = await submitRes.text();
            throw new Error(`Failed to submit EOD report: ${submitRes.status} - ${errorText}`);
        }

        const submitData = await submitRes.json();
        console.log("EOD Report submitted successfully:", submitData);

        // 3. Verify Database Persistence
        console.log("\n3. Verifying Database Persistence...");
        const metric = await prisma.dailyMetric.findFirst({
            where: {
                teamMemberId: testSetter.id,
                date: {
                    gte: new Date(new Date(today).setHours(0, 0, 0, 0)),
                    lt: new Date(new Date(today).setHours(23, 59, 59, 999)),
                },
            },
        });

        if (!metric) throw new Error("Metric not found in database!");

        console.log("Database Metric Found:", metric);

        if (
            metric.dmsSent === payload.dmsSent &&
            metric.conversationsStarted === payload.conversationsStarted &&
            metric.bookedCalls === payload.bookedCalls &&
            metric.reschedules === payload.reschedules &&
            metric.unqualifiedLeads === payload.unqualifiedLeads &&
            metric.notes === payload.notes
        ) {
            console.log("SUCCESS: Database values match payload!");
        } else {
            console.error("MISMATCH: Database values do not match payload!");
            console.error("Expected:", payload);
            console.error("Actual:", metric);
        }

    } catch (error) {
        console.error("Verification Failed:", error);
    } finally {
        await prisma.$disconnect();
    }
}

verifyDmSetterEod();
