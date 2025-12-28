"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import { useTranslation } from "react-i18next"
import '@/lib/i18n/config'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function ChartAreaInteractive({ data }: { data?: Array<{ date: string; positive: number; negative: number }> }) {
  const { t, i18n } = useTranslation(undefined, { useSuspense: false })
  const [timeRange, setTimeRange] = React.useState("90d")

  const chartConfig = {
    visitors: {
      label: t('dashboard.charts.legend.reviews'),
    },
    positive: {
      label: t('dashboard.charts.legend.positive'),
      color: "hsl(173, 58%, 39%)",
    },
    negative: {
      label: t('dashboard.charts.legend.negative'),
      color: "hsl(0, 84%, 60%)",
    },
  } satisfies ChartConfig

  // Default sample data if no data provided
  const defaultData = [
    { date: "2024-04-01", positive: 22, negative: 5 },
    { date: "2024-04-02", positive: 19, negative: 3 },
    { date: "2024-04-03", positive: 16, negative: 4 },
    { date: "2024-04-04", positive: 24, negative: 6 },
    { date: "2024-04-05", positive: 37, negative: 9 },
    { date: "2024-04-06", positive: 30, negative: 4 },
    { date: "2024-04-07", positive: 24, negative: 8 },
    { date: "2024-04-08", positive: 40, negative: 12 },
    { date: "2024-04-09", positive: 15, negative: 1 },
    { date: "2024-04-10", positive: 26, negative: 9 },
    { date: "2024-04-11", positive: 32, negative: 5 },
    { date: "2024-04-12", positive: 29, negative: 11 },
    { date: "2024-04-13", positive: 34, negative: 8 },
    { date: "2024-04-14", positive: 13, negative: 2 },
    { date: "2024-04-15", positive: 12, negative: 7 },
    { date: "2024-04-16", positive: 13, negative: 9 },
    { date: "2024-04-17", positive: 44, negative: 6 },
    { date: "2024-04-18", positive: 36, negative: 11 },
    { date: "2024-04-19", positive: 24, negative: 8 },
    { date: "2024-04-20", positive: 18, negative: 5 },
    { date: "2024-04-21", positive: 23, negative: 7 },
    { date: "2024-04-22", positive: 22, negative: 7 },
    { date: "2024-04-23", positive: 23, negative: 3 },
    { date: "2024-04-24", positive: 38, negative: 9 },
    { date: "2024-04-25", positive: 31, negative: 5 },
    { date: "2024-04-26", positive: 17, negative: 3 },
    { date: "2024-04-27", positive: 38, negative: 12 },
    { date: "2024-04-28", positive: 22, negative: 8 },
    { date: "2024-04-29", positive: 31, negative: 4 },
    { date: "2024-04-30", positive: 45, negative: 8 },
  ]

  const chartData = data || defaultData

  const filteredData = chartData.filter((item) => {
    const date = new Date(item.date)
    const now = new Date()
    let daysToSubtract = 90
    if (timeRange === "30d") {
      daysToSubtract = 30
    } else if (timeRange === "7d") {
      daysToSubtract = 7
    }
    const startDate = new Date(now)
    startDate.setDate(startDate.getDate() - daysToSubtract)
    return date >= startDate
  })

  return (
    <Card className="pt-0">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle>{t('dashboard.charts.title')}</CardTitle>
          <CardDescription>
            {t('dashboard.charts.description')}
          </CardDescription>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger
            className="w-[160px] rounded-lg"
            aria-label="Select a value"
          >
            <SelectValue placeholder={t('dashboard.charts.timeRange.last90Days')} />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="90d" className="rounded-lg">
              {t('dashboard.charts.timeRange.last90Days')}
            </SelectItem>
            <SelectItem value="30d" className="rounded-lg">
              {t('dashboard.charts.timeRange.last30Days')}
            </SelectItem>
            <SelectItem value="7d" className="rounded-lg">
              {t('dashboard.charts.timeRange.last7Days')}
            </SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillPositive" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-positive)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-positive)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillNegative" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-negative)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-negative)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString(i18n.language, {
                  month: "short",
                  day: "numeric",
                })
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString(i18n.language, {
                      month: "short",
                      day: "numeric",
                    })
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="negative"
              type="natural"
              fill="url(#fillNegative)"
              stroke="var(--color-negative)"
              stackId="a"
            />
            <Area
              dataKey="positive"
              type="natural"
              fill="url(#fillPositive)"
              stroke="var(--color-positive)"
              stackId="a"
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
