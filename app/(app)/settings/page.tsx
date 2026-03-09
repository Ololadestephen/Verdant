"use client";

import { useEffect, useState } from "react";

import { useAppStore } from "@/hooks/use-app-store";

export default function SettingsPage() {
  const { walletAddress, walletType } = useAppStore();
  const [cameraPermission, setCameraPermission] = useState<string>("unknown");
  const [locationPermission, setLocationPermission] = useState<string>("unknown");

  useEffect(() => {
    const check = async () => {
      if (typeof navigator === "undefined" || !navigator.permissions) return;
      const camera = await navigator.permissions.query({ name: "camera" as PermissionName }).catch(() => null);
      const location = await navigator.permissions.query({ name: "geolocation" as PermissionName }).catch(() => null);
      setCameraPermission(camera?.state ?? "unsupported");
      setLocationPermission(location?.state ?? "unsupported");
    };
    void check();
  }, []);

  return (
    <div className="space-y-4">
      <section className="tg-card">
        <h1 className="text-3xl font-semibold">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Wallet and permissions health checks.</p>
      </section>

      <section className="tg-card">
        <h2 className="text-lg font-semibold">Wallet</h2>
        <p className="mt-2 text-sm text-muted-foreground">Address: {walletAddress ?? "Not connected"}</p>
        <p className="mt-1 text-sm text-muted-foreground">Provider: {walletType ?? "-"}</p>
      </section>

      <section className="tg-card">
        <h2 className="text-lg font-semibold">Permissions</h2>
        <p className="mt-2 text-sm text-muted-foreground">Camera: {cameraPermission}</p>
        <p className="mt-1 text-sm text-muted-foreground">Location: {locationPermission}</p>
      </section>
    </div>
  );
}
