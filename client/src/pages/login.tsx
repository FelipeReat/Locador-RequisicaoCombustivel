import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowRight, Fuel, Loader2, Lock, User } from 'lucide-react';
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
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-zinc-100 via-stone-50 to-amber-100/50 px-4 py-8 dark:from-zinc-950 dark:via-zinc-950 dark:to-amber-950/10 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-0 top-0 h-72 w-72 rounded-full bg-amber-300/15 blur-3xl dark:bg-amber-500/10" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-stone-300/15 blur-3xl dark:bg-stone-500/10" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl items-center justify-center">
        <div className="w-full max-w-lg">
          <Card className="w-full overflow-hidden border border-zinc-200/80 bg-white/92 shadow-2xl backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-900/88">
            <CardHeader className="space-y-5 border-b border-zinc-200/70 bg-gradient-to-br from-white via-zinc-50 to-amber-50/50 p-8 dark:border-zinc-800/70 dark:from-zinc-950 dark:via-zinc-900 dark:to-amber-950/10">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-zinc-700 via-stone-700 to-amber-600 shadow-lg">
                  <Fuel className="h-7 w-7 text-white" />
                </div>
                <div className="space-y-1">
                  <div className="inline-flex items-center rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-300">
                    Acesso ao sistema
                  </div>
                  <CardTitle className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
                    Bem-vindo de volta
                  </CardTitle>
                  <CardDescription className="text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                    Entre com seu usuário e senha para continuar.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 p-8">
              {error && (
                <Alert variant="destructive" className="border-red-200 bg-red-50/90 dark:border-red-800 dark:bg-red-900/20">
                  <AlertDescription className="text-sm leading-relaxed text-red-700 dark:text-red-300">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Usuário
                  </Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                    <Input
                      id="username"
                      type="text"
                      placeholder="Digite seu usuário"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase())}
                      className="h-12 rounded-xl border-zinc-200 bg-white pl-11 text-zinc-900 focus:border-amber-500 focus:ring-amber-500 dark:border-zinc-700 dark:bg-zinc-950/70 dark:text-white"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Senha
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Digite sua senha"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 rounded-xl border-zinc-200 bg-white pl-11 text-zinc-900 focus:border-amber-500 focus:ring-amber-500 dark:border-zinc-700 dark:bg-zinc-950/70 dark:text-white"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="h-12 w-full rounded-xl bg-gradient-to-r from-zinc-700 via-stone-700 to-amber-600 text-white shadow-lg transition-all duration-200 hover:from-zinc-800 hover:via-stone-800 hover:to-amber-700 hover:shadow-xl"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    <>
                      Entrar no sistema
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>

              <div className="space-y-3 border-t border-zinc-200/70 pt-5 text-center dark:border-zinc-800/70">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                  Gestão de Requisições
                </p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Versão 3.5.9
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-500">
                  Desenvolvido Por Luiz Felipe Reat º Suporte Técnico
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
