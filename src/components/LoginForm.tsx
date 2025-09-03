import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { BarChart3, MapPin, Users, TrendingUp } from "lucide-react";
import { useAuthContext } from "@/components/AuthProvider";
import { toast } from "sonner";

interface LoginFormProps {
  onLogin: (userType: 'admin' | 'researcher') => void;
}

export const LoginForm = ({ onLogin }: LoginFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState<'admin' | 'researcher'>('admin');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuthContext();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLogin();
  };

  const handleLogin = async () => {
    if (!email || !password) {
      toast.error('Por favor, preencha todos os campos');
      return;
    }

    setIsLoading(true);
    try {
      const { user } = await signIn(email, password);
      if (user) {
        toast.success('Login realizado com sucesso!');
        // The auth context will handle the redirect
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Erro ao fazer login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-primary rounded-full blur-3xl opacity-20 -translate-y-48 translate-x-48" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-secondary rounded-full blur-3xl opacity-20 translate-y-48 -translate-x-48" />
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="flex min-h-screen">
          {/* Left Side - Branding & Features */}
          <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-12">
            <div className="mb-8">
              <h1 className="text-5xl font-bold text-foreground mb-4">
                Vote Scout Pro
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Plataforma profissional para pesquisas eleitorais com precisão estatística e tecnologia avançada
              </p>
              
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-primary-light">
                    <BarChart3 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">Cálculos Automáticos</h3>
                    <p className="text-xs text-muted-foreground">Margem de erro e amostra</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-secondary-light">
                    <MapPin className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">GPS & Geolocalização</h3>
                    <p className="text-xs text-muted-foreground">Controle de campo</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-info/10">
                    <Users className="h-5 w-5 text-info" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">Gestão de Equipe</h3>
                    <p className="text-xs text-muted-foreground">Pesquisadores e admin</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-success/10">
                    <TrendingUp className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">Tempo Real</h3>
                    <p className="text-xs text-muted-foreground">Resultados instantâneos</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Side - Login Form */}
          <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
            <Card className="w-full max-w-md shadow-electoral">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Acesso ao Sistema</CardTitle>
                <CardDescription>
                  Entre com suas credenciais para acessar o Vote Scout Pro
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                {/* User Type Selection */}
                <div className="flex space-x-2 mb-6">
                  <Button
                    type="button"
                    variant={userType === 'admin' ? 'electoral' : 'outline'}
                    size="sm"
                    onClick={() => setUserType('admin')}
                    className="flex-1"
                  >
                    Administrador
                  </Button>
                  <Button
                    type="button"
                    variant={userType === 'researcher' ? 'electoral' : 'outline'}
                    size="sm"
                    onClick={() => setUserType('researcher')}
                    className="flex-1"
                  >
                    Pesquisador
                  </Button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    variant="electoral"
                    size="lg"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Entrando...' : 'Entrar no Sistema'}
                  </Button>
                </form>
                
                {/* Demo Credentials */}
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <h4 className="font-medium text-sm mb-2">Credenciais Demo:</h4>
                  <div className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <span>Admin:</span>
                      <Badge variant="outline" className="text-xs">admin@demo.com</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Pesquisador:</span>
                      <Badge variant="outline" className="text-xs">pesquisador@demo.com</Badge>
                    </div>
                    <div className="text-center mt-2 text-muted-foreground">
                      Senha: demo123
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};