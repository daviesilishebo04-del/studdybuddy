import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'StudyBuddy — Self-Paced Learning Companion',
  description: 'Self-paced microlearning for Grade 8 Math and Literature with mentor telemetry.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var s = localStorage.getItem('studybuddy_text_size');
                if (s) document.documentElement.setAttribute('data-text-size', s.toLowerCase());
                var m = localStorage.getItem('studybuddy_reduced_motion');
                if (m === 'true') document.documentElement.setAttribute('data-reduced-motion', 'true');
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 selection:bg-indigo-500 selection:text-white font-sans overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
