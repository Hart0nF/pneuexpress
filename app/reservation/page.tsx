"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import WeekCalendar from "../components/calendrier";

export default function ReservationPage() {
  // -----------------------------
  // ÉTATS
  // -----------------------------
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [heure, setHeure] = useState("");

  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [courriel, setCourriel] = useState("");
  const [telephone, setTelephone] = useState("");

  const [marqueVoiture, setMarqueVoiture] = useState("");

  const [typePneu, setTypePneu] = useState("");
  const [marquePneu, setMarquePneu] = useState("");
  const [marquesPneus, setMarquesPneus] = useState<string[]>([]);

  const [prixTTC, setPrixTTC] = useState<number | null>(null);
  const [pneusID, setPneusID] = useState<string | null>(null);

  // -----------------------------
  // CHARGER MARQUES DE PNEUS
  // -----------------------------
  useEffect(() => {
    async function loadMarques() {
      if (!typePneu) {
        setMarquesPneus([]);
        setMarquePneu("");
        return;
      }

      const { data, error } = await supabase
        .from("Pneus")
        .select("marque")
        .eq("saison", typePneu);

      if (error) {
        console.error("Erreur chargement marques pneus :", error);
        return;
      }

      const uniques = Array.from(new Set(data.map((p) => p.marque)));
      setMarquesPneus(uniques);
    }

    loadMarques();
  }, [typePneu]);

  // -----------------------------
  // CALCUL PRIX
  // -----------------------------
  useEffect(() => {
    async function calculPrix() {
      if (!marquePneu || !typePneu) {
        setPrixTTC(null);
        setPneusID(null);
        return;
      }

      const { data, error } = await supabase
        .from("Pneus")
        .select("*")
        .eq("marque", marquePneu)
        .eq("saison", typePneu)
        .maybeSingle();

      if (error || !data) {
        console.error("Erreur calcul prix :", error);
        setPrixTTC(null);
        setPneusID(null);
        return;
      }

      const total = data.prix * 4 * 1.15;
      setPrixTTC(Number(total.toFixed(2)));
      setPneusID(data.id);
    }

    calculPrix();
  }, [marquePneu, typePneu]);

  // -----------------------------
  // SUBMIT
  // -----------------------------
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (
      !selectedDate ||
      !heure ||
      !prenom ||
      !nom ||
      !courriel ||
      !telephone ||
      !marqueVoiture ||
      !pneusID
    ) {
      alert("Veuillez remplir tous les champs.");
      return;
    }

    try {
      // =====================================================
      // PERSONNE
      // =====================================================
      let personneID: string;

      const { data: personneExistante, error: errPersSelect } = await supabase
        .from("Personne")
        .select("id")
        .eq("courriel", courriel)
        .maybeSingle();

      if (errPersSelect) throw errPersSelect;

      if (personneExistante) {
        personneID = personneExistante.id;
      } else {
        const { data: newPersonne, error: errPersInsert } = await supabase
          .from("Personne")
          .insert({
            prenom,
            nom,
            courriel,
            telephone,
            password: "temp123",
          })
          .select()
          .single();

        if (errPersInsert || !newPersonne) throw errPersInsert;
        personneID = newPersonne.id;
      }

      // =====================================================
      // CLIENT (lié à Personne)
      // =====================================================
      let clientID: string;

      const { data: clientExistant, error: errClientSelect } = await supabase
        .from("Client")
        .select("id")
        .eq("personneID", personneID)
        .maybeSingle();

      if (errClientSelect) throw errClientSelect;

      if (clientExistant) {
        clientID = clientExistant.id;
      } else {
        const { data: newClient, error: errClientInsert } = await supabase
          .from("Client")
          .insert({ personneID })
          .select()
          .single();

        if (errClientInsert || !newClient) throw errClientInsert;
        clientID = newClient.id;
      }

      // =====================================================
      //  RESERVATION
      // =====================================================
      const { data: reservation, error: errReservation } = await supabase
        .from("Reservation")
        .insert({ clientID })
        .select()
        .single();

      if (errReservation || !reservation) throw errReservation;

      // =====================================================
      // VOITURE
      // =====================================================
      const { data: voiture, error: errVoiture } = await supabase
        .from("Voiture")
        .insert({
          marque: marqueVoiture,
          clientID,
        })
        .select()
        .single();

      if (errVoiture || !voiture) throw errVoiture;

      // =====================================================
      // LIGNE RESERVATION
      // =====================================================
      const { error: errLigne } = await supabase
        .from("LigneReservation")
        .insert({
          reservationID: reservation.id,
          voitureID: voiture.id,
          pneusID,
          date: selectedDate.toISOString().split("T")[0],
          heure,
        });

      if (errLigne) throw errLigne;

      alert("✅ Réservation créée avec succès !");
    } catch (err) {
      console.error("❌ ERREUR GLOBALE :", err);
      alert("Erreur lors de la création de la réservation.");
    }
  }

  return (
    <div className="reservation-page">
      <div className="calendar-card">
        <WeekCalendar onSelectDate={setSelectedDate} />
      </div>

      <form className="reservation-form" onSubmit={handleSubmit}>
        <div className="form-row">
          <input
            readOnly
            className="input-field"
            value={selectedDate ? selectedDate.toLocaleDateString("fr-FR") : ""}
            placeholder="Date"
          />

          <select
            className="input-field"
            value={heure}
            onChange={(e) => setHeure(e.target.value)}
          >
            <option value="">Heure</option>
            {["08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00"].map(h => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>

          <select
            className="input-field"
            value={typePneu}
            onChange={(e) => setTypePneu(e.target.value)}
          >
            <option value="">Type de pneu</option>
            <option value="été">Été</option>
            <option value="hiver">Hiver</option>
          </select>

          <select
            className="input-field"
            value={marquePneu}
            onChange={(e) => setMarquePneu(e.target.value)}
            disabled={!typePneu}
          >
            <option value="">
              {typePneu ? "Marque de pneu" : "Choisir type"}
            </option>
            {marquesPneus.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          <input
            readOnly
            className="input-field"
            value={prixTTC ? `${prixTTC} $` : ""}
            placeholder="Prix TTC"
          />
        </div>

        <div className="form-row">
          <input
            className="input-field"
            placeholder="Prénom"
            value={prenom}
            onChange={(e) => setPrenom(e.target.value)}
          />
          <input
            className="input-field"
            placeholder="Nom"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
          />
          <input
            className="input-field"
            placeholder="Courriel"
            value={courriel}
            onChange={(e) => setCourriel(e.target.value)}
          />
        </div>

        <div className="form-row">
          <input
            className="input-field"
            placeholder="Marque voiture"
            value={marqueVoiture}
            onChange={(e) => setMarqueVoiture(e.target.value)}
          />
          <input
            className="input-field"
            placeholder="Téléphone"
            value={telephone}
            onChange={(e) => setTelephone(e.target.value)}
          />
        </div>

        <button className="submit-btn" disabled={!prixTTC}>
          Ajouter
        </button>
      </form>
    </div>
  );
}
