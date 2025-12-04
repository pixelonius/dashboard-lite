import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';
import type { DateRange } from '../utils/date';

export async function calculateAdsSummary(range: DateRange) {
  const { from, to } = range;

  const aggregate = await prisma.adPerformance.aggregate({
    where: {
      date: { gte: from, lte: to },
      spend: { gt: 0 },
    },
    _sum: {
      spend: true,
      impressions: true,
      clicks: true,
      leads: true,
      purchases: true,
      revenue: true,
    },
  });

  const totalSpend = Number(aggregate._sum.spend || 0);
  const impressions = Number(aggregate._sum.impressions || 0);
  const clicks = Number(aggregate._sum.clicks || 0);
  const leadsCaptured = Number(aggregate._sum.leads || 0);
  const conversions = Number(aggregate._sum.purchases || 0);
  const revenueAttributed = Number(aggregate._sum.revenue || 0);

  const cpl = leadsCaptured > 0 ? totalSpend / leadsCaptured : 0;

  // Count distinct campaigns
  const activeCampaigns = await prisma.adPerformance.groupBy({
    by: ['campaignId'],
    where: {
      date: { gte: from, lte: to },
      spend: { gt: 0 },
    },
  }).then(res => res.length);

  // Calculate days in range for avg daily spend
  const daysInRange = Math.max(1, Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)));
  const avgDailySpend = totalSpend / daysInRange;

  // Platform count (using campaign platform via join would be better, but for now just campaign count is proxy or we fetch campaigns)
  // Let's fetch unique platforms via campaign
  const campaigns = await prisma.adCampaign.findMany({
    where: {
      performance: {
        some: {
          date: { gte: from, lte: to },
          spend: { gt: 0 },
        },
      },
    },
    select: { platform: true },
    distinct: ['platform'],
  });
  const platformCount = campaigns.length;

  return {
    totalSpend: Math.round(totalSpend),
    activeCampaigns,
    avgDailySpend: Math.round(avgDailySpend),
    platformCount,
    impressions,
    clicks,
    leadsCaptured,
    conversions,
    cpl,
    revenueAttributed,
  };
}

export async function getSpendByCampaign(range: DateRange) {
  const { from, to } = range;

  const result = await prisma.adPerformance.groupBy({
    by: ['date', 'campaignId'],
    where: {
      date: { gte: from, lte: to },
      spend: { gt: 0 },
    },
    _sum: { spend: true },
    orderBy: { date: 'asc' },
  });

  // Get campaign names
  const campaignIds = Array.from(new Set(result.map(r => r.campaignId)));
  const campaigns = await prisma.adCampaign.findMany({
    where: { id: { in: campaignIds } },
    select: { id: true, name: true },
  });
  const campaignMap = new Map(campaigns.map(c => [c.id, c.name]));

  // Transform data for chart format
  const chartDataMap = new Map<number, Array<number>>();
  const dateSet = new Set<string>();

  result.forEach(row => {
    const dateStr = row.date.toISOString().split('T')[0];
    dateSet.add(dateStr);

    if (!chartDataMap.has(row.campaignId)) {
      chartDataMap.set(row.campaignId, []);
    }
  });

  const categories = Array.from(dateSet).sort();
  const series = Array.from(chartDataMap.entries()).map(([campaignId, _]) => {
    const data = categories.map(dateStr => {
      const row = result.find(r =>
        r.date.toISOString().split('T')[0] === dateStr &&
        r.campaignId === campaignId
      );
      return row ? Number(row._sum.spend || 0) : 0;
    });

    return {
      name: campaignMap.get(campaignId) || `Campaign ${campaignId}`,
      data,
    };
  });

  return { series, categories };
}

export async function getCampaignMetrics(range: DateRange) {
  const { from, to } = range;

  const rows = await prisma.adPerformance.findMany({
    where: {
      date: { gte: from, lte: to },
      spend: { gt: 0 },
    },
    include: { campaign: true },
    orderBy: [
      { date: 'asc' },
      { campaignId: 'asc' },
    ],
  });

  const campaignMap = new Map<
    number,
    {
      campaignId: string;
      performances: Array<{
        performanceId: number;
        points: Array<{
          date: string;
          spend: number;
          impressions: number;
          leads: number;
          revenue: number;
        }>;
      }>;
    }
  >();

  rows.forEach((row) => {
    if (!campaignMap.has(row.campaignId)) {
      campaignMap.set(row.campaignId, {
        campaignId: row.campaign.name,
        performances: [{
          performanceId: row.id, // Using row ID as performance ID grouping isn't strictly same as before but works for list
          points: [],
        }],
      });
    }

    const campaignEntry = campaignMap.get(row.campaignId)!;
    // For simplicity in this refactor, we're flattening slightly differently than the complex raw SQL grouping
    // We'll just push points to the first performance entry

    campaignEntry.performances[0].points.push({
      date: row.date.toISOString().split('T')[0],
      spend: Number(row.spend),
      impressions: row.impressions,
      leads: row.leads,
      revenue: Number(row.revenue),
    });
  });

  return Array.from(campaignMap.values());
}

export async function getAdPerformanceMetrics(range: DateRange) {
  const { from, to } = range;

  const aggregate = await prisma.adPerformance.aggregate({
    where: {
      date: { gte: from, lte: to },
      spend: { gt: 0 },
    },
    _sum: {
      impressions: true,
      clicks: true,
      leads: true,
      spend: true,
    },
    _avg: {
      // CTR, CPC, CPL need to be calculated from sums usually, but if we want avg of daily avgs:
      // Better to calculate from sums
    },
  });

  const totalImpressions = Number(aggregate._sum.impressions || 0);
  const totalClicks = Number(aggregate._sum.clicks || 0);
  const totalLeads = Number(aggregate._sum.leads || 0);
  const totalSpend = Number(aggregate._sum.spend || 0);

  const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const avgCPC = totalClicks > 0 ? totalSpend / totalClicks : 0;
  const avgCPL = totalLeads > 0 ? totalSpend / totalLeads : 0;

  return {
    totalImpressions,
    totalClicks,
    totalLeads,
    totalSpend,
    avgCTR,
    avgCPC,
    avgCPL,
  };
}
