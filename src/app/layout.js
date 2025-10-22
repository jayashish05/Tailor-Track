import './globals.css';

export const metadata = {
  title: 'Tailor Track - Order Management System',
  description: 'Professional order management system for tailoring businesses',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
