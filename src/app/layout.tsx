import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TOP XV - Fantasy Rugby URBA',
  description: 'Armá tu equipo de rugby fantasy con los mejores jugadores del URBA Top 14',
  icons: { icon: '/icon.png' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
