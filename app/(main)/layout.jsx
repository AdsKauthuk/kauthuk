import Footer from "@/components/Footer";
import Header from "@/components/MainComponents/Header";
import CategoryList from "@/components/CategoryList"; // Import CategoryList
import { CartProvider } from "@/providers/CartProvider";
import { UserAuthProvider } from "@/providers/UserProvider";
import { Playfair_Display, Poppins } from "next/font/google";

// Define fonts
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  style:["normal","italic"]
});

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
});

export default function MainLayout({ children }) {
  return (
    <UserAuthProvider>
      <CartProvider>
        <main className={`w-full ${playfair.variable} ${poppins.variable}`}>
          <Header />
          {/* Add CategoryList component below Header */}
          {/* <CategoryList /> */}
          <div className="w-full min-h-screen">
            {children}
          </div>
          <Footer />
        </main>
      </CartProvider>
    </UserAuthProvider>
  );
}