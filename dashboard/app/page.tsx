"use client";

import type { SlopePoint } from "@/hooks/useSensorData";
import { useSensorData } from "@/hooks/useSensorData";
import { useLogData } from "@/hooks/useLogData";

// --- Types ---
type TempStatus = "CRITICAL" | "NORMAL";

// --- Mock data (replace with Firebase hooks later) ---
const TEMP_THRESHOLD = 35.0;
const batteryLevel = 100;

// --- Icons (inline SVG to avoid extra dependencies) ---
function WaterIcon() {
  return (
    <svg className="w-7 h-7 text-cyan-500" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2C12 2 4 10.5 4 15a8 8 0 0016 0C20 10.5 12 2 12 2z" />
    </svg>
  );
}

function ThermometerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V5a3 3 0 116 0v4m-6 0a4 4 0 106 0m-6 0h6" />
    </svg>
  );
}

function BatteryIcon({ level }: { level: number }) {
  const color = level > 50 ? "text-emerald-500" : level > 20 ? "text-amber-500" : "text-red-500";
  return (
    <svg className={`w-5 h-5 ${color}`} fill="currentColor" viewBox="0 0 24 24">
      <rect x="1" y="7" width="18" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <rect x="2.5" y="8.5" width={`${(level / 100) * 15}`} height="7" rx="1" fill="currentColor" />
      <path d="M21 10.5v3a1.5 1.5 0 000-3z" fill="currentColor" />
    </svg>
  );
}

function CpuIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <rect x="4" y="4" width="16" height="16" rx="2" strokeLinecap="round" />
      <rect x="8" y="8" width="8" height="8" rx="1" />
      <path strokeLinecap="round" d="M9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M1 15h3M20 9h3M20 15h3" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

// --- Subcomponents ---
function ActivityIcon({ type, className }: { type: string; className?: string }) {
  if (type === "cpu") return <CpuIcon className={className} />;
  if (type === "thermometer") return <ThermometerIcon className={className} />;
  return <CheckIcon className={className} />;
}

function TempStatus({
  temp,
  predictedTemp,
  threshold,
}: {
  temp: number | null;
  predictedTemp: number | null;
  threshold: number;
}) {
  const isHigh = temp !== null && temp >= threshold;
  const isPredictedHigh = predictedTemp !== null && predictedTemp >= threshold;
  return (
    <div
      className={`rounded-2xl p-5 transition-all duration-500 ${
        isHigh
          ? "bg-red-50 border-l-4 border-red-500 shadow-[0_0_20px_rgba(220,53,69,0.15)]"
          : "bg-emerald-50 border-l-4 border-emerald-500 shadow-[0_0_20px_rgba(25,135,84,0.15)]"
      }`}
    >
      <div className="flex justify-between items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">
            Current Temperature
          </p>
          <p
            className={`text-6xl font-black tabular-nums leading-none ${
              isHigh ? "text-red-500" : "text-emerald-600"
            }`}
          >
            {temp !== null ? temp.toFixed(2) : "--"}
            <span className="text-3xl font-semibold">°C</span>
          </p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <ThermometerIcon
            className={`w-12 h-12 ${isHigh ? "text-red-400" : "text-emerald-400"}`}
          />
          <span
            className={`text-xs font-bold px-3 py-1 rounded-full ${
              isHigh
                ? "bg-red-100 text-red-600"
                : "bg-emerald-100 text-emerald-700"
            }`}
          >
            {isHigh ? "CRITICAL" : "NORMAL"}
          </span>
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-400">
        Threshold set to{" "}
        <span className="font-semibold text-slate-600">{threshold.toFixed(1)}°C</span>
      </p>
      <p className="mt-2 text-xs text-slate-500">
        Predicted temp in 30s:{" "}
        <span className="font-semibold text-slate-700">
          {predictedTemp !== null ? `${predictedTemp.toFixed(2)}°C` : "--"}
        </span>
        {predictedTemp !== null && (
          <span
            className={`ml-2 rounded-full px-2 py-0.5 font-bold ${
              isPredictedHigh ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"
            }`}
          >
            {isPredictedHigh ? "UPCOMING CRITICAL" : "FORECAST NORMAL"}
          </span>
        )}
      </p>
    </div>
  );
}

