"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";

interface SensorData {
  temperature: number;
  predictedTemp?: number;
  slope?: number;
  pumpState?: boolean;
  timestamp: number;
}

export interface SlopePoint {
  timestamp: number;
  slope: number;
}

export function useSensorData(deviceId: string) {
  const [data, setData] = useState<SensorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [slopeHistory, setSlopeHistory] = useState<SlopePoint[]>([]);

  useEffect(() => {
    const sensorRef = ref(db, `devices/${deviceId}/sensors`);

    const unsubscribe = onValue(sensorRef, (snapshot) => {
      const nextData = snapshot.val();

      setData(nextData);

      if (nextData?.timestamp === undefined || nextData?.slope === undefined) {
        setLoading(false);
        return;
      }

      setSlopeHistory((current) => {
        const lastPoint = current[current.length - 1];

        if (lastPoint?.timestamp === nextData.timestamp) {
          return current;
        }

        const nextHistory = [...current, { timestamp: nextData.timestamp, slope: nextData.slope }];
        return nextHistory.slice(-20);
      });

      setLoading(false);
    });

    // Cleanup listener when component unmounts
    return () => unsubscribe();
  }, [deviceId]);

  return { data, loading, slopeHistory };
}