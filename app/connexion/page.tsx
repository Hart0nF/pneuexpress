"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function ConnexionPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [erreur, setErreur] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreur("");

    // --- Cas ADMIN ---
    if (email === "Admin" && password === "Admin") {
      router.push("/administration");
      return;
    }

    // --- Chercher la personne dans "Personne" ---
    const { data: personne, error } = await supabase
      .from("Personne")
      .select("*")
      .eq("courriel", email)
      .single();

    if (error || !personne) {
      setErreur("Courriel invalide.");
      return;
    }

    if (personne.password !== password) {
      setErreur("Mot de passe incorrect.");
      return;
    }

    // --- Trouver le client associé dans "Client" ---
    const { data: client } = await supabase
      .from("Client")
      .select("*")
      .eq("personneID", personne.id)
      .single();

    if (!client) {
      setErreur("Ce compte n'est pas associé à un client.");
      return;
    }

    // --- Redirection vers /client/{client.id} ---
    router.push(`/client/${client.id}`);
  };

  return (
    <div className="connexion-container">
      <form className="connexion-box" onSubmit={handleLogin}>
        <input
          type="text"
          placeholder="Courriel"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {erreur && <p style={{ color: "red" }}>{erreur}</p>}

        <button type="submit">Connexion</button>
      </form>
    </div>
  );
}
