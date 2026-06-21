"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";

interface SensorData {
  temperature: number;
  timestamp: number;
}

export function useSensorData(deviceId: string) {
  const [data, setData] = useState<SensorData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sensorRef = ref(db, `devices/${deviceId}/sensors`);

    const unsubscribe = onValue(sensorRef, (snapshot) => {
      setData(snapshot.val());
      setLoading(false);
    });

    // Cleanup listener when component unmounts
    return () => unsubscribe();
  }, [deviceId]);

  return { data, loading };
}