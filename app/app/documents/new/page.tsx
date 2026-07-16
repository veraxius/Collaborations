"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { DocumentForm } from "../document-form";

type Vehicle = { id: string; name: string; plate: string };
type Driver = { id: string; name: string };

export default function NewDocumentPage() {
  return (
    <Suspense fallback={<p className="text-sm text-neutral-400">Loading…</p>}>
      <NewDocumentContent />
    </Suspense>
  );
}

function NewDocumentContent() {
  const searchParams = useSearchParams();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);

  const vehicleId = searchParams.get("vehicle");
  const driverId = searchParams.get("driver");
  const owner = vehicleId
    ? `vehicle:${vehicleId}`
    : driverId
      ? `driver:${driverId}`
      : "";

  useEffect(() => {
    Promise.all([
      api<{ vehicles: Vehicle[] }>("/api/vehicles"),
      api<{ drivers: Driver[] }>("/api/drivers"),
    ])
      .then(([v, d]) => {
        setVehicles(v.vehicles);
        setDrivers(d.drivers);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="text-sm text-neutral-400">Loading…</p>;
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight">Add document</h1>
      <DocumentForm
        vehicles={vehicles.map((v) => ({ id: v.id, label: `${v.name} (${v.plate})` }))}
        drivers={drivers.map((d) => ({ id: d.id, label: d.name }))}
        initial={{ owner }}
        submitLabel="Save document"
      />
    </div>
  );
}
