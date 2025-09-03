import { useState } from "react";
import { LoginForm } from "@/components/LoginForm";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { ResearcherDashboard } from "@/components/researcher/ResearcherDashboard";

const Index = () => {
  const [user, setUser] = useState<{ type: 'admin' | 'researcher' } | null>(null);

  const handleLogin = (userType: 'admin' | 'researcher') => {
    setUser({ type: userType });
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (!user) {
    return <LoginForm onLogin={handleLogin} />;
  }

  if (user.type === 'admin') {
    return <AdminDashboard />;
  }

  return <ResearcherDashboard />;
};

export default Index;
