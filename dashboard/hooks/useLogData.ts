"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { ref, onValue, query, orderByChild, limitToLast, limitToFirst } from "firebase/database";

interface LogData {
  log: string;
  timestamp: number;
}

export function useLogData(deviceId: string) {
  const [data, setData] = useState<LogData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const logRef = ref(db, `devices/${deviceId}/logs`);
    const latestLogsQuery = query(logRef, orderByChild('timestamp'), limitToLast(5));
    const unsubscribe = onValue(latestLogsQuery, (snapshot) => {
      setData(snapshot.val());
      setLoading(false);
    });

    // Cleanup listener when component unmounts
    return () => unsubscribe();
  }, [deviceId]);

  return { logData: data, logLoading: loading };
}