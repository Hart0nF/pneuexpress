"use client";

import "./globals.css";
import Header from "./components/header";
import Footer from "./components/footer";
import Navbar from "./components/navbar";
import { usePathname } from "next/navigation";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const hideNavbar = pathname === "/connexion";

  return (
    <html lang="fr">
      <body
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Header />

        {!hideNavbar && <Navbar />}

        <main
          className="main-container"
          style={{
            flex: 1,
          }}
        >
          {children}
        </main>

        <Footer />
      </body>
    </html>
  );
}
