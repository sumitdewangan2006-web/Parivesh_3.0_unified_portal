import "../styles/globals.css";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/contexts/AuthContext";
import { PortalUiProvider } from "@/contexts/PortalUiContext";
import PortalFooter from "@/components/PortalFooter";
import PariveshAssistant from "@/components/PariveshAssistant";

export const metadata = {
  title: "PARIVESH 3.0 — Unified Environmental Clearance Portal",
  description:
    "A unified portal for managing the complete lifecycle of Environmental Clearance applications.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="portal-body">
        <div className="tricolor-bar" />
        <PortalUiProvider>
          <AuthProvider>
            <div className="min-h-screen flex flex-col">
              {children}
              <PortalFooter />
            </div>
            <PariveshAssistant />
            <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
          </AuthProvider>
        </PortalUiProvider>
      </body>
    </html>
  );
}

