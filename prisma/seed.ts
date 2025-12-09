import { PrismaClient, UserRole, TeamMemberRole, LeadStatus, EnrollmentStatus, CallStatus, PaymentStatus, InstallmentStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ========== CLEAN UP EXISTING DATA ==========
  console.log('Cleaning existing data...');

  // Drop views first (if they exist)
  try {
    await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS analytics CASCADE`);
  } catch (e) {
    // Ignore if schema doesn't exist
  }

  // Clean tables in order of dependencies
  await prisma.dailyMetric.deleteMany();
  await prisma.installment.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.salesCall.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.student.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.adPerformance.deleteMany();
  await prisma.adCampaign.deleteMany();
  await prisma.program.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ Cleaned existing data');

  // ========== CREATE USERS (Platform Access) ==========
  const passwordHash = await bcrypt.hash('password123', 10);

  const users = await Promise.all([
    prisma.user.create({
      data: { email: 'admin@demo.com', passwordHash, role: UserRole.ADMIN, name: 'Admin User' },
    }),
    prisma.user.create({
      data: { email: 'sales@demo.com', passwordHash, role: UserRole.SALES, name: 'Sales Manager' },
    }),
    prisma.user.create({
      data: { email: 'marketing@demo.com', passwordHash, role: UserRole.MARKETING, name: 'Marketing Director' },
    }),
  ]);

  console.log('✅ Created platform users');

  // ========== CREATE TEAM MEMBERS (Sales Staff) ==========
  const teamMembers = await Promise.all([
    // Closers
    prisma.teamMember.create({ data: { firstName: 'John', lastName: 'Closer', role: TeamMemberRole.CLOSER } }),
    prisma.teamMember.create({ data: { firstName: 'Jessica', lastName: 'Closer', role: TeamMemberRole.CLOSER } }),

    // Setters
    prisma.teamMember.create({ data: { firstName: 'Mike', lastName: 'Setter', role: TeamMemberRole.SETTER } }),
    prisma.teamMember.create({ data: { firstName: 'Lisa', lastName: 'Setter', role: TeamMemberRole.SETTER } }),

    // DM Setters
    prisma.teamMember.create({ data: { firstName: 'Alex', lastName: 'DM', role: TeamMemberRole.DM_SETTER } }),
    prisma.teamMember.create({ data: { firstName: 'Emma', lastName: 'DM', role: TeamMemberRole.DM_SETTER } }),
  ]);

  const closers = teamMembers.filter(tm => tm.role === TeamMemberRole.CLOSER);
  const setters = teamMembers.filter(tm => tm.role === TeamMemberRole.SETTER);
  const dmSetters = teamMembers.filter(tm => tm.role === TeamMemberRole.DM_SETTER);
  const allSetters = [...setters, ...dmSetters];

  console.log('✅ Created team members');

  // ========== CREATE PROGRAMS ==========
  const programs = await Promise.all([
    prisma.program.create({ data: { name: 'Career Accelerator', price: 5000.00 } }),
    prisma.program.create({ data: { name: 'Elite Coaching', price: 10000.00 } }),
    prisma.program.create({ data: { name: 'Self-Paced Course', price: 997.00 } }),
  ]);

  console.log('✅ Created programs');

  // ========== CREATE ADS ==========
  const CAMPAIGNS = [
    { name: 'Cold Traffic - FB', platform: 'facebook' },
    { name: 'Retargeting - IG', platform: 'instagram' },
    { name: 'Search - Google', platform: 'google' },
  ];

  const campaigns = await Promise.all(
    CAMPAIGNS.map(c => prisma.adCampaign.create({ data: c }))
  );

  // Ad Performance Data (Last 90 days)
  const now = new Date();
  const daysAgo = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d;
  };

  for (let i = 0; i < 90; i++) {
    const date = daysAgo(i);
    for (const campaign of campaigns) {
      const spend = Math.random() * 500 + 100;
      const impressions = Math.floor(spend * (Math.random() * 20 + 10));
      const clicks = Math.floor(impressions * (Math.random() * 0.02 + 0.01));
      const leads = Math.floor(clicks * (Math.random() * 0.1 + 0.05));
      const revenue = leads * (Math.random() * 100); // Rough estimate

      await prisma.adPerformance.create({
        data: {
          campaignId: campaign.id,
          date,
          spend,
          impressions,
          clicks,
          leads,
          revenue,
        }
      });
    }
  }
  console.log('✅ Created ad performance data');

  // ========== CREATE LEADS & SALES CALLS ==========
  const leads = [];
  const SOURCES = ['Ads', 'Organic', 'Referral'];

  for (let i = 0; i < 200; i++) {
    const date = daysAgo(Math.floor(Math.random() * 90));
    const status = Object.values(LeadStatus)[Math.floor(Math.random() * Object.values(LeadStatus).length)];
    const source = SOURCES[Math.floor(Math.random() * SOURCES.length)];

    let campaignName = null;
    let medium = null;

    if (source === 'Ads') {
      const randomCampaign = campaigns[Math.floor(Math.random() * campaigns.length)];
      campaignName = randomCampaign.name;
      medium = randomCampaign.platform === 'google' ? 'Search' : 'Social';
    } else if (source === 'Organic') {
      medium = 'Social';
      campaignName = 'Organic Content';
    } else {
      medium = 'Word of Mouth';
    }

    const lead = await prisma.lead.create({
      data: {
        email: `lead${i}@example.com`,
        firstName: `Lead${i}`,
        lastName: `Doe`,
        phone: `555-01${i.toString().padStart(2, '0')}`,
        source: source,
        campaign: campaignName,
        medium: medium,
        term: source === 'Ads' ? 'coaching' : null,
        status: status as LeadStatus,
        createdAt: date,
      }
    });
    leads.push(lead);

    // Create Sales Call for some leads
    if (Math.random() > 0.3) {
      const host = closers[Math.floor(Math.random() * closers.length)];
      const setter = Math.random() > 0.5 ? allSetters[Math.floor(Math.random() * allSetters.length)] : null;

      await prisma.salesCall.create({
        data: {
          leadId: lead.id,
          hostId: host.id,
          setterId: setter?.id,
          startTime: date,
          endTime: new Date(date.getTime() + 60 * 60 * 1000), // 1 hour
          status: Math.random() > 0.2 ? CallStatus.COMPLETED : CallStatus.NO_SHOW,
          outcome: Math.random() > 0.5 ? 'Interested' : 'Not Interested',
        }
      });
    }
  }
  console.log('✅ Created leads and sales calls');

  // ========== CREATE STUDENTS & ENROLLMENTS ==========
  // Convert some leads to students
  console.log('LeadStatus values:', Object.values(LeadStatus));
  const qualifiedLeads = leads.filter(l => l.status === LeadStatus.QUALIFIED);
  console.log(`Total leads: ${leads.length}`);
  console.log(`Qualified leads: ${qualifiedLeads.length}`);
  const convertedLeads = qualifiedLeads.slice(0, 50);
  for (const lead of convertedLeads) {
    const student = await prisma.student.create({
      data: {
        email: lead.email,
        firstName: lead.firstName || 'Unknown',
        lastName: lead.lastName || 'Student',
        phone: lead.phone,
        // joinedAt: new Date(), // joinedAt does not exist
      }
    });

    const program = programs[Math.floor(Math.random() * programs.length)];
    const isSplit = Math.random() > 0.5;
    const contractValue = Number(program.price);

    const enrollment = await prisma.enrollment.create({
      data: {
        studentId: student.id,
        programId: program.id,
        status: EnrollmentStatus.ACTIVE,
        startDate: new Date(),
        planType: isSplit ? 'SPLIT' : 'PIF',
        contractValue: contractValue,
        closerId: closers[Math.floor(Math.random() * closers.length)].id,
        setterId: allSetters[Math.floor(Math.random() * allSetters.length)].id,
      }
    });

    // Create Payments/Installments
    if (isSplit) {
      // Create 3 installments
      const installmentAmount = contractValue / 3;
      for (let i = 0; i < 3; i++) {
        const dueDate = new Date();
        dueDate.setMonth(dueDate.getMonth() + i);

        await prisma.installment.create({
          data: {
            enrollmentId: enrollment.id,
            dueDate: dueDate,
            amount: installmentAmount,
            status: i === 0 ? InstallmentStatus.PAID : InstallmentStatus.PENDING,
          }
        });

        if (i === 0) {
          await prisma.payment.create({
            data: {
              enrollmentId: enrollment.id,
              amount: installmentAmount,
              date: new Date(),
              status: PaymentStatus.PAID,
              method: 'Credit Card',
              email: student.email,
            }
          });
        }
      }
    } else {
      // PIF
      await prisma.payment.create({
        data: {
          enrollmentId: enrollment.id,
          amount: contractValue,
          date: new Date(),
          status: PaymentStatus.PAID,
          method: 'Credit Card',
          email: student.email,
        }
      });
    }
  }

  console.log('✅ Created students, enrollments, and payments');

  // ========== CREATE DAILY METRICS ==========
  // Generate synthetic metrics for team members
  for (let i = 0; i < 90; i++) {
    const date = daysAgo(i);

    for (const tm of teamMembers) {
      const metricData: any = {
        teamMemberId: tm.id,
        date,
        notes: Math.random() > 0.8 ? 'Had a great day!' : null,
      };

      console.log(`Seeding for ${tm.firstName} (${tm.role})`);

      if (tm.role === TeamMemberRole.CLOSER) {
        // Closer Metrics
        const scheduled = Math.floor(Math.random() * 8) + 4; // 4-11 calls
        const live = Math.floor(scheduled * (Math.random() * 0.3 + 0.7)); // 70-100% show rate
        const offers = Math.floor(live * (Math.random() * 0.4 + 0.5)); // 50-90% offer rate
        const closes = Math.floor(offers * (Math.random() * 0.4 + 0.2)); // 20-60% close rate
        const cash = closes * 5000;

        metricData.scheduledCalls = scheduled;
        metricData.liveCalls = live;
        metricData.offersMade = offers;
        metricData.closes = closes;
        metricData.cashCollected = cash;
        metricData.revenue = cash;
        metricData.reschedules = Math.floor(Math.random() * 3);
        metricData.struggles = Math.random() > 0.9 ? 'No shows were high today' : null;

      } else if (tm.role === TeamMemberRole.SETTER) {
        // Setter Metrics
        const calls = Math.floor(Math.random() * 60) + 40; // 40-100 calls
        const live = Math.floor(calls * (Math.random() * 0.15 + 0.1)); // 10-25% pickup
        const booked = Math.floor(live * (Math.random() * 0.3 + 0.2)); // 20-50% booking rate

        metricData.callsMade = calls;
        metricData.liveCalls = live;
        metricData.bookedCalls = booked;
        metricData.reschedules = Math.floor(Math.random() * 3);
        metricData.unqualifiedLeads = Math.floor(Math.random() * 5);

      } else if (tm.role === TeamMemberRole.DM_SETTER) {
        // DM Setter Metrics
        const dms = Math.floor(Math.random() * 60) + 40; // 40-100 DMs
        const convos = Math.floor(dms * (Math.random() * 0.4 + 0.3)); // 30-70% response
        const booked = Math.floor(convos * (Math.random() * 0.2 + 0.1)); // 10-30% booking rate

        metricData.dmsSent = dms;
        metricData.conversationsStarted = convos;
        metricData.bookedCalls = booked;
        metricData.reschedules = Math.floor(Math.random() * 3);
        metricData.unqualifiedLeads = Math.floor(Math.random() * 5);
      }

      await prisma.dailyMetric.create({
        data: metricData
      });
    }
  }
  console.log('✅ Created daily metrics');

  console.log('\n🎉 Database seeded successfully!');
  console.log('\nDemo Portal Credentials:');
  console.log('  Admin: admin@demo.com / password123');
  console.log('  Sales: sales@demo.com / password123');
  console.log('  Marketing: marketing@demo.com / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
