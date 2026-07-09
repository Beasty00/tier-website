import type { Metadata } from "next";
import { LoginPageContent } from "@/components/login-page-content";

export const metadata: Metadata = {
  title: "Discord Login",
  description: "Discord OAuth login callback for the Minecraft tier testing platform."
};

export default function LoginPage() {
  return (
    <main className="minecraft-grid min-h-screen px-4 py-14 sm:px-6 lg:px-8">
      <LoginPageContent />
    </main>
  );
}
