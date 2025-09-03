import { LoginForm } from "@/components/LoginForm";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { ResearcherDashboard } from "@/components/researcher/ResearcherDashboard";
import { useAuthContext } from "@/components/AuthProvider";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const Index = () => {
  const { user, profile, loading, isAdmin, isResearcher } = useAuthContext();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card>
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Carregando...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user || !profile) {
    return <LoginForm onLogin={() => {}} />;
  }

  if (isAdmin()) {
    return <AdminDashboard />;
  }

  if (isResearcher()) {
  return <ResearcherDashboard />;
  }

  // Fallback for unknown role
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Perfil de usuário não reconhecido</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;
