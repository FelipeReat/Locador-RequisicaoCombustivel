import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Fuel, User, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, isLoading } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    try {
      await login(username, password);
      // Success toast will be handled by auth context, don't duplicate here
    } catch (err: any) {
      console.error('Login error:', err);
      
      // Handle specific error types with user-friendly messages
      let errorMessage = 'Erro ao fazer login. Tente novamente.';
      
      if (err.message) {
        if (err.message.includes('Usuário não encontrado') || err.message.includes('User not found')) {
          errorMessage = 'Usuário não encontrado. Verifique se o nome de usuário está correto.';
        } else if (err.message.includes('Senha incorreta') || err.message.includes('Invalid password') || err.message.includes('password')) {
          errorMessage = 'Senha incorreta. Verifique sua senha e tente novamente.';
        } else if (err.message.includes('Credenciais inválidas') || err.message.includes('Invalid credentials')) {
          errorMessage = 'Usuário ou senha incorretos. Verifique seus dados e tente novamente.';
        } else if (err.message.includes('authentication') || err.message.includes('login')) {
          errorMessage = 'Falha na autenticação. Verifique seu usuário e senha.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      
      // Show toast with error for better visibility
      toast({
        title: "Acesso negado",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm dark:bg-gray-800/80">
          <CardHeader className="space-y-6 pb-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                <Fuel className="w-8 h-8 text-white" />
              </div>
              <div className="text-center space-y-2">
                <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                  Sistema LOCADOR
                </CardTitle>
                <CardDescription className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                  Módulo de requisição de abastecimento
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive" className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
                <AlertDescription className="text-red-700 dark:text-red-300 text-sm leading-relaxed">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Usuário
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Digite seu usuário"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10 py-2.5 border-gray-200 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Senha
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Digite sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 py-2.5 border-gray-200 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    disabled={isLoading}
                  />
                </div>
              </div>



              <Button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  'Entrar no sistema'
                )}
              </Button>
            </form>

            <div className="text-center space-y-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Versão 2.0 • Gestão de Requisições
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Desenvolvido por Departamento de Tecnologia • Suporte Técnico
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}