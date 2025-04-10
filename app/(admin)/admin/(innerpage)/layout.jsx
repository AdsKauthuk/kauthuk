import { Roboto } from "next/font/google";
import Sidebar from "./_components/Sidebar";
import Header from "./_components/Header";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { Toaster } from "sonner";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-roboto",
});

export const metadata = {
  title: "Kauthuk Admin Dashboard",
  description: "Modern admin dashboard for Kauthuk",
};

export default function AdminLayout({ children }) {
  return (
      <ThemeProvider defaultTheme="light" storageKey="kauthuk-theme">
        <div className={`${roboto.variable} font-sans antialiased min-h-screen bg-background`}>
          <div className="flex h-screen">
            <Sidebar className="hidden md:flex" />
            <div className="flex flex-col flex-1 md:ml-64 h-full">
              <Header />
              <main className="flex-1 p-6 overflow-auto">
                {children}
              </main>
              <footer className="py-4 px-6 border-t text-center text-sm text-muted-foreground mt-auto">
                &copy; {new Date().getFullYear()} Kauthuk Admin Dashboard. All rights reserved.
              </footer>
            </div>
          </div>
          <Toaster richColors />
        </div>
      </ThemeProvider>
  );
}