import type { Metadata } from "next";
import { Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const plexMono = IBM_Plex_Mono({ variable: "--font-plex-mono", subsets: ["latin"], weight: ["500", "600"] });

export const metadata: Metadata = {
  title: "Fluxo PMBOK 8 interativo | @colabdeveloper",
  description: "Mapa e quadro interativo dos 40 processos do Guia PMBOK® 8ª edição.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // Extensões do navegador podem acrescentar atributos ao <html> antes da hidratação.
    <html lang="pt-BR" className={`${inter.variable} ${plexMono.variable}`} suppressHydrationWarning>
      <body className="antialiased">{children}</body>
    </html>
  );
}
