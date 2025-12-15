"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";

interface ReservationLigne {
  id: string; 
  reservationID?: string;
  date: string;
  heure: string;
  voiture?: { marque: string }[];
  pneus?: { marque: string }[];
}

export default function AdminPage() {
  const [selectedDate, setSelectedDate] = useState("");
  const [reservations, setReservations] = useState<ReservationLigne[]>([]);
  const [loading, setLoading] = useState(false);

  // ===================================================
  // Date du jour par défaut
  // ===================================================
  useEffect(() => {
    const today = new Date();
    const todayISO = today.toISOString().split("T")[0]; // YYYY-MM-DD
    setSelectedDate(todayISO);
  }, []);

  // ===================================================
  //Charger les réservations pour la date sélectionnée
  // ===================================================
  useEffect(() => {
    async function loadReservations() {
      if (!selectedDate) {
        setReservations([]);
        return;
      }

      setLoading(true);

      const { data, error } = await supabase
        .from("LigneReservation")
        .select(`
          id,
          reservationID,
          date,
          heure,
          voiture:voitureID ( marque ),
          pneus:pneusID ( marque )
        `)
        .eq("date", selectedDate)
        .order("heure", { ascending: true });

      if (error) {
        console.error("❌ Erreur Supabase :", error);
        setReservations([]);
        setLoading(false);
        return;
      }

      setReservations(data || []);
      setLoading(false);
    }

    loadReservations();
  }, [selectedDate]);

  // ===================================================
  // Suppression complète d’une réservation
  // ===================================================
  async function deleteReservationByLine(ligneID: string) {
    const confirmDelete = confirm(
      "Êtes-vous sûr de vouloir supprimer cette réservation ?"
    );
    if (!confirmDelete) return;

    try {
      // upprimer LigneReservation
      const { data: deletedLine, error: errLine } = await supabase
        .from("LigneReservation")
        .delete()
        .eq("id", ligneID)
        .select("reservationID")
        .single();

      if (errLine) throw errLine;

      const reservationID = deletedLine?.reservationID;

      // Supprimer Reservation
      if (reservationID) {
        const { error: errRes } = await supabase
          .from("Reservation")
          .delete()
          .eq("id", reservationID);

        if (errRes) throw errRes;
      }

      // Mise à jour UI
      setReservations((prev) => prev.filter((r) => r.id !== ligneID));

      alert("✅ Réservation supprimée avec succès !");
    } catch (err: any) {
      console.error("❌ Erreur suppression :", err);
      alert("Erreur lors de la suppression de la réservation.");
    }
  }

  // ===================================================
  // ➕ Lien Ajouter réservation (date transmise)
  // ===================================================
  const addHref = selectedDate
    ? `/administration/ajouter?date=${encodeURIComponent(selectedDate)}`
    : "#";

  return (
    <div className="admin-page">
      {/* ACTIONS */}
      <div className="admin-actions">
        <div className="admin-date-picker">
          <label>Choisissez une date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>

        {selectedDate ? (
          <Link href={addHref} className="admin-btn admin-link-btn">
            Ajouter réservation
          </Link>
        ) : (
          <button
            type="button"
            className="admin-btn admin-link-btn"
            disabled
            style={{ opacity: 0.6, cursor: "not-allowed" }}
          >
            Ajouter réservation
          </button>
        )}
      </div>

      {/*LISTE DES RÉSERVATIONS */}
      <div className="admin-reservations">
        {loading && <p>Chargement...</p>}
        {!loading && reservations.length === 0 && (
          <p>Aucune réservation pour cette date.</p>
        )}

        {reservations.map((res) => (
          <div key={res.id} className="reservation-card">
            <p>
              <strong>Date :</strong> {res.date}
            </p>
            <p>
              <strong>Heure :</strong> {res.heure}
            </p>
            <p>
              <strong>Voiture :</strong>{" "}
              {res.voiture?.[0]?.marque ?? "Inconnue"}
            </p>
            <p>
              <strong>Pneus :</strong>{" "}
              {res.pneus?.[0]?.marque ?? "Inconnus"}
            </p>

            <div className="reservation-actions">
              <Link
                href={`/administration/modifier/${res.reservationID ?? res.id}`}
                className="btn-small"
              >
                Modifier
              </Link>

              <button
                className="btn-small delete"
                onClick={() => deleteReservationByLine(res.id)}
              >
                Supprimer
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
