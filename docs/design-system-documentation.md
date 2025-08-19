
# Design System - Sistema de Controle de Abastecimento

## 1. Identidade Visual

### 1.1 Paleta de Cores

#### Cores Primárias
```css
/* Azul Principal - Usado para botões primários e elementos de destaque */
--primary: hsl(207, 90%, 54%)
--primary-foreground: hsl(210, 40%, 98%)

/* Neutros - Base do sistema */
--background: hsl(0, 0%, 100%)
--foreground: hsl(20, 14.3%, 4.1%)
--card: hsl(0, 0%, 100%)
--card-foreground: hsl(20, 14.3%, 4.1%)
```

#### Cores Secundárias
```css
--secondary: hsl(0, 0%, 96.1%)
--secondary-foreground: hsl(0, 0%, 9%)
--muted: hsl(0, 0%, 96.1%)
--muted-foreground: hsl(0, 0%, 45.1%)
```

#### Cores de Estado
```css
/* Sucesso - Verde */
--fuel-success: hsl(122, 39%, 49%)

/* Aviso - Amarelo/Laranja */
--fuel-warning: hsl(35, 91%, 58%)
--warning: 38 92% 50%
--warning-foreground: 48 96% 8%

/* Erro - Vermelho */
--fuel-error: hsl(4, 90%, 58%)
--destructive: hsl(0, 84.2%, 60.2%)
--destructive-foreground: hsl(0, 0%, 98%)
```

#### Cores de Interface
```css
--border: hsl(0, 0%, 89.8%)
--input: hsl(0, 0%, 89.8%)
--ring: hsl(207, 90%, 54%)
--accent: hsl(0, 0%, 96.1%)
--accent-foreground: hsl(0, 0%, 9%)
```

### 1.2 Dark Mode
```css
.dark {
  --background: hsl(20, 14.3%, 4.1%);
  --foreground: hsl(0, 0%, 95%);
  --card: hsl(20, 14.3%, 4.1%);
  --card-foreground: hsl(0, 0%, 95%);
  --border: hsl(240, 3.7%, 15.9%);
  --input: hsl(240, 3.7%, 15.9%);
}
```

## 2. Tipografia

### 2.1 Hierarquia de Texto
```css
/* Títulos Principais */
.text-4xl { font-size: 2.25rem; line-height: 2.5rem; }
.text-3xl { font-size: 1.875rem; line-height: 2.25rem; }
.text-2xl { font-size: 1.5rem; line-height: 2rem; }

/* Subtítulos */
.text-xl { font-size: 1.25rem; line-height: 1.75rem; }
.text-lg { font-size: 1.125rem; line-height: 1.75rem; }

/* Texto Base */
.text-base { font-size: 1rem; line-height: 1.5rem; }
.text-sm { font-size: 0.875rem; line-height: 1.25rem; }
.text-xs { font-size: 0.75rem; line-height: 1rem; }
```

### 2.2 Pesos de Fonte
```css
.font-thin { font-weight: 100; }
.font-light { font-weight: 300; }
.font-normal { font-weight: 400; }
.font-medium { font-weight: 500; }
.font-semibold { font-weight: 600; }
.font-bold { font-weight: 700; }
```

## 3. Componentes Base

### 3.1 Botões

#### Botão Primário
```tsx
<Button className="bg-primary text-primary-foreground hover:bg-primary/90">
  Texto do Botão
</Button>
```

#### Botão Secundário
```tsx
<Button variant="secondary" className="bg-secondary text-secondary-foreground hover:bg-secondary/80">
  Texto do Botão
</Button>
```

#### Botão Destrutivo
```tsx
<Button variant="destructive" className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
  Excluir
</Button>
```

#### Botão Outline
```tsx
<Button variant="outline" className="border border-input hover:bg-accent hover:text-accent-foreground">
  Cancelar
</Button>
```

### 3.2 Cards

#### Card Padrão
```tsx
<Card className="border border-border bg-card text-card-foreground shadow-sm">
  <CardHeader className="p-6">
    <CardTitle className="text-2xl font-semibold">Título</CardTitle>
    <CardDescription className="text-muted-foreground">Descrição</CardDescription>
  </CardHeader>
  <CardContent className="p-6 pt-0">
    Conteúdo do card
  </CardContent>
</Card>
```

#### Card com Destaque
```tsx
<Card className="border-2 border-primary bg-card shadow-lg">
  <CardContent className="p-6">
    Conteúdo destacado
  </CardContent>
</Card>
```

