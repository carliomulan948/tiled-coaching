import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CoachPro - Gestion de coaching',
  description: 'Application de gestion pour coachs professionnels',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="bg-slate-950 text-slate-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}
