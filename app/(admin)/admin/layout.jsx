// app/layout.jsx or app/(admin)/layout.jsx
"use client";

import { AuthProvider } from "@/providers/AuthProvider";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}