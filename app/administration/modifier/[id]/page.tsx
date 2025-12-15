"use client";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";

export default function ModifierReservationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: reservationID } = use(params);
  const router = useRouter();

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [heure, setHeure] = useState("");

  const [marqueVoiture, setMarqueVoiture] = useState("");

  const [typePneu, setTypePneu] = useState("");
  const [marquePneu, setMarquePneu] = useState("");
  const [marquesPneus, setMarquesPneus] = useState<string[]>([]);

  const [prixTTC, setPrixTTC] = useState<number | null>(null);
  const [pneusID, setPneusID] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);

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
  // SUBMIT
  // -----------------------------
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedDate || !heure || !pneusID || !prixTTC || !marqueVoiture) {
      alert("Veuillez remplir tous les champs.");
      return;
    }

    try {
      setLoading(true);

      // ==========================================
      // Récupérer le clientID via Reservation
      // ==========================================
      const { data: reservation, error: errRes } = await supabase
        .from("Reservation")
        .select("clientID")
        .eq("id", reservationID)
        .single();

      if (errRes || !reservation) throw errRes;

      const clientID = reservation.clientID;

      // ==========================================
      //  VOITURE (anti-duplication)
      // ==========================================
      let voitureID: string;

      const { data: voitureExistante, error: errVoitureSelect } =
        await supabase
          .from("Voiture")
          .select("id")
          .eq("clientID", clientID)
          .eq("marque", marqueVoiture)
          .maybeSingle();

      if (errVoitureSelect) throw errVoitureSelect;

      if (voitureExistante) {
        voitureID = voitureExistante.id;
      } else {
        const { data: newVoiture, error: errVoitureInsert } =
          await supabase
            .from("Voiture")
            .insert({
              marque: marqueVoiture,
              clientID,
            })
            .select()
            .single();

        if (errVoitureInsert || !newVoiture) throw errVoitureInsert;
        voitureID = newVoiture.id;
      }

      // ==========================================
      // UPDATE LigneReservation
      // ==========================================
      const { error: errLigne } = await supabase
        .from("LigneReservation")
        .update({
          date: selectedDate.toISOString().split("T")[0],
          heure,
          pneusID,
          voitureID,
          prixTTC,
        })
        .eq("reservationID", reservationID);

      if (errLigne) throw errLigne;

     alert("✅ Réservation mise à jour avec succès !");
     router.back();
    } catch (err: any) {
      console.error("❌ ERREUR UPDATE :", err);
      alert("Erreur lors de la mise à jour de la réservation.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="reservation-page">
      <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
        Modification réservation #{reservationID}
      </h2>

      <form className="reservation-form" onSubmit={handleSubmit}>
        <div className="form-row">
          <input
            type="date"
            className="input-field"
            value={selectedDate ? selectedDate.toISOString().split("T")[0] : ""}
            onChange={(e) =>
              setSelectedDate(e.target.value ? new Date(e.target.value) : null)
            }
          />

          <select
            className="input-field"
            value={heure}
            onChange={(e) => setHeure(e.target.value)}
          >
            <option value="">Heure</option>
            {[
              "08:00",
              "09:00",
              "10:00",
              "11:00",
              "12:00",
              "13:00",
              "14:00",
              "15:00",
              "16:00",
            ].map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
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
              <option key={m} value={m}>
                {m}
              </option>
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
            placeholder="Marque voiture"
            value={marqueVoiture}
            onChange={(e) => setMarqueVoiture(e.target.value)}
          />
        </div>

        <button className="submit-btn" disabled={!prixTTC || loading}>
          {loading ? "Mise à jour..." : "Appliquer les modifications"}
        </button>
      </form>
    </div>
  );
}
