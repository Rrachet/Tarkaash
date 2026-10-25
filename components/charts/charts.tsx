"use client";

import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, LineChart, Line,
} from "recharts";

export const CHART_COLORS = ["#004B4B", "#D9A441", "#2E8B7A", "#8FBFB3", "#C76B4A", "#5C6B73", "#E9C77B"];

const axis = { stroke: "#5C6B73", fontSize: 12, tickLine: false, axisLine: false } as const;
const shortDate = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

function TooltipBox({ active, payload, label, money }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string; money?: boolean }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-line bg-white px-3 py-2 text-xs shadow-[var(--shadow-card)]">
      {label && <p className="mb-1 font-semibold text-ink">{/^\d{4}-\d{2}-\d{2}/.test(label) ? shortDate(label) : label}</p>}
      {payload.map((p) => (
        <p key={p.name} className="flex items-center gap-2 text-slate">
          <span className="size-2 rounded-full" style={{ background: p.color }} />{p.name}: <strong className="text-ink">{money ? `₹${Number(p.value).toLocaleString("en-IN")}` : Number(p.value).toLocaleString("en-IN")}</strong>
        </p>
      ))}
    </div>
  );
}

export function AreaTrend({ data, keys, height = 260 }: { data: Record<string, number | string>[]; keys: { key: string; label: string; color?: string }[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <defs>
          {keys.map((k, i) => (
            <linearGradient key={k.key} id={`g-${k.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={k.color ?? CHART_COLORS[i]} stopOpacity={0.28} />
              <stop offset="100%" stopColor={k.color ?? CHART_COLORS[i]} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid stroke="#E4E0D7" vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="date" tickFormatter={shortDate} minTickGap={24} {...axis} />
        <YAxis allowDecimals={false} {...axis} />
        <Tooltip content={<TooltipBox />} />
        {keys.length > 1 && <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />}
        {keys.map((k, i) => (
          <Area key={k.key} type="monotone" dataKey={k.key} name={k.label} stroke={k.color ?? CHART_COLORS[i]} strokeWidth={2.2} fill={`url(#g-${k.key})`} />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function LineTrend({ data, keys, height = 280 }: { data: Record<string, number | string>[]; keys: { key: string; label: string; color?: string }[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid stroke="#E4E0D7" vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="date" tickFormatter={shortDate} minTickGap={24} {...axis} />
        <YAxis allowDecimals={false} {...axis} />
        <Tooltip content={<TooltipBox />} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
        {keys.map((k, i) => <Line key={k.key} type="monotone" dataKey={k.key} name={k.label} stroke={k.color ?? CHART_COLORS[i]} strokeWidth={2.2} dot={false} />)}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function BarCompare({ data, keys, xKey = "date", height = 260, money, stacked }: { data: Record<string, number | string>[]; keys: { key: string; label: string; color?: string }[]; xKey?: string; height?: number; money?: boolean; stacked?: boolean }) {
  const isDate = xKey === "date" || xKey === "month";
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: money ? 4 : -18, bottom: 0 }} barGap={2}>
        <CartesianGrid stroke="#E4E0D7" vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey={xKey} tickFormatter={isDate ? (d: string) => (xKey === "month" ? new Date(d).toLocaleDateString("en-IN", { month: "short" }) : shortDate(d)) : undefined} minTickGap={16} {...axis} />
        <YAxis allowDecimals={false} tickFormatter={money ? (v: number) => `₹${v >= 1000 ? `${Math.round(v / 1000)}k` : v}` : undefined} {...axis} />
        <Tooltip content={<TooltipBox money={money} />} cursor={{ fill: "rgb(0 75 75 / 0.05)" }} />
        {keys.length > 1 && <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />}
        {keys.map((k, i) => <Bar key={k.key} dataKey={k.key} name={k.label} fill={k.color ?? CHART_COLORS[i]} radius={stacked ? 0 : [4, 4, 0, 0]} stackId={stacked ? "s" : undefined} maxBarSize={28} />)}
      </BarChart>
    </ResponsiveContainer>
  );
}

export function Donut({ data, height = 220, centerLabel, centerValue }: { data: { name: string; value: number }[]; height?: number; centerLabel?: string; centerValue?: string }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="relative shrink-0" style={{ width: height, height }}>
        <PieChart width={height} height={height}>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={height * 0.32} outerRadius={height * 0.48} paddingAngle={2} stroke="none" isAnimationActive={false}>
            {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
          </Pie>
          <Tooltip content={<TooltipBox />} />
        </PieChart>
        {centerValue && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-2xl font-semibold">{centerValue}</span>
            {centerLabel && <span className="text-xs text-slate">{centerLabel}</span>}
          </div>
        )}
      </div>
      <ul className="w-full flex-1 space-y-2 text-sm">
        {data.map((d, i) => (
          <li key={d.name} className="flex items-center gap-2">
            <span className="size-2.5 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
            <span className="flex-1 capitalize text-ink/85">{d.name.replace(/_/g, " ")}</span>
            <span className="font-semibold">{total ? Math.round((d.value / total) * 100) : 0}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
