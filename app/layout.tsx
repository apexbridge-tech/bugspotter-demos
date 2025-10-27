import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'BugSpotter Demo Platform',
  description: 'Interactive demo platform showcasing bug tracking and monitoring',
  icons: {
    icon: [
      {
        url: 'data:image/svg+xml,<svg xmlns="http://w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🐛</text></svg>',
        type: 'image/svg+xml',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Set favicon based on current path
              (function() {
                const path = window.location.pathname;
                let emoji = '🐛'; // Default BugSpotter icon
                
                if (path.includes('admin')) {
                  emoji = '⚙️';
                } else if (path.includes('dashboard')) {
                  emoji = '📊';
                }
                
                const favicon = document.createElement('link');
                favicon.rel = 'icon';
                favicon.href = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">' + emoji + '</text></svg>';
                document.head.appendChild(favicon);
              })();
            `,
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>{children}</body>
    </html>
  );
}
