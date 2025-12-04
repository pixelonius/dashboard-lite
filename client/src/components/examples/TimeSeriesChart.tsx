import TimeSeriesChart from '../TimeSeriesChart';

export default function TimeSeriesChartExample() {
  //todo: remove mock functionality
  const mockSeries = [
    {
      name: 'SDR Outbound',
      data: [4200, 5100, 4800, 6200, 5800, 7100, 6900],
    },
    {
      name: 'Webinar',
      data: [3100, 4200, 3800, 4900, 5200, 5800, 6200],
    },
    {
      name: 'IG DM',
      data: [2400, 2800, 3200, 2900, 3500, 4100, 3800],
    },
    {
      name: 'Ads',
      data: [1800, 2200, 2500, 2800, 3100, 3400, 3900],
    },
  ];

  const categories = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="p-8 bg-background">
      <div className="space-y-6">
        <TimeSeriesChart
          title="Revenue by Source"
          series={mockSeries}
          categories={categories}
          type="area"
          stacked
        />
        <TimeSeriesChart
          title="Daily Orders"
          series={[{ name: 'Orders', data: [32, 45, 38, 52, 48, 61, 55] }]}
          categories={categories}
          type="line"
        />
      </div>
    </div>
  );
}
