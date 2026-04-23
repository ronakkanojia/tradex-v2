import './globals.css';

export const metadata = {
  title: 'Tradex | Intraday Options Analytics',
  description: 'Premium intraday options simulation dashboard powered by Yahoo Finance and Black-Scholes.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
