import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css'; // Global styles

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-serif',
});

export const metadata: Metadata = {
  title: 'Through the Looking Glass — Academic Screenshot Reader',
  description: 'An Alice in Wonderland-themed study tool that helps adult college students returning to academia read, listen to, and easily comprehend dense academic screenshots.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
       <body className="bg-purple-950 text-purple-50 font-sans min-h-screen" suppressHydrationWarning>
         {children}
       </body>
    </html>
  );
}
