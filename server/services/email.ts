import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';

interface DateRange {
  from: Date;
  to: Date;
}

export async function calculateEmailSummary(range?: DateRange) {
  const where = range ? {
    sentAt: {
      gte: range.from,
      lte: range.to,
    },
  } : {};

  // Cast to any to bypass client generation mismatch
  const aggregate = await (prisma.emailBroadcast as any).aggregate({
    where,
    _count: {
      id: true,
    },
    _sum: {
      recipientsCount: true,
    },
    _avg: {
      openRate: true,
      clickRate: true,
    },
  });

  const totalBroadcasts = aggregate._count.id;
  const totalRecipients = Number(aggregate._sum.recipientsCount || 0);
  const avgOpenRate = Number(aggregate._avg.openRate || 0).toFixed(1);
  const avgClickRate = Number(aggregate._avg.clickRate || 0).toFixed(1);

  return {
    totalBroadcasts,
    totalRecipients,
    avgOpenRate,
    avgClickRate,
    totalOpens: 0,
    totalClicks: 0,
    totalUnsubscribes: 0,
    activeBroadcasts: 0,
  };
}

export async function getBroadcastsList(limit: number = 50) {
  const broadcasts = await (prisma.emailBroadcast as any).findMany({
    orderBy: { sentAt: 'desc' },
    take: limit,
  });

  return broadcasts.map((b: any) => ({
    id: b.id,
    title: b.subject || 'Untitled Broadcast',
    subject: b.subject || 'No Subject',
    sentAt: b.sentAt ? new Date(b.sentAt).toISOString() : new Date().toISOString(),
    recipients: b.recipientsCount,
    openRate: `${Number(b.openRate).toFixed(1)}%`,
    clickRate: `${Number(b.clickRate).toFixed(1)}%`,
    status: 'completed',
  }));
}

export async function getBroadcastsOverTime(range: DateRange) {
  const result = await prisma.$queryRaw<Array<{
    date: Date;
    broadcasts_sent: bigint;
    total_recipients: bigint | null;
    avg_open_rate: number | null;
  }>>`
    SELECT 
      DATE(sent_at) AS date,
      COUNT(*) AS broadcasts_sent,
      COALESCE(SUM(recipients_count), 0) AS total_recipients,
      COALESCE(AVG(open_rate), 0)::numeric AS avg_open_rate
    FROM email_broadcasts
    WHERE sent_at >= ${range.from}::timestamptz
      AND sent_at <= ${range.to}::timestamptz
    GROUP BY DATE(sent_at)
    ORDER BY date ASC
  `;

  const categories = result.map(r => r.date.toISOString().split('T')[0]);
  const series = [
    {
      name: 'Broadcasts Sent',
      data: result.map(r => Number(r.broadcasts_sent)),
    },
    {
      name: 'Recipients',
      data: result.map(r => Number(r.total_recipients || 0)),
    },
  ];

  return { series, categories };
}