function SlopeGraph({ points }: { points: SlopePoint[] }) {
  const width = 280;
  const height = 120;
  const padding = 14;

  const values = points.map((point) => point.slope);
  const minValue = values.length ? Math.min(...values) : -1;
  const maxValue = values.length ? Math.max(...values) : 1;
  const range = maxValue - minValue || 1;

  const toX = (index: number) =>
    padding + (index * (width - padding * 2)) / Math.max(points.length - 1, 1);
  const toY = (value: number) =>
    height - padding - ((value - minValue) * (height - padding * 2)) / range;

  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${toX(index)} ${toY(point.slope)}`)
    .join(" ");

  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Slope Trend</p>
          <p className="text-sm text-slate-500 mt-1">Recent rise rate from live sensor updates</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400">Latest</p>
          <p className="text-sm font-semibold text-slate-700">{lastPoint ? `${lastPoint.slope.toFixed(4)} °C/s` : "--"}</p>
        </div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-32 overflow-visible">
        <defs>
          <linearGradient id="slopeFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <line x1={padding} y1={toY(0)} x2={width - padding} y2={toY(0)} stroke="#cbd5e1" strokeDasharray="4 4" />
        {points.length > 1 && (
          <>
            <path
              d={`${linePath} L ${toX(points.length - 1)} ${height - padding} L ${toX(0)} ${height - padding} Z`}
              fill="url(#slopeFill)"
            />
            <path d={linePath} fill="none" stroke="#0891b2" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </>
        )}
        {points.map((point, index) => (
          <circle
            key={`${point.timestamp}-${index}`}
            cx={toX(index)}
            cy={toY(point.slope)}
            r={index === points.length - 1 ? 4 : 2.5}
            fill={index === points.length - 1 ? "#0e7490" : "#67e8f9"}
            stroke="#ffffff"
            strokeWidth="2"
          />
        ))}
      </svg>

      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
        <span>{firstPoint ? new Date(firstPoint.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--"}</span>
        <span className="font-medium text-slate-500">0 line = stable temperature</span>
        <span>{lastPoint ? new Date(lastPoint.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--"}</span>
      </div>
    </div>
  );
}

type LogEntry = {
  log: string;
  timestamp: number;
};

function ActivityLog({ logData }: { logData: Record<string, LogEntry> | null }) {
  // Helper function to format timestamp to Malaysia Time (UTC+8)
  const formatMYT = (timestamp: number) => {
    if (!timestamp) return "Unknown time";
    
    return new Date(timestamp).toLocaleString('en-MY', {
      timeZone: 'Asia/Kuala_Lumpur',
      hour12: true,
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
        System Activity
      </p>
      <div className="rounded-2xl border border-slate-100 divide-y divide-slate-100 overflow-hidden bg-white">
        {logData && Object.entries(logData).map(([key, logEntry]) => (
          <div
            key={key} 
            className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              {/* Hardcoded icon and color (e.g., standard blue 'info' style) */}
              <ActivityIcon type="info" className="w-4 h-4 shrink-0 text-blue-500" />
              
              <span className="text-sm text-slate-700">{logEntry.log}</span>
            </div>
            
            {/* Displaying the formatted timestamp */}
            <span className="text-xs text-slate-400 whitespace-nowrap ml-3">
              {formatMYT(logEntry.timestamp)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Main Page ---
export default function DashboardPage() {

  // --- Hooks ---
  const { data, loading, slopeHistory } = useSensorData("esp32_01");
  const { logData } = useLogData("esp32_01");

  const currentTemp = data?.temperature ?? null;
  const predictedTemp = data?.predictedTemp ?? null;

    if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Connecting to sensor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center font-sans">
      <div className="w-full max-w-sm min-h-screen bg-white flex flex-col shadow-xl">

        {/* Header */}
        <header className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <WaterIcon />
            <div>
              <h1 className="text-base font-bold text-slate-800 leading-tight">AquaTemp Pro</h1>
              <p className="text-xs text-slate-400">ID: Aquarium_01</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-full px-3 py-1.5">
              <BatteryIcon level={batteryLevel} />
              <span className="text-xs font-bold text-slate-700">{batteryLevel}%</span>
            </div>
            <div className="flex items-center gap-1.5 bg-emerald-500 text-white text-xs font-semibold rounded-full px-3 py-1.5">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              Connected
            </div>
          </div>
        </header>

        {/* Main */}
        <main className="flex-1 flex flex-col gap-4 px-5 py-5">
          <TempStatus temp={currentTemp} predictedTemp={predictedTemp} threshold={TEMP_THRESHOLD} />
          <SlopeGraph points={slopeHistory} />
          <ActivityLog logData={logData} />
        </main>

        {/* Footer Nav */}
        <footer className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50 text-[11px] text-slate-500">
          <span>Live Firebase feed</span>
          <span>Updated from esp32_01</span>
        </footer>

      </div>
    </div>
  );
}