### 3.3 Inputs e Formulários

#### Input Padrão
```tsx
<Input 
  className="border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
  placeholder="Digite aqui..."
/>
```

#### Select
```tsx
<Select>
  <SelectTrigger className="border border-input bg-background">
    <SelectValue placeholder="Selecione uma opção" />
  </SelectTrigger>
  <SelectContent className="bg-popover text-popover-foreground border border-border">
    <SelectItem value="opcao1">Opção 1</SelectItem>
    <SelectItem value="opcao2">Opção 2</SelectItem>
  </SelectContent>
</Select>
```

#### Textarea
```tsx
<Textarea 
  className="border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
  rows={4}
  placeholder="Digite sua mensagem..."
/>
```

### 3.4 Badges de Status

#### Status Aprovado
```tsx
<Badge className="bg-green-100 text-green-800 border-green-300">
  Aprovado
</Badge>
```

#### Status Pendente
```tsx
<Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
  Pendente
</Badge>
```

#### Status Rejeitado
```tsx
<Badge className="bg-red-100 text-red-800 border-red-300">
  Rejeitado
</Badge>
```

#### Status Atendido
```tsx
<Badge className="bg-blue-100 text-blue-800 border-blue-300">
  Atendido
</Badge>
```

## 4. Layout e Estrutura

### 4.1 Grid System
```css
/* Container principal */
.container { max-width: 1280px; margin: 0 auto; padding: 0 1rem; }

/* Grid responsivo */
.grid { display: grid; }
.grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
.grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }

/* Gaps */
.gap-4 { gap: 1rem; }
.gap-6 { gap: 1.5rem; }
.gap-8 { gap: 2rem; }
```

### 4.2 Breakpoints Responsivos
```css
/* Mobile First */
@media (min-width: 475px) { /* xs */ }
@media (min-width: 640px) { /* sm */ }
@media (min-width: 768px) { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
@media (min-width: 1536px) { /* 2xl */ }
```

### 4.3 Sidebar Layout
```tsx
<div className="flex h-screen bg-background">
  {/* Sidebar */}
  <aside className="w-64 bg-card border-r border-border">
    <nav className="p-4 space-y-2">
      {/* Items do menu */}
    </nav>
  </aside>
  
  {/* Conteúdo principal */}
  <main className="flex-1 overflow-auto">
    <header className="bg-card border-b border-border p-4">
      {/* Header */}
    </header>
    <div className="p-6">
      {/* Conteúdo da página */}
    </div>
  </main>
</div>
```

## 5. Iconografia

### 5.1 Ícones Principais (Lucide React)
```tsx
import { 
  Home, 
  FileText, 
  Users, 
  Settings, 
  Plus, 
  Search, 
  Filter, 
  Download,
  Upload,
  Edit,
  Trash2,
  Check,
  X,
  AlertTriangle,
  Info,
  Bell
} from 'lucide-react'
```

### 5.2 Tamanhos de Ícones
```tsx
{/* Pequeno */}
<Icon className="h-4 w-4" />

{/* Médio */}
<Icon className="h-5 w-5" />

{/* Grande */}
<Icon className="h-6 w-6" />

{/* Extra Grande */}
<Icon className="h-8 w-8" />
```

## 6. Tabelas

### 6.1 Estrutura Base
```tsx
<Table className="border border-border">
  <TableHeader>
    <TableRow className="border-b border-border">
      <TableHead className="text-muted-foreground font-medium">Coluna 1</TableHead>
      <TableHead className="text-muted-foreground font-medium">Coluna 2</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow className="border-b border-border hover:bg-muted/50">
      <TableCell className="py-4">Dado 1</TableCell>
      <TableCell className="py-4">Dado 2</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

### 6.2 Paginação
```tsx
<Pagination>
  <PaginationContent>
    <PaginationItem>
      <PaginationPrevious href="#" />
    </PaginationItem>
    <PaginationItem>
      <PaginationLink href="#" isActive>1</PaginationLink>
    </PaginationItem>
    <PaginationItem>
      <PaginationNext href="#" />
    </PaginationItem>
  </PaginationContent>
</Pagination>
```

## 7. Modais e Diálogos

### 7.1 Dialog Padrão
```tsx
<Dialog>
  <DialogTrigger asChild>
    <Button>Abrir Modal</Button>
  </DialogTrigger>
  <DialogContent className="bg-background border border-border">
    <DialogHeader>
      <DialogTitle className="text-lg font-semibold">Título do Modal</DialogTitle>
      <DialogDescription className="text-muted-foreground">
        Descrição do modal
      </DialogDescription>
    </DialogHeader>
    <div className="py-4">
      {/* Conteúdo */}
    </div>
    <DialogFooter>
      <Button variant="outline">Cancelar</Button>
      <Button>Confirmar</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

