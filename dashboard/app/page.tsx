"use client";

import { useSensorData } from "@/hooks/useSensorData";

export default function Home() {
  const { data, loading } = useSensorData("esp32_01");

  if (loading) return <div>Loading sensor data...</div>;

  return (
    <div>
      <h1>Smart Aeration Dashboard</h1>
      <p>Temperature: {data?.temperature ?? "No data yet"} °C</p>
    </div>
  );
}