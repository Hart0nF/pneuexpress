"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Navbar() {
  const pathname = usePathname();
  const [label, setLabel] = useState("Déconnexion");

  const { data } = supabase
    .storage
    .from("image")
    .getPublicUrl("IconProfil.png");

  const iconUrl = data.publicUrl;

  // =====================================
  // Mise à jour du texte selon la page
  // =====================================
  useEffect(() => {
    // Sur la page "à propos", on ne change rien
    if (pathname === "/apropos") {
      return;
    }

    // Page réservation → Connexion
    if (pathname === "/reservation") {
      setLabel("Connexion");
    } else {
      // Toutes les autres pages
      setLabel("Déconnexion");
    }
  }, [pathname]);

  return (
    <nav
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        borderBottom: "2px solid black",
        padding: "10px 20px",
      }}
    >
      <Link
        href="/connexion"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          textDecoration: "none",
          color: "black",
          fontWeight: 500,
          fontSize: "16px",
        }}
      >
        <img
          src={iconUrl}
          alt="Icône de profil"
          style={{
            width: "40px",
            height: "40px",
            objectFit: "contain",
          }}
        />
        <span>{label}</span>
      </Link>
    </nav>
  );
}
