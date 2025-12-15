export default function Header() {
  const logoUrl = "https:tweeeywyoxldzufahugh.supabase.co/storage/v1/object/public/image/Logo.png"

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
        src={logoUrl}
        alt="Pneux Express"
        style={{ height: "80px", objectFit: "contain" }}
      />
      <h2>Pneux Express</h2>
    </header>
  );
}
