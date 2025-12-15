import Link from "next/link";
export default function Footer() {
  return (
    <footer
      style={{
        borderTop: "2px solid rgba(37, 99, 235, 0.35)",
        padding: "20px",
        textAlign: "center",
        marginTop: "40px"
      }}
    >
      <Link href="/apropos" className="footer-link">
        À propos
      </Link>
    </footer>
  );
}
