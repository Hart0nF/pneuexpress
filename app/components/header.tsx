import { supabase } from "../lib/supabase";
export default function Header() {
    const { data } = supabase
      .storage
      .from("image")
      .getPublicUrl("Logo.png");
  
    const iconUrl = data.publicUrl;

  return (
    <header
      style={{
        borderBottom: "2px solid white",
        padding: "20px",
        display: "flex",
        alignItems: "center",
        gap: "15px",
      }}
    >
      <img
        src={iconUrl}
        alt="Pneux Express"
        style={{ height: "80px", objectFit: "contain" }}
      />
      <h2>Pneux Express</h2>
    </header>
  );
}
