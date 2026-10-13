import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: { default: "YouCon People", template: "%s | YouCon People" },
  description:
    "Plataforma de Gestão de Pessoas da YouCon Arquitetura e Engenharia",
  robots: { index: false, follow: false },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