## 8. Alertas e Notificações

### 8.1 Alert Padrão
```tsx
<Alert className="border border-border">
  <AlertTriangle className="h-4 w-4" />
  <AlertTitle>Atenção</AlertTitle>
  <AlertDescription>
    Esta é uma mensagem de alerta importante.
  </AlertDescription>
</Alert>
```

### 8.2 Toast Notifications
```tsx
const { toast } = useToast()

toast({
  title: "Sucesso",
  description: "Operação realizada com sucesso!",
  variant: "default", // default | destructive
})
```

## 9. Gráficos e Visualizações

### 9.1 Configuração de Cores para Charts
```tsx
const chartConfig = {
  approved: {
    label: "Aprovados",
    color: "hsl(122, 39%, 49%)",
  },
  pending: {
    label: "Pendentes", 
    color: "hsl(35, 91%, 58%)",
  },
  rejected: {
    label: "Rejeitados",
    color: "hsl(4, 90%, 58%)",
  },
}
```

## 10. Espaçamentos e Bordas

### 10.1 Sistema de Espaçamento
```css
/* Padding */
.p-0 { padding: 0; }
.p-1 { padding: 0.25rem; }
.p-2 { padding: 0.5rem; }
.p-4 { padding: 1rem; }
.p-6 { padding: 1.5rem; }
.p-8 { padding: 2rem; }

/* Margin */
.m-0 { margin: 0; }
.m-1 { margin: 0.25rem; }
.m-2 { margin: 0.5rem; }
.m-4 { margin: 1rem; }
.m-6 { margin: 1.5rem; }
.m-8 { margin: 2rem; }
```

### 10.2 Border Radius
```css
--radius: 0.5rem;

.rounded-none { border-radius: 0; }
.rounded-sm { border-radius: calc(var(--radius) - 4px); }
.rounded { border-radius: calc(var(--radius) - 2px); }
.rounded-md { border-radius: calc(var(--radius) - 2px); }
.rounded-lg { border-radius: var(--radius); }
.rounded-full { border-radius: 9999px; }
```

## 11. Estados de Loading

### 11.1 Skeleton Loading
```tsx
<div className="space-y-3">
  <Skeleton className="h-4 w-full" />
  <Skeleton className="h-4 w-3/4" />
  <Skeleton className="h-4 w-1/2" />
</div>
```

### 11.2 Spinner
```tsx
<div className="flex items-center justify-center p-4">
  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
</div>
```

## 12. Implementação

### 12.1 CSS Variables (Arquivo principal)
```css
:root {
  --background: hsl(0, 0%, 100%);
  --foreground: hsl(20, 14.3%, 4.1%);
  --primary: hsl(207, 90%, 54%);
  --primary-foreground: hsl(210, 40%, 98%);
  --secondary: hsl(0, 0%, 96.1%);
  --secondary-foreground: hsl(0, 0%, 9%);
  --muted: hsl(0, 0%, 96.1%);
  --muted-foreground: hsl(0, 0%, 45.1%);
  --border: hsl(0, 0%, 89.8%);
  --input: hsl(0, 0%, 89.8%);
  --ring: hsl(207, 90%, 54%);
  --radius: 0.5rem;
}
```

### 12.2 Tailwind Config
```typescript
export default {
  darkMode: ["class"],
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        // ... resto das cores
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

## 13. Boas Práticas

### 13.1 Consistência Visual
- Use sempre as cores definidas no sistema
- Mantenha espaçamentos consistentes (múltiplos de 4px)
- Aplique a hierarquia tipográfica corretamente
- Use ícones do mesmo conjunto (Lucide React)

### 13.2 Acessibilidade
- Contraste mínimo de 4.5:1 para texto normal
- Contraste mínimo de 3:1 para texto grande
- Foco visível em todos os elementos interativos
- Texto alternativo para ícones informativos

### 13.3 Responsividade
- Design mobile-first
- Teste em todos os breakpoints definidos
- Use grid e flexbox para layouts flexíveis
- Oculte/mostre elementos conforme necessário

Esta documentação fornece uma base sólida para replicar a identidade visual do sistema em outros projetos, mantendo consistência e qualidade no design.
