import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'אנגלית בקליק PRO | לומדים לקרוא, להבין ולהרוויח',
  description: 'לומדים לקרוא באנגלית: אותיות, צלילים, מילים ומשפטים',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <head>
        {/* Rubik (Hebrew) & Nunito (clear English lowercase a, g, b, d, p, q) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Nunito:wght@600;700;800;900&family=Rubik:wght@400;500;600;700;800;900&display=swap"
        />
      </head>
      {/* The app script switches theme-* classes on <body> at runtime */}
      <body
        className="theme-classic text-slate-800 selection:bg-indigo-200 selection:text-indigo-900"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
