import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'StudyBuddy — Self-Paced Learning Companion',
  description: 'Self-paced microlearning for Grade 8 Math and Literature with mentor telemetry.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 selection:bg-indigo-500 selection:text-white font-sans">
        {children}
      </body>
    </html>
  );
}
