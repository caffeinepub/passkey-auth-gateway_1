import { useInternetIdentity } from "./hooks/useInternetIdentity";
import LandingPage from "./pages/LandingPage";
import DashboardLayout from "./pages/DashboardLayout";
import { Toaster } from "@/components/ui/sonner";

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();

  // Show nothing while initializing
  if (isInitializing) {
    return null;
  }

  // If user is authenticated, show DashboardLayout; otherwise show LandingPage
  const isAuthenticated = identity && !identity.getPrincipal().isAnonymous();

  return (
    <>
      {isAuthenticated ? <DashboardLayout /> : <LandingPage />}
      <Toaster />
    </>
  );
}
