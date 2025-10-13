import "./globals.css";
import { AuthProvider } from "@/hooks/useAuth";

export const metadata = {
  title: "TailorTrack - Tailoring Management System",
  description: "Complete tailoring shop management solution with order tracking, payments, and analytics",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
