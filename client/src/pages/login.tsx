
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Fuel } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(1, "Digite seu usuário"),
  password: z.string().min(1, "Digite sua senha"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        localStorage.setItem("auth-token", result.token);
        window.location.href = "/dashboard";
      } else {
        toast({
          title: "Erro de autenticação",
          description: "Usuário ou senha inválidos",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao conectar com o servidor",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl border-0 bg-white">
          <CardHeader className="space-y-6 pb-8">
            {/* Logo e Título */}
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto">
                <Fuel className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Sistema LOCADOR</h1>
                <p className="text-sm text-gray-600 mt-1">Módulo de Controle de Combustível</p>
              </div>
            </div>

            {/* Tabs de navegação (apenas visual) */}
            <div className="flex justify-center space-x-1 bg-gray-100 rounded-lg p-1">
              <div className="px-4 py-2 bg-white text-orange-600 rounded-md text-sm font-medium shadow-sm">
                📋 Documentos
              </div>
              <div className="px-4 py-2 text-gray-600 text-sm font-medium">
                🏠 Imóveis
              </div>
              <div className="px-4 py-2 text-gray-600 text-sm font-medium">
                🔧 Módulos
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-gray-700">
                  Usuário
                </Label>
                <Input
                  id="username"
                  placeholder="Digite seu usuário"
                  {...form.register("username")}
                  className="h-12 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                />
                {form.formState.errors.username && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.username.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700">
                  Senha
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Digite sua senha"
                  {...form.register("password")}
                  className="h-12 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                />
                {form.formState.errors.password && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg mt-6"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Conectando...
                  </>
                ) : (
                  "Conectar-se ao sistema"
                )}
              </Button>
            </form>

            {/* Footer */}
            <div className="text-center text-xs text-gray-500 space-y-1 pt-4 border-t border-gray-100">
              <p>LOCATOR v2.0 | Controle de Propriedades</p>
              <p>Desenvolvido pelo Escritório Nacional • Técnico e Suporte</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
