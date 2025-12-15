"use client";

import { Suspense } from "react";
import AjouterReservationContent from "./ajouterReservation";

export default function Page() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <AjouterReservationContent />
    </Suspense>
  );
}
