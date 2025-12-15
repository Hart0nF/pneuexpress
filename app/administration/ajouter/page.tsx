"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

export default function AjouterReservationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const adminDate = searchParams.get("date");
  const [selectedDate, setSelectedDate] = useState<string>("");

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

  const [loading, setLoading] = useState(false);

  // -----------------------------
  // DATE OBLIGATOIRE DEPUIS ADMIN
  // -----------------------------
  useEffect(() => {
    if (!adminDate) {
      alert("Aucune date sélectionnée. Retour à l’administration.");
      router.push("/administration");
      return;
    }
    setSelectedDate(adminDate);
  }, [adminDate, router]);

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
        console.error("Erreur marques pneus :", error);
        return;
      }

      setMarquesPneus(Array.from(new Set(data.map((p) => p.marque))));
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
  // SUBMIT — CRÉATION COMPLÈTE
  // -----------------------------
  async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();

  console.log("🚀 SUBMIT déclenché");

  if (
    !selectedDate ||
    !heure ||
    !prenom ||
    !nom ||
    !courriel ||
    !telephone ||
    !marqueVoiture ||
    !pneusID ||
    !prixTTC
  ) {
    console.log("⛔ Champs manquants");
    alert("Veuillez remplir tous les champs.");
    return;
  }

  try {
    setLoading(true);

    // =========================
    // PERSONNE
    // =========================
    console.log("➡️ 1. Recherche personne existante");

    let personneID: string;

    const { data: personneExistante, error: errPersSel } = await supabase
      .from("Personne")
      .select("id")
      .eq("courriel", courriel)
      .maybeSingle();

    console.log("📦 personneExistante =", personneExistante);
    console.log("❌ errPersSel =", errPersSel);

    if (personneExistante) {
      personneID = personneExistante.id;
      console.log("✅ Personne existante ID =", personneID);
    } else {
      console.log("➡️ Insertion nouvelle personne");

      const { data: newPersonne, error: errPersIns } = await supabase
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

      if (errPersIns || !newPersonne) throw errPersIns;
      personneID = newPersonne.id;

      console.log("Nouvelle personne ID =", personneID);
    }

    // =========================
    // CLIENT
    // =========================

    let clientID: string;

    const { data: clientExistant, error: errClientSel } = await supabase
      .from("Client")
      .select("id")
      .eq("personneID", personneID)
      .maybeSingle();

    if (clientExistant) {
      clientID = clientExistant.id;
    } else {

      const { data: newClient, error: errClientIns } = await supabase
        .from("Client")
        .insert({ personneID: personneID })
        .select()
        .single();

      if (errClientIns || !newClient) throw errClientIns;
      clientID = newClient.id;
    }

    // =========================
    // RESERVATION
    // =========================

    const { data: reservation, error: errRes } = await supabase
      .from("Reservation")
      .insert({ clientID })
      .select()
      .single();

    if (errRes || !reservation) throw errRes;

    // =========================
    // VOITURE
    // =========================

    let voitureID: string;

    const { data: voitureExistante, error: errVoitSel } = await supabase
      .from("Voiture")
      .select("id")
      .eq("clientID", clientID)
      .eq("marque", marqueVoiture)
      .maybeSingle();

    if (voitureExistante) {
      voitureID = voitureExistante.id;
    } else {

      const { data: newVoiture, error: errVoitIns } = await supabase
        .from("Voiture")
        .insert({
          marque: marqueVoiture,
          clientID,
        })
        .select()
        .single();

      if (errVoitIns || !newVoiture) throw errVoitIns;
      voitureID = newVoiture.id;
    }

    // =========================
    // LIGNE RESERVATION
    // =========================

    const { error: errLigne } = await supabase
      .from("LigneReservation")
      .insert({
        reservationID: reservation.id,
        voitureID,
        pneusID,
        date: selectedDate,
        heure,
        prixTTC,
      });

    if (errLigne) throw errLigne;

    alert("✅ Réservation créée avec succès !");
    router.push("/administration");
  } catch (err: any) {
    console.error("🔥 ERREUR GLOBALE :", err);
    console.error("message:", err?.message);
    console.error("details:", err?.details);
    console.error("hint:", err?.hint);
    console.error("code:", err?.code);
    alert("Erreur lors de la création de la réservation (voir console).");
  } finally {
    setLoading(false);
  }
}

  return (
    <div className="ajout-page">
      <h1 style={{ textAlign: "center", marginBottom: 20 }}>
        Ajouter une réservation
      </h1>

      <form className="reservation-form" onSubmit={handleSubmit}>
        <div className="form-row">
          <input readOnly className="input-field" value={selectedDate} />

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
          <input className="input-field" placeholder="Prénom" value={prenom} onChange={(e) => setPrenom(e.target.value)} />
          <input className="input-field" placeholder="Nom" value={nom} onChange={(e) => setNom(e.target.value)} />
          <input className="input-field" placeholder="Courriel" value={courriel} onChange={(e) => setCourriel(e.target.value)} />
        </div>

        <div className="form-row">
          <input className="input-field" placeholder="Marque voiture" value={marqueVoiture} onChange={(e) => setMarqueVoiture(e.target.value)} />
          <input className="input-field" placeholder="Téléphone" value={telephone} onChange={(e) => setTelephone(e.target.value)} />
        </div>

        <button className="submit-btn" disabled={!prixTTC || loading}>
          {loading ? "Création..." : "Ajouter"}
        </button>
      </form>
    </div>
  );
}
