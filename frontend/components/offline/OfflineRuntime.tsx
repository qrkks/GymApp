"use client";

import { useCallback, useEffect, useState } from "react";
import { CloudOff, RefreshCw } from "lucide-react";
import { useSession } from "next-auth/react";
import {
  getPendingMutationCount,
  OFFLINE_STATE_EVENT,
  setActiveOfflineUser,
  syncPendingMutations,
} from "@/lib/offline/workout-store";

export default function OfflineRuntime() {
  const { data: session, status } = useSession();
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  const refreshPendingCount = useCallback(async () => {
    try {
      setPendingCount(await getPendingMutationCount());
    } catch (error) {
      console.error("Unable to read offline queue", error);
    }
  }, []);

  const synchronize = useCallback(async () => {
    if (!navigator.onLine) {
      return;
    }
    setIsSyncing(true);
    try {
      await syncPendingMutations();
      await refreshPendingCount();
    } catch (error) {
      console.error("Offline synchronization failed", error);
    } finally {
      setIsSyncing(false);
    }
  }, [refreshPendingCount]);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      void synchronize();
    };
    const handleOffline = () => setIsOnline(false);
    const handleStateChange = () => void refreshPendingCount();

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener(OFFLINE_STATE_EVENT, handleStateChange);
    void refreshPendingCount();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener(OFFLINE_STATE_EVENT, handleStateChange);
    };
  }, [refreshPendingCount, synchronize]);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.id) {
      setActiveOfflineUser(session.user.id);
      void refreshPendingCount();
      void synchronize();
    }
  }, [refreshPendingCount, session?.user?.id, status, synchronize]);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    if (process.env.NODE_ENV === "production") {
      void navigator.serviceWorker.register("/sw.js").catch((error) => {
        console.error("Service worker registration failed", error);
      });
      return;
    }

    void navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => void registration.unregister());
    });
  }, []);

  if (isOnline && pendingCount === 0 && !isSyncing) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 z-50 flex min-h-11 -translate-x-1/2 items-center gap-2 rounded-full border bg-white px-4 py-2 text-sm font-medium shadow-lg"
    >
      {isSyncing ? (
        <RefreshCw className="h-4 w-4 animate-spin text-primary" />
      ) : (
        <CloudOff className="h-4 w-4 text-amber-700" />
      )}
      <span>
        {isSyncing
          ? "正在同步训练记录…"
          : !isOnline
            ? pendingCount > 0
              ? `离线模式 · ${pendingCount} 条待同步`
              : "离线模式"
            : `${pendingCount} 条记录等待同步`}
      </span>
    </div>
  );
}
