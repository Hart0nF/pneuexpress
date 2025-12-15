"use client";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";

export default function PageClient({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: clientID } = use(params);

  const [client, setClient] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    prenom: "",
    nom: "",
    courriel: "",
    telephone: "",
    password: "",
  });

  const [reservations, setReservations] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      // Charger Client + Personne
      const { data: clientRow, error: cErr } = await supabase
        .from("Client")
        .select("*, Personne(*)")
        .eq("id", clientID)
        .maybeSingle();

      if (cErr) {
        console.error("Erreur Client :", cErr);
        return;
      }

      setClient(clientRow);

      // Pré-remplir formulaire
      setForm({
        prenom: clientRow.Personne.prenom,
        nom: clientRow.Personne.nom,
        courriel: clientRow.Personne.courriel,
        telephone: clientRow.Personne.telephone,
        password: clientRow.Personne.password,
      });

      // Charger les réservations (via LigneReservation)
      const { data: reservationRows, error: rErr } = await supabase
        .from("Reservation")
        .select("id")
        .eq("clientID", clientID);

      if (rErr || !reservationRows || reservationRows.length === 0) {
        setReservations([]);
        return;
      }

      const IDs = reservationRows.map((r) => r.id);

      const { data: lignes, error: lErr } = await supabase
        .from("LigneReservation")
        .select("*")
        .in("reservationID", IDs);

      if (lErr) {
        console.error("Erreur lignes réservation :", lErr);
        return;
      }

      setReservations(lignes || []);
    }

    load();
  }, [clientID]);

  // ---------------------------------------------------
  // SAUVEGARDE DES INFOS CLIENT
  // ---------------------------------------------------
  async function saveChanges() {
    setEditing(false);

    if (!client?.Personne?.id) return;

    const { error } = await supabase
      .from("Personne")
      .update({
        prenom: form.prenom,
        nom: form.nom,
        courriel: form.courriel,
        telephone: form.telephone,
        password: form.password,
      })
      .eq("id", client.Personne.id);

    if (error) console.error("❌ Erreur sauvegarde :", error);
    else console.log("✅ Infos mises à jour !");
  }

  // ---------------------------------------------------
  // SUPPRIMER UNE RÉSERVATION
  // ---------------------------------------------------
  async function deleteReservation(reservationID: string) {
    const confirmDelete = confirm(
      "Êtes-vous sûr de vouloir supprimer cette réservation ?"
    );

    if (!confirmDelete) return;

    try {
      // Supprimer LigneReservation
      const { error: errLignes } = await supabase
        .from("LigneReservation")
        .delete()
        .eq("reservationID", reservationID);

      if (errLignes) throw errLignes;

      // Supprimer Reservation
      const { error: errReservation } = await supabase
        .from("Reservation")
        .delete()
        .eq("id", reservationID);

      if (errReservation) throw errReservation;

      // Mise à jour UI
      setReservations((prev) =>
        prev.filter((r) => r.reservationID !== reservationID)
      );

      alert("✅ Réservation supprimée avec succès !");
    } catch (err: any) {
      console.error("❌ Erreur suppression :", err);
      alert("Erreur lors de la suppression de la réservation.");
    }
  }

  // ---------------------------------------------------
  // AFFICHAGE
  // ---------------------------------------------------
  if (!client)
    return (
      <div style={{ textAlign: "center", marginTop: 40 }}>Chargement...</div>
    );

  return (
    <div className="client-container">
      <h1 className="client-title">
        Profil de {client.Personne.prenom} {client.Personne.nom}
      </h1>

      {/*INFOS CLIENT */}
      <div className="client-info-box">
        <h2>Infos du client</h2>

        <div className="info-grid">
          <label>Prénom</label>
          <input
            disabled={!editing}
            value={form.prenom}
            onChange={(e) => setForm({ ...form, prenom: e.target.value })}
          />

          <label>Nom</label>
          <input
            disabled={!editing}
            value={form.nom}
            onChange={(e) => setForm({ ...form, nom: e.target.value })}
          />

          <label>Courriel</label>
          <input
            disabled={!editing}
            value={form.courriel}
            onChange={(e) => setForm({ ...form, courriel: e.target.value })}
          />

          <label>Téléphone</label>
          <input
            disabled={!editing}
            value={form.telephone}
            onChange={(e) => setForm({ ...form, telephone: e.target.value })}
          />

          <label>Mot de passe</label>
          <input
            disabled={!editing}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </div>

        <button
          className="edit-btn"
          onClick={() => (editing ? saveChanges() : setEditing(true))}
        >
          {editing ? "💾 Sauvegarder" : "✏️ Modifier"}
        </button>
      </div>

      {/* RÉSERVATIONS */}
      <h2 style={{ marginTop: "30px" }}>Réservations à venir</h2>

      <div className="client-reservation-list">
        {reservations.length === 0 ? (
          <p>Aucune réservation.</p>
        ) : (
          reservations.map((r) => (
            <div
              key={r.reservationID}
              className="reservation-card-client"
            >
              <h3>Réservation</h3>

              <p>
                <strong>Date :</strong> {r.date}
              </p>
              <p>
                <strong>Heure :</strong> {r.heure}
              </p>

              <div className="reservation-actions">
                <Link
                  href={`/administration/modifier/${r.reservationID}`}
                  className="btn-small"
                >
                  Modifier
                </Link>

                <button
                  className="btn-small delete"
                  onClick={() => deleteReservation(r.reservationID)}
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
