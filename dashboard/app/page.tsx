"use client";

import { useState } from "react";
import { useSensorData } from "@/hooks/useSensorData";

// --- Types ---
type PumpStatus = "RUNNING" | "IDLE";
type TempStatus = "CRITICAL" | "NORMAL";

// --- Mock data (replace with Firebase hooks later) ---
const TEMP_THRESHOLD = 26.0;
const pumpStatus: PumpStatus = "RUNNING";
const batteryLevel = 100;



const activityLog = [
  {
    id: 1,
    icon: "cpu",
    message: "Pump automatically started (Temp > 26°C)",
    time: "Just now",
    color: "text-amber-500",
  },
  {
    id: 2,
    icon: "thermometer",
    message: "Temp exceeded safe limit (26.1°C)",
    time: "5m ago",
    color: "text-red-500",
  },
  {
    id: 3,
    icon: "check",
    message: "System initialized successfully",
    time: "1h ago",
    color: "text-emerald-500",
  },
];

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

function FanIcon({ spinning }: { spinning: boolean }) {
  return (
    <svg
      className={`w-8 h-8 text-white ${spinning ? "animate-spin" : ""}`}
      style={{ animationDuration: "2s" }}
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M12 10.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3zM9.5 5C8 3 5.5 2.5 4 4S3 8 5 9.5c1.5 1 4 .5 5.5-.5S11 6 9.5 5zm5 0C16 3 18.5 2.5 20 4s1 4-1 5.5c-1.5 1-4 .5-5.5-.5S13 6 14.5 5zM9.5 19c-1.5 2-4 2.5-5.5 1S3 16 5 14.5c1.5-1 4-.5 5.5.5S11 18 9.5 19zm5 0c1.5 2 4 2.5 5.5 1s1.5-4-.5-5.5c-1.5-1-4-.5-5.5.5S13 18 14.5 19z" />
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

function TempStatus({ temp, threshold }: { temp: number | null; threshold: number }) {
  const isHigh = temp !== null && temp > threshold;
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
    </div>
  );
}

function PumpCard({ status }: { status: PumpStatus }) {
  const isRunning = status === "RUNNING";
  return (
    <div
      className={`rounded-2xl p-5 text-white transition-all duration-500 ${
        isRunning
          ? "bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-200"
          : "bg-gradient-to-br from-slate-400 to-slate-600"
      }`}
    >
      <div className="flex justify-between items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-white/60 mb-1">
            Air Pump Status
          </p>
          <p className="text-2xl font-black">{status}</p>
          <p className="text-xs text-white/60 mt-1">
            {isRunning
              ? "Triggered by High Temp Automation"
              : "Standing by"}
          </p>
        </div>
        <div
          className={`rounded-full p-4 flex items-center justify-center transition-all ${
            isRunning ? "bg-white/20" : "bg-white/10"
          }`}
        >
          <FanIcon spinning={isRunning} />
        </div>
      </div>
    </div>
  );
}

function ActivityLog() {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
        System Activity
      </p>
      <div className="rounded-2xl border border-slate-100 divide-y divide-slate-100 overflow-hidden bg-white">
        {activityLog.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <ActivityIcon type={item.icon} className={`w-4 h-4 shrink-0 ${item.color}`} />
              <span className="text-sm text-slate-700">{item.message}</span>
            </div>
            <span className="text-xs text-slate-400 whitespace-nowrap ml-3">{item.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

type NavItem = { label: string; href: string; active?: boolean };
const navItems: NavItem[] = [
  { label: "Dashboard", href: "#", active: true },
  { label: "Settings", href: "/settings" },
  { label: "Analytics", href: "/analytics" },
];

function NavIcon({ label }: { label: string }) {
  if (label === "Dashboard")
    return (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
      </svg>
    );
  if (label === "Settings")
    return (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    );
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
    </svg>
  );
}

// --- Main Page ---
export default function DashboardPage() {

  const { data, loading } = useSensorData("esp32_01");
  const currentTemp = data?.temperature ?? null;

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
          <TempStatus temp={currentTemp} threshold={TEMP_THRESHOLD} />
          <PumpCard status={pumpStatus} />
          <ActivityLog />
        </main>

        {/* Footer Nav */}
        <footer className="flex justify-around items-center px-5 py-3 border-t border-slate-100 bg-slate-50">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 transition-colors ${
                item.active ? "text-cyan-500" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <NavIcon label={item.label} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </a>
          ))}
        </footer>

      </div>
    </div>
  );
}