'use client';

import Sidebar from '@/components/Sidebar';

// Gabarit commun : menu latéral (tiroir sur mobile) + zone de contenu.
export default function AppShell({ children, mainClassName = 'p-4 sm:p-6 lg:p-8' }: {
  children: React.ReactNode;
  mainClassName?: string;
}) {
  return (
    <div className="flex min-h-screen bg-[#080d1a]">
      <Sidebar />
      <main className={`flex-1 min-w-0 ${mainClassName}`}>{children}</main>
    </div>
  );
}
