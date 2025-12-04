import { ReactNode, useMemo } from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { Card } from "@/components/ui/card";

type SeriesPoint = number | { x: string; y: number };

interface SeriesData {
  name: string;
  data: SeriesPoint[];
}

interface TimeSeriesChartProps {
  title: string;
  series: SeriesData[];
  categories: string[];
  height?: number;
  type?: "line" | "area" | "bar";
  stacked?: boolean;
  valueFormatter?: (value: number) => string;
  tooltipFormatter?: (value: number) => string;
  actionSlot?: ReactNode;
}

export default function TimeSeriesChart({
  title,
  series,
  categories,
  height = 320,
  type = "line",
  stacked = false,
  valueFormatter,
  tooltipFormatter,
  actionSlot,
}: TimeSeriesChartProps) {
  const axisValueFormatter =
    valueFormatter ||
    ((value: number | string) => {
      const numericValue = Number(value) || 0;
      if (numericValue >= 1000) return `$${(numericValue / 1000).toFixed(1)}k`;
      return `$${numericValue.toFixed(0)}`;
    });
  const tooltipValueFormatter =
    tooltipFormatter ||
    ((value: number | string) => {
      const numericValue = Number(value) || 0;
      return `$${numericValue.toLocaleString()}`;
    });

  const options: ApexOptions = useMemo(() => ({
    chart: {
      type,
      toolbar: { show: false },
      zoom: { enabled: false },
      stacked,
      dropShadow:
        type === "area" || type === "line"
          ? {
            enabled: true,
            color: "#000",
            top: 10,
            left: 0,
            blur: 6,
            opacity: 0.15,
          }
          : { enabled: false },
    },
    colors: ['hsl(217, 91%, 60%)', 'hsl(142, 76%, 36%)', 'hsl(262, 83%, 58%)', 'hsl(32, 95%, 44%)', 'hsl(340, 82%, 52%)'],
    dataLabels: { enabled: false },
    stroke: {
      curve: 'smooth',
      width: type === 'bar' ? 0 : 3,
    },
    fill: {
      type: type === 'area' ? 'gradient' : 'solid',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.4,
        opacityTo: 0.1,
      },
    },
    xaxis: {
      categories,
      labels: {
        style: {
          colors: '#94a3b8',
          fontSize: '11px',
          fontFamily: 'Inter, sans-serif',
        },
      },
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: '#94a3b8',
          fontSize: '11px',
          fontFamily: 'JetBrains Mono, monospace',
        },
        formatter: (value) => axisValueFormatter(value),
      },
    },
    grid: {
      borderColor: 'hsl(217, 33%, 25%)',
      strokeDashArray: 3,
    },
    legend: {
      position: 'bottom',
      horizontalAlign: 'left',
      fontFamily: 'Inter, sans-serif',
      fontSize: '12px',
      labels: {
        colors: '#94a3b8',
      },
    },
    tooltip: {
      theme: 'dark',
      y: {
        formatter: (value) => tooltipValueFormatter(value),
      },
      style: {
        fontSize: '12px',
        fontFamily: 'Inter, sans-serif',
      },
    },
  }), [axisValueFormatter, categories, stacked, tooltipValueFormatter, type]);

  return (
    <Card className="p-6 shadow-soft">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        {actionSlot}
      </div>
      <Chart options={options} series={series as any} type={type} height={height} />
    </Card>
  );
}
