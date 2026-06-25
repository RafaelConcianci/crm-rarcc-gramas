# CRM RARCC Gramas — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-stack web CRM with login, roles, and sales management screens for RARCC Gramas turf company.

**Architecture:** Next.js 14 App Router frontend + Supabase (PostgreSQL + Auth). Route protection via middleware.ts. RLS enforces data isolation at the database layer. All business logic calculations (faturamento, lucro, comissão) are computed in `lib/formulas.ts`.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, Recharts, SheetJS, Supabase (@supabase/supabase-js + @supabase/ssr), Python 3 (migration script)

## Global Constraints

- Node.js ≥ 18, npm ≥ 9
- Next.js 14 with App Router (not Pages Router)
- TypeScript strict mode
- All monetary values: `numeric(10,2)` in DB, `number` in TS
- Roles: `'admin' | 'vendedor'` — no other values
- Status carregamento: `'agendado' | 'realizado' | 'cancelado'`
- Admin: Rafael Concianci. Vendedor inicial: Fábio Caiares
- Portuguese UI labels throughout
- No Mudas/Paisagismo module

---

## File Map

```
/app
  layout.tsx                        ← root layout (font, providers)
  page.tsx                          ← redirect → /dashboard or /login
  /login/page.tsx                   ← login form
  /dashboard/page.tsx               ← dashboard metrics
  /carregamentos/page.tsx           ← table + calendar tabs
  /clientes/page.tsx                ← client list + CRUD
  /financeiro/page.tsx              ← admin-only financeiro
  /metas/page.tsx                   ← admin-only metas
  /usuarios/page.tsx                ← admin-only user management
  /api/usuarios/route.ts            ← Route Handler: create user via Admin API
middleware.ts                       ← route protection by role
/components
  sidebar.tsx                       ← responsive nav sidebar
  /dashboard
    metrics-cards.tsx
    vendedores-chart.tsx
    ranking-table.tsx
  /carregamentos
    carregamentos-table.tsx
    carregamento-form.tsx
    agenda-calendar.tsx
  /clientes
    clientes-table.tsx
    cliente-form.tsx
  /financeiro
    financeiro-table.tsx
    financeiro-form.tsx
    financeiro-summary.tsx
  /metas
    metas-table.tsx
    meta-form.tsx
  /usuarios
    usuarios-table.tsx
    usuario-form.tsx
/lib
  supabase.ts                       ← browser Supabase client
  supabase-server.ts                ← server Supabase client
  types.ts                          ← all TypeScript types
  formulas.ts                       ← faturamento, lucro, comissão calculations
/scripts
  migrate_excel.py
```

---

### Task 1: Project Setup + Supabase Clients + Types

**Files:**
- Create: `lib/supabase.ts`
- Create: `lib/supabase-server.ts`
- Create: `lib/types.ts`
- Create: `lib/formulas.ts`
- Create: `.env.local`
- Modify: `package.json` (dependencies)

**Interfaces:**
- Produces: All TypeScript types used by every other task
- Produces: `createClient()` (browser), `createServerClient()` (server)
- Produces: `calcFaturamento()`, `calcLucroBruto()`, `calcComissao()`

- [ ] **Step 1: Initialize Next.js project**

```bash
cd "C:\Users\Rafael Concianci\projeto"
npx create-next-app@14 crm --typescript --tailwind --eslint --app --src-dir=no --import-alias="@/*"
cd crm
```

- [ ] **Step 2: Install dependencies**

```bash
npm install @supabase/supabase-js @supabase/ssr
npm install recharts
npm install xlsx
npm install date-fns
npm install lucide-react
npm install class-variance-authority clsx tailwind-merge
npx shadcn@latest init -d
npx shadcn@latest add button input label card table badge dialog form select toast calendar
```

- [ ] **Step 3: Create `.env.local`**

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

Replace values from Supabase dashboard → Project Settings → API.

- [ ] **Step 4: Create `lib/types.ts`**

```typescript
export type Role = 'admin' | 'vendedor'
export type StatusCarregamento = 'agendado' | 'realizado' | 'cancelado'
export type CategoriaFinanceiro = 'fixa' | 'variavel'
export type TipoFinanceiro =
  | 'salario' | 'comissao' | 'imposto' | 'compra_grama'
  | 'frete' | 'plantio' | 'outros_fixo' | 'outros_variavel'

export interface Profile {
  id: string
  nome: string
  role: Role
  ativo: boolean
  criado_em: string
  email?: string // joined from auth.users
}

export interface Cliente {
  id: string
  nome: string
  cidade: string
  estado: string
  criado_em: string
}

export interface Carregamento {
  id: string
  data: string
  data_entrega: string | null
  status: StatusCarregamento
  cliente_id: string
  produto: string
  quantidade: number
  nf: string
  motorista: string
  fornecedor: string
  custo_total: number
  preco_m2: number
  frete: number
  ad_servico: number
  custo_servico: number
  vendedor_id: string
  criado_em: string
  // joined
  clientes?: Pick<Cliente, 'nome' | 'cidade'>
  profiles?: Pick<Profile, 'nome'>
}

export interface Meta {
  id: string
  mes: number
  ano: number
  nivel: string
  lucro_min: number
  lucro_max: number
  percentual_comissao: number
}

export interface Financeiro {
  id: string
  mes: number
  ano: number
  tipo: TipoFinanceiro
  categoria: CategoriaFinanceiro
  descricao: string
  valor: number
  criado_em: string
}

export interface VendedorMetrics {
  vendedor_id: string
  nome: string
  metragem: number
  faturamento: number
  lucro_bruto: number
  comissao: number
  percentual_meta: number
  nivel_meta: string
}
```

- [ ] **Step 5: Create `lib/formulas.ts`**

```typescript
import type { Carregamento, Meta, VendedorMetrics } from './types'

export function calcFaturamento(c: Pick<Carregamento, 'preco_m2' | 'quantidade'>): number {
  return c.preco_m2 * c.quantidade
}

export function calcLucroBruto(c: Pick<Carregamento, 'preco_m2' | 'quantidade' | 'custo_total' | 'frete' | 'custo_servico'>): number {
  return calcFaturamento(c) - c.custo_total - c.frete - c.custo_servico
}

export function findMetaNivel(lucroBruto: number, metas: Meta[]): Meta | null {
  return metas.find(m => lucroBruto >= m.lucro_min && lucroBruto <= m.lucro_max) ?? null
}

export function calcComissao(lucroBruto: number, metas: Meta[]): number {
  const meta = findMetaNivel(lucroBruto, metas)
  return meta ? lucroBruto * meta.percentual_comissao : 0
}

export function calcVendedorMetrics(
  vendedorId: string,
  nome: string,
  carregamentos: Carregamento[],
  metas: Meta[]
): VendedorMetrics {
  const meus = carregamentos.filter(c => c.vendedor_id === vendedorId)
  const metragem = meus.reduce((s, c) => s + c.quantidade, 0)
  const faturamento = meus.reduce((s, c) => s + calcFaturamento(c), 0)
  const lucro_bruto = meus.reduce((s, c) => s + calcLucroBruto(c), 0)
  const comissao = calcComissao(lucro_bruto, metas)
  const meta = findMetaNivel(lucro_bruto, metas)
  const maxMeta = metas.length ? Math.max(...metas.map(m => m.lucro_max)) : 1
  return {
    vendedor_id: vendedorId,
    nome,
    metragem,
    faturamento,
    lucro_bruto,
    comissao,
    percentual_meta: maxMeta > 0 ? lucro_bruto / maxMeta : 0,
    nivel_meta: meta?.nivel ?? 'Abaixo da base',
  }
}
```

- [ ] **Step 6: Create `lib/supabase.ts` (browser client)**

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 7: Create `lib/supabase-server.ts` (server client)**

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createServerSupabaseClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
```

- [ ] **Step 8: Verify project runs**

```bash
npm run dev
```

Expected: Next.js server starts on http://localhost:3000 with no TypeScript errors.

- [ ] **Step 9: Commit**

```bash
git init
git add .
git commit -m "feat: project setup with Next.js 14, Supabase clients, types, formulas"
```

---

### Task 2: Database Schema + RLS

**Files:**
- Create: `supabase/migrations/001_schema.sql`

**Interfaces:**
- Produces: All database tables and RLS policies consumed by every other task

- [ ] **Step 1: Create migration file `supabase/migrations/001_schema.sql`**

```sql
-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ENUM-like check constraints are used instead of enums for flexibility

-- profiles (linked to auth.users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  role text not null default 'vendedor' check (role in ('admin', 'vendedor')),
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

-- trigger: auto-create profile when auth user is created
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, nome, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'nome', new.email), 'vendedor');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- clientes
create table clientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cidade text not null default '',
  estado text not null default '',
  criado_em timestamptz not null default now()
);

-- carregamentos
create table carregamentos (
  id uuid primary key default gen_random_uuid(),
  data date not null,
  data_entrega date,
  status text not null default 'agendado' check (status in ('agendado','realizado','cancelado')),
  cliente_id uuid references clientes(id),
  produto text not null default '',
  quantidade integer not null default 0,
  nf text not null default '',
  motorista text not null default '',
  fornecedor text not null default '',
  custo_total numeric(10,2) not null default 0,
  preco_m2 numeric(10,2) not null default 0,
  frete numeric(10,2) not null default 0,
  ad_servico numeric(10,2) not null default 0,
  custo_servico numeric(10,2) not null default 0,
  vendedor_id uuid not null references profiles(id),
  criado_em timestamptz not null default now()
);

-- metas
create table metas (
  id uuid primary key default gen_random_uuid(),
  mes integer not null check (mes between 1 and 12),
  ano integer not null,
  nivel text not null,
  lucro_min numeric(10,2) not null,
  lucro_max numeric(10,2) not null,
  percentual_comissao numeric(5,4) not null,
  unique(mes, ano, nivel)
);

-- financeiro
create table financeiro (
  id uuid primary key default gen_random_uuid(),
  mes integer not null check (mes between 1 and 12),
  ano integer not null,
  tipo text not null check (tipo in ('salario','comissao','imposto','compra_grama','frete','plantio','outros_fixo','outros_variavel')),
  categoria text not null check (categoria in ('fixa','variavel')),
  descricao text not null default '',
  valor numeric(10,2) not null,
  criado_em timestamptz not null default now()
);

-- =====================
-- RLS
-- =====================

alter table profiles enable row level security;
alter table clientes enable row level security;
alter table carregamentos enable row level security;
alter table metas enable row level security;
alter table financeiro enable row level security;

-- Helper function: current user role
create or replace function current_user_role()
returns text language sql security definer stable as $$
  select role from profiles where id = auth.uid()
$$;

-- Helper function: is admin
create or replace function is_admin()
returns boolean language sql security definer stable as $$
  select current_user_role() = 'admin'
$$;

-- profiles RLS
create policy "profiles: own or admin select"
  on profiles for select using (id = auth.uid() or is_admin());

create policy "profiles: own update"
  on profiles for update using (id = auth.uid() or is_admin());

-- clientes RLS (shared)
create policy "clientes: authenticated select"
  on clientes for select using (auth.role() = 'authenticated');

create policy "clientes: authenticated insert"
  on clientes for insert with check (auth.role() = 'authenticated');

create policy "clientes: authenticated update"
  on clientes for update using (auth.role() = 'authenticated');

create policy "clientes: admin delete"
  on clientes for delete using (is_admin());

-- carregamentos RLS
create policy "carregamentos: admin all"
  on carregamentos for all using (is_admin());

create policy "carregamentos: vendedor own select"
  on carregamentos for select using (vendedor_id = auth.uid());

create policy "carregamentos: vendedor own insert"
  on carregamentos for insert with check (vendedor_id = auth.uid());

create policy "carregamentos: vendedor own update"
  on carregamentos for update using (vendedor_id = auth.uid());

create policy "carregamentos: vendedor own delete"
  on carregamentos for delete using (vendedor_id = auth.uid());

-- metas RLS
create policy "metas: authenticated select"
  on metas for select using (auth.role() = 'authenticated');

create policy "metas: admin write"
  on metas for all using (is_admin());

-- financeiro RLS
create policy "financeiro: admin only"
  on financeiro for all using (is_admin());
```

- [ ] **Step 2: Apply migration via Supabase dashboard**

Go to Supabase Dashboard → SQL Editor → paste the contents of `supabase/migrations/001_schema.sql` → Run.

Verify: all 5 tables appear in Table Editor (profiles, clientes, carregamentos, metas, financeiro).

- [ ] **Step 3: Commit**

```bash
git add supabase/
git commit -m "feat: database schema, RLS policies, profiles trigger"
```

---

### Task 3: Auth — Login Page + Middleware

**Files:**
- Create: `middleware.ts`
- Create: `app/login/page.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `createClient()` from `lib/supabase.ts`, `createServerSupabaseClient()` from `lib/supabase-server.ts`
- Produces: Protected routes; `/login` page

- [ ] **Step 1: Create `middleware.ts`**

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const ADMIN_ONLY = ['/financeiro', '/usuarios', '/metas']

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  if (!user && pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  if (user && ADMIN_ONLY.some(p => pathname.startsWith(p))) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
}
```

- [ ] **Step 2: Create `app/page.tsx`**

```typescript
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export default async function Home() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  redirect(user ? '/dashboard' : '/login')
}
```

- [ ] **Step 3: Create `app/login/page.tsx`**

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (error) {
      setErro('Email ou senha incorretos')
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl text-center">RARCC Gramas</CardTitle>
          <p className="text-center text-sm text-muted-foreground">CRM de Vendas</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email}
                onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="senha">Senha</Label>
              <Input id="senha" type="password" value={senha}
                onChange={e => setSenha(e.target.value)} required />
            </div>
            {erro && <p className="text-sm text-red-600">{erro}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 4: Verify login flow**

Run `npm run dev`, navigate to http://localhost:3000 — should redirect to `/login`. Enter wrong credentials — should show "Email ou senha incorretos".

- [ ] **Step 5: Commit**

```bash
git add app/ middleware.ts
git commit -m "feat: login page and route protection middleware"
```

---

### Task 4: Layout + Sidebar

**Files:**
- Create: `components/sidebar.tsx`
- Modify: `app/layout.tsx`
- Create: `app/(protected)/layout.tsx`

**Interfaces:**
- Consumes: `Profile` type, `createServerSupabaseClient()`
- Produces: Shared layout with sidebar used by all protected pages

- [ ] **Step 1: Create `components/sidebar.tsx`**

```typescript
'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import type { Role } from '@/lib/types'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Truck, Users, DollarSign, Target, UserCog, LogOut, Menu, X
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin','vendedor'] },
  { href: '/carregamentos', label: 'Carregamentos', icon: Truck, roles: ['admin','vendedor'] },
  { href: '/clientes', label: 'Clientes', icon: Users, roles: ['admin','vendedor'] },
  { href: '/financeiro', label: 'Financeiro', icon: DollarSign, roles: ['admin'] },
  { href: '/metas', label: 'Metas', icon: Target, roles: ['admin'] },
  { href: '/usuarios', label: 'Usuários', icon: UserCog, roles: ['admin'] },
] as const

interface SidebarProps {
  role: Role
  nome: string
}

export function Sidebar({ role, nome }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const items = navItems.filter(i => i.roles.includes(role))

  const NavLinks = () => (
    <nav className="flex flex-col gap-1 flex-1">
      {items.map(item => (
        <Link key={item.href} href={item.href}
          onClick={() => setOpen(false)}
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
            pathname.startsWith(item.href)
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
          )}>
          <item.icon className="h-4 w-4" />
          {item.label}
        </Link>
      ))}
    </nav>
  )

  return (
    <>
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 bg-background border-b">
        <span className="font-semibold">RARCC Gramas</span>
        <Button variant="ghost" size="icon" onClick={() => setOpen(!open)}>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-30 bg-black/50" onClick={() => setOpen(false)}>
          <div className="w-64 h-full bg-background p-4 flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="mb-6 mt-2">
              <p className="font-semibold">RARCC Gramas</p>
              <p className="text-xs text-muted-foreground">{nome}</p>
            </div>
            <NavLinks />
            <Button variant="ghost" className="mt-4 justify-start gap-3" onClick={handleLogout}>
              <LogOut className="h-4 w-4" /> Sair
            </Button>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 min-h-screen border-r bg-background p-4 fixed top-0 left-0">
        <div className="mb-6">
          <p className="font-semibold">RARCC Gramas</p>
          <p className="text-xs text-muted-foreground">{nome}</p>
        </div>
        <NavLinks />
        <Button variant="ghost" className="mt-4 justify-start gap-3" onClick={handleLogout}>
          <LogOut className="h-4 w-4" /> Sair
        </Button>
      </aside>
    </>
  )
}
```

- [ ] **Step 2: Create `app/(protected)/layout.tsx`**

```typescript
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { Sidebar } from '@/components/sidebar'
import type { Role } from '@/lib/types'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('nome, role')
    .eq('id', user.id)
    .single()

  return (
    <div className="flex min-h-screen">
      <Sidebar role={profile?.role as Role ?? 'vendedor'} nome={profile?.nome ?? ''} />
      <main className="flex-1 lg:ml-56 pt-14 lg:pt-0 p-4 lg:p-8">
        {children}
      </main>
    </div>
  )
}
```

- [ ] **Step 3: Move protected pages under `app/(protected)/`**

Move (or create) the following pages under `app/(protected)/`:
- `app/(protected)/dashboard/page.tsx`
- `app/(protected)/carregamentos/page.tsx`
- `app/(protected)/clientes/page.tsx`
- `app/(protected)/financeiro/page.tsx`
- `app/(protected)/metas/page.tsx`
- `app/(protected)/usuarios/page.tsx`

Each can be a placeholder for now:

```typescript
// Example: app/(protected)/dashboard/page.tsx
export default function DashboardPage() {
  return <div><h1 className="text-2xl font-bold">Dashboard</h1></div>
}
```

- [ ] **Step 4: Verify sidebar renders**

Run `npm run dev`, log in → should see sidebar with nav items matching role.

- [ ] **Step 5: Commit**

```bash
git add app/ components/sidebar.tsx
git commit -m "feat: responsive sidebar layout with role-based nav"
```

---

### Task 5: Dashboard

**Files:**
- Modify: `app/(protected)/dashboard/page.tsx`
- Create: `components/dashboard/metrics-cards.tsx`
- Create: `components/dashboard/vendedores-chart.tsx`
- Create: `components/dashboard/ranking-table.tsx`

**Interfaces:**
- Consumes: `calcVendedorMetrics()`, `Carregamento`, `Meta`, `Profile` from lib
- Produces: Dashboard page with cards, chart, ranking

- [ ] **Step 1: Create `components/dashboard/metrics-cards.tsx`**

```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface MetricsCardsProps {
  faturamento: number
  lucroBruto: number
  lucroLiquido: number
  percentualMeta: number
}

function fmt(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function MetricsCards({ faturamento, lucroBruto, lucroLiquido, percentualMeta }: MetricsCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-1"><CardTitle className="text-sm font-medium text-muted-foreground">Faturamento</CardTitle></CardHeader>
        <CardContent><p className="text-2xl font-bold">{fmt(faturamento)}</p></CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-1"><CardTitle className="text-sm font-medium text-muted-foreground">Lucro Bruto</CardTitle></CardHeader>
        <CardContent><p className="text-2xl font-bold">{fmt(lucroBruto)}</p></CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-1"><CardTitle className="text-sm font-medium text-muted-foreground">Lucro Líquido</CardTitle></CardHeader>
        <CardContent><p className="text-2xl font-bold">{fmt(lucroLiquido)}</p></CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-1"><CardTitle className="text-sm font-medium text-muted-foreground">% da Meta</CardTitle></CardHeader>
        <CardContent><p className="text-2xl font-bold">{(percentualMeta * 100).toFixed(1)}%</p></CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 2: Create `components/dashboard/vendedores-chart.tsx`**

```typescript
'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { VendedorMetrics } from '@/lib/types'

export function VendedoresChart({ data }: { data: VendedorMetrics[] }) {
  const chartData = data.map(v => ({
    nome: v.nome.split(' ')[0],
    Faturamento: v.faturamento,
    'Lucro Bruto': v.lucro_bruto,
  }))
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="nome" />
          <YAxis tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
          <Tooltip formatter={(v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
          <Bar dataKey="Faturamento" fill="#2563eb" />
          <Bar dataKey="Lucro Bruto" fill="#16a34a" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
```

- [ ] **Step 3: Create `components/dashboard/ranking-table.tsx`**

```typescript
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import type { VendedorMetrics } from '@/lib/types'

function fmt(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function RankingTable({ data }: { data: VendedorMetrics[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Vendedor</TableHead>
          <TableHead className="text-right">Metragem (m²)</TableHead>
          <TableHead className="text-right">Faturamento</TableHead>
          <TableHead className="text-right">Lucro Bruto</TableHead>
          <TableHead className="text-right">Comissão</TableHead>
          <TableHead>Nível</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.length === 0 && (
          <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Nenhum carregamento neste período</TableCell></TableRow>
        )}
        {data.map(v => (
          <TableRow key={v.vendedor_id}>
            <TableCell className="font-medium">{v.nome}</TableCell>
            <TableCell className="text-right">{v.metragem.toLocaleString('pt-BR')}</TableCell>
            <TableCell className="text-right">{fmt(v.faturamento)}</TableCell>
            <TableCell className="text-right">{fmt(v.lucro_bruto)}</TableCell>
            <TableCell className="text-right">{fmt(v.comissao)}</TableCell>
            <TableCell><Badge variant="outline">{v.nivel_meta}</Badge></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
```

- [ ] **Step 4: Implement `app/(protected)/dashboard/page.tsx`**

```typescript
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { calcVendedorMetrics, calcFaturamento, calcLucroBruto } from '@/lib/formulas'
import { MetricsCards } from '@/components/dashboard/metrics-cards'
import { VendedoresChart } from '@/components/dashboard/vendedores-chart'
import { RankingTable } from '@/components/dashboard/ranking-table'
import type { Carregamento, Meta, Profile } from '@/lib/types'

interface SearchParams { mes?: string; ano?: string }

export default async function DashboardPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single()

  const now = new Date()
  const mes = parseInt(searchParams.mes ?? String(now.getMonth() + 1))
  const ano = parseInt(searchParams.ano ?? String(now.getFullYear()))

  let query = supabase.from('carregamentos').select('*').eq('mes_ref', mes)
  // Filter by month using date range
  const startDate = `${ano}-${String(mes).padStart(2,'0')}-01`
  const endDate = `${ano}-${String(mes).padStart(2,'0')}-31`

  let carregsQuery = supabase.from('carregamentos').select('*')
    .gte('data', startDate).lte('data', endDate)

  if (profile?.role === 'vendedor') {
    carregsQuery = carregsQuery.eq('vendedor_id', user!.id)
  }

  const [{ data: carregamentos }, { data: metas }, { data: vendedores }] = await Promise.all([
    carregsQuery,
    supabase.from('metas').select('*').eq('mes', mes).eq('ano', ano),
    supabase.from('profiles').select('id, nome').eq('ativo', true),
  ])

  const c = (carregamentos ?? []) as Carregamento[]
  const m = (metas ?? []) as Meta[]
  const v = (vendedores ?? []) as Profile[]

  const metricsPerVendedor = v.map(vend =>
    calcVendedorMetrics(vend.id, vend.nome, c, m)
  ).filter(vm => vm.metragem > 0)

  const totalFaturamento = metricsPerVendedor.reduce((s, v) => s + v.faturamento, 0)
  const totalLucroBruto = metricsPerVendedor.reduce((s, v) => s + v.lucro_bruto, 0)

  // Lucro líquido: fetched from financeiro (admin only)
  let lucroLiquido = totalLucroBruto
  if (profile?.role === 'admin') {
    const { data: despesas } = await supabase.from('financeiro')
      .select('valor').eq('mes', mes).eq('ano', ano)
    const totalDespesas = (despesas ?? []).reduce((s: number, d: any) => s + d.valor, 0)
    lucroLiquido = totalLucroBruto - totalDespesas
  }

  const maxMeta = m.length ? Math.max(...m.map(mt => mt.lucro_max)) : 1
  const percentualMeta = maxMeta > 0 ? totalLucroBruto / maxMeta : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <span className="text-sm text-muted-foreground">
          {String(mes).padStart(2,'0')}/{ano}
        </span>
      </div>
      <MetricsCards
        faturamento={totalFaturamento}
        lucroBruto={totalLucroBruto}
        lucroLiquido={lucroLiquido}
        percentualMeta={percentualMeta}
      />
      <div className="rounded-lg border p-4">
        <h2 className="text-lg font-semibold mb-4">Faturamento por Vendedor</h2>
        <VendedoresChart data={metricsPerVendedor} />
      </div>
      <div className="rounded-lg border p-4">
        <h2 className="text-lg font-semibold mb-4">Ranking de Vendedores</h2>
        <RankingTable data={metricsPerVendedor} />
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Verify dashboard loads with data after migration (Task 13)**

- [ ] **Step 6: Commit**

```bash
git add app/ components/dashboard/
git commit -m "feat: dashboard with metrics cards, chart, and ranking table"
```

---

### Task 6: Clientes

**Files:**
- Modify: `app/(protected)/clientes/page.tsx`
- Create: `components/clientes/clientes-table.tsx`
- Create: `components/clientes/cliente-form.tsx`

**Interfaces:**
- Consumes: `Cliente` type
- Produces: `ClienteForm` component (reused in carregamento autocomplete)

- [ ] **Step 1: Create `components/clientes/cliente-form.tsx`**

```typescript
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import type { Cliente } from '@/lib/types'

interface ClienteFormProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  initial?: Partial<Cliente>
}

export function ClienteForm({ open, onClose, onSaved, initial }: ClienteFormProps) {
  const [nome, setNome] = useState(initial?.nome ?? '')
  const [cidade, setCidade] = useState(initial?.cidade ?? '')
  const [estado, setEstado] = useState(initial?.estado ?? '')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleSave() {
    setLoading(true)
    if (initial?.id) {
      await supabase.from('clientes').update({ nome, cidade, estado }).eq('id', initial.id)
    } else {
      await supabase.from('clientes').insert({ nome, cidade, estado })
    }
    setLoading(false)
    onSaved()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial?.id ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2"><Label>Nome</Label><Input value={nome} onChange={e => setNome(e.target.value)} /></div>
          <div className="space-y-2"><Label>Cidade</Label><Input value={cidade} onChange={e => setCidade(e.target.value)} /></div>
          <div className="space-y-2"><Label>Estado (UF)</Label><Input value={estado} onChange={e => setEstado(e.target.value)} maxLength={2} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={loading || !nome}>
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: Create `components/clientes/clientes-table.tsx`**

```typescript
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ClienteForm } from './cliente-form'
import type { Cliente } from '@/lib/types'
import { Pencil, Trash2, Plus } from 'lucide-react'

export function ClientesTable({ initial }: { initial: Cliente[] }) {
  const [clientes, setClientes] = useState(initial)
  const [busca, setBusca] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Partial<Cliente> | undefined>()
  const supabase = createClient()

  async function refresh() {
    const { data } = await supabase.from('clientes').select('*').order('nome')
    setClientes(data ?? [])
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir cliente?')) return
    await supabase.from('clientes').delete().eq('id', id)
    refresh()
  }

  const filtered = clientes.filter(c =>
    c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    c.cidade.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input placeholder="Buscar por nome ou cidade..." value={busca}
          onChange={e => setBusca(e.target.value)} className="max-w-sm" />
        <Button onClick={() => { setEditing(undefined); setFormOpen(true) }} className="ml-auto">
          <Plus className="h-4 w-4 mr-2" /> Novo Cliente
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Cidade</TableHead>
            <TableHead>UF</TableHead>
            <TableHead className="w-24"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 && (
            <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Nenhum cliente encontrado</TableCell></TableRow>
          )}
          {filtered.map(c => (
            <TableRow key={c.id}>
              <TableCell className="font-medium">{c.nome}</TableCell>
              <TableCell>{c.cidade}</TableCell>
              <TableCell>{c.estado}</TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => { setEditing(c); setFormOpen(true) }}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <ClienteForm open={formOpen} onClose={() => setFormOpen(false)}
        onSaved={refresh} initial={editing} />
    </div>
  )
}
```

- [ ] **Step 3: Implement `app/(protected)/clientes/page.tsx`**

```typescript
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { ClientesTable } from '@/components/clientes/clientes-table'

export default async function ClientesPage() {
  const supabase = createServerSupabaseClient()
  const { data: clientes } = await supabase.from('clientes').select('*').order('nome')
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Clientes</h1>
      <ClientesTable initial={clientes ?? []} />
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add app/ components/clientes/
git commit -m "feat: clientes page with search, create, edit, delete"
```

---

### Task 7: Carregamentos — Table + Form

**Files:**
- Modify: `app/(protected)/carregamentos/page.tsx`
- Create: `components/carregamentos/carregamentos-table.tsx`
- Create: `components/carregamentos/carregamento-form.tsx`

**Interfaces:**
- Consumes: `Carregamento`, `Cliente`, `Profile` types; `calcFaturamento()`, `calcLucroBruto()`
- Produces: Carregamentos table + form used by calendar task

- [ ] **Step 1: Create `components/carregamentos/carregamento-form.tsx`**

```typescript
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import type { Carregamento, Cliente, Profile, StatusCarregamento } from '@/lib/types'

interface CarregamentoFormProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  clientes: Cliente[]
  vendedores: Profile[]
  currentUserId: string
  currentRole: string
  initial?: Partial<Carregamento>
}

const empty = {
  data: '', data_entrega: '', status: 'agendado' as StatusCarregamento,
  cliente_id: '', produto: 'ESMERALDA', quantidade: 0, nf: '',
  motorista: '', fornecedor: '', custo_total: 0, preco_m2: 0,
  frete: 0, ad_servico: 0, custo_servico: 0, vendedor_id: '',
}

export function CarregamentoForm({ open, onClose, onSaved, clientes, vendedores, currentUserId, currentRole, initial }: CarregamentoFormProps) {
  const [form, setForm] = useState({ ...empty, vendedor_id: currentUserId, ...initial })
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  function set(field: string, value: string | number) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSave() {
    setLoading(true)
    const payload = {
      ...form,
      quantidade: Number(form.quantidade),
      custo_total: Number(form.custo_total),
      preco_m2: Number(form.preco_m2),
      frete: Number(form.frete),
      ad_servico: Number(form.ad_servico),
      custo_servico: Number(form.custo_servico),
      data_entrega: form.data_entrega || null,
    }
    if (initial?.id) {
      await supabase.from('carregamentos').update(payload).eq('id', initial.id)
    } else {
      await supabase.from('carregamentos').insert(payload)
    }
    setLoading(false)
    onSaved()
    onClose()
  }

  const numField = (label: string, field: string) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input type="number" step="0.01" value={(form as any)[field]}
        onChange={e => set(field, e.target.value)} />
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial?.id ? 'Editar Carregamento' : 'Novo Carregamento'}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Data</Label><Input type="date" value={form.data} onChange={e => set('data', e.target.value)} /></div>
          <div className="space-y-2"><Label>Data Entrega</Label><Input type="date" value={form.data_entrega ?? ''} onChange={e => set('data_entrega', e.target.value)} /></div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={v => set('status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="agendado">Agendado</SelectItem>
                <SelectItem value="realizado">Realizado</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Cliente</Label>
            <Select value={form.cliente_id} onValueChange={v => set('cliente_id', v)}>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                {clientes.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>Produto</Label><Input value={form.produto} onChange={e => set('produto', e.target.value)} /></div>
          <div className="space-y-2"><Label>Quantidade (m²)</Label><Input type="number" value={form.quantidade} onChange={e => set('quantidade', e.target.value)} /></div>
          <div className="space-y-2"><Label>NF</Label><Input value={form.nf} onChange={e => set('nf', e.target.value)} /></div>
          <div className="space-y-2"><Label>Motorista</Label><Input value={form.motorista} onChange={e => set('motorista', e.target.value)} /></div>
          <div className="space-y-2"><Label>Fornecedor</Label><Input value={form.fornecedor} onChange={e => set('fornecedor', e.target.value)} /></div>
          {currentRole === 'admin' && (
            <div className="space-y-2">
              <Label>Vendedor</Label>
              <Select value={form.vendedor_id} onValueChange={v => set('vendedor_id', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {vendedores.map(v => <SelectItem key={v.id} value={v.id}>{v.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          {numField('Custo Total (R$)', 'custo_total')}
          {numField('Preço m² (R$)', 'preco_m2')}
          {numField('Frete (R$)', 'frete')}
          {numField('Ad. Serviço (R$)', 'ad_servico')}
          {numField('Custo Serviço (R$)', 'custo_servico')}
        </div>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={loading || !form.data || !form.cliente_id}>
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: Create `components/carregamentos/carregamentos-table.tsx`**

```typescript
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { CarregamentoForm } from './carregamento-form'
import type { Carregamento, Cliente, Profile } from '@/lib/types'
import { calcFaturamento, calcLucroBruto } from '@/lib/formulas'
import { Pencil, Trash2, Plus, Download } from 'lucide-react'
import * as XLSX from 'xlsx'

const statusColor: Record<string, string> = {
  agendado: 'bg-blue-100 text-blue-800',
  realizado: 'bg-green-100 text-green-800',
  cancelado: 'bg-red-100 text-red-800',
}

interface Props {
  initial: Carregamento[]
  clientes: Cliente[]
  vendedores: Profile[]
  currentUserId: string
  currentRole: string
}

export function CarregamentosTable({ initial, clientes, vendedores, currentUserId, currentRole }: Props) {
  const [rows, setRows] = useState(initial)
  const [busca, setBusca] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Partial<Carregamento> | undefined>()
  const supabase = createClient()

  async function refresh() {
    let q = supabase.from('carregamentos').select('*, clientes(nome, cidade), profiles(nome)').order('data', { ascending: false })
    const { data } = await q
    setRows(data ?? [])
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir carregamento?')) return
    await supabase.from('carregamentos').delete().eq('id', id)
    refresh()
  }

  function handleExport() {
    const data = filtered.map(r => ({
      Data: r.data,
      'Data Entrega': r.data_entrega ?? '',
      Status: r.status,
      Cliente: r.clientes?.nome ?? '',
      Produto: r.produto,
      'Qtd (m²)': r.quantidade,
      NF: r.nf,
      Motorista: r.motorista,
      Fornecedor: r.fornecedor,
      Vendedor: r.profiles?.nome ?? '',
      'Faturamento (R$)': calcFaturamento(r),
      'Lucro Bruto (R$)': calcLucroBruto(r),
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Carregamentos')
    XLSX.writeFile(wb, 'carregamentos.xlsx')
  }

  const filtered = rows.filter(r =>
    r.clientes?.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    r.nf.toLowerCase().includes(busca.toLowerCase()) ||
    r.motorista.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input placeholder="Buscar por cliente, NF, motorista..." value={busca}
          onChange={e => setBusca(e.target.value)} className="max-w-xs" />
        <Button variant="outline" onClick={handleExport}><Download className="h-4 w-4 mr-2" />Exportar</Button>
        <Button onClick={() => { setEditing(undefined); setFormOpen(true) }} className="ml-auto">
          <Plus className="h-4 w-4 mr-2" /> Novo Carregamento
        </Button>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Entrega</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Produto</TableHead>
              <TableHead className="text-right">m²</TableHead>
              <TableHead>NF</TableHead>
              <TableHead>Vendedor</TableHead>
              <TableHead className="text-right">Faturamento</TableHead>
              <TableHead className="text-right">Lucro Bruto</TableHead>
              <TableHead className="w-20"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={11} className="text-center text-muted-foreground">Nenhum carregamento encontrado</TableCell></TableRow>
            )}
            {filtered.map(r => (
              <TableRow key={r.id}>
                <TableCell>{r.data}</TableCell>
                <TableCell>{r.data_entrega ?? '—'}</TableCell>
                <TableCell>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[r.status]}`}>
                    {r.status}
                  </span>
                </TableCell>
                <TableCell>{r.clientes?.nome}</TableCell>
                <TableCell>{r.produto}</TableCell>
                <TableCell className="text-right">{r.quantidade.toLocaleString('pt-BR')}</TableCell>
                <TableCell>{r.nf}</TableCell>
                <TableCell>{r.profiles?.nome?.split(' ')[0]}</TableCell>
                <TableCell className="text-right">
                  {calcFaturamento(r).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </TableCell>
                <TableCell className="text-right">
                  {calcLucroBruto(r).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => { setEditing(r); setFormOpen(true) }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(r.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <CarregamentoForm open={formOpen} onClose={() => setFormOpen(false)}
        onSaved={refresh} clientes={clientes} vendedores={vendedores}
        currentUserId={currentUserId} currentRole={currentRole} initial={editing} />
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add components/carregamentos/
git commit -m "feat: carregamentos table with CRUD, export, and filters"
```

---

### Task 8: Carregamentos — Calendar + Page Assembly

**Files:**
- Create: `components/carregamentos/agenda-calendar.tsx`
- Modify: `app/(protected)/carregamentos/page.tsx`

**Interfaces:**
- Consumes: `Carregamento` with `data_entrega` and `status`
- Produces: Calendar view with color-coded events

- [ ] **Step 1: Create `components/carregamentos/agenda-calendar.tsx`**

```typescript
'use client'

import { useState } from 'react'
import { addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval,
  format, isSameDay, isToday, getDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Carregamento } from '@/lib/types'

const statusStyle: Record<string, string> = {
  agendado: 'bg-blue-500 text-white',
  realizado: 'bg-green-500 text-white',
  cancelado: 'bg-red-400 text-white line-through',
}

export function AgendaCalendar({ carregamentos }: { carregamentos: Carregamento[] }) {
  const [current, setCurrent] = useState(new Date())

  const days = eachDayOfInterval({
    start: startOfMonth(current),
    end: endOfMonth(current),
  })

  // Pad start of month
  const startPad = getDay(startOfMonth(current))
  const paddedDays = Array(startPad).fill(null).concat(days)

  function getEvents(day: Date) {
    return carregamentos.filter(c =>
      c.data_entrega && isSameDay(new Date(c.data_entrega + 'T00:00:00'), day)
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold capitalize">
          {format(current, 'MMMM yyyy', { locale: ptBR })}
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => setCurrent(subMonths(current, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrent(new Date())}>Hoje</Button>
          <Button variant="outline" size="icon" onClick={() => setCurrent(addMonths(current, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
        {['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(d => (
          <div key={d} className="bg-muted text-center text-xs font-medium py-2">{d}</div>
        ))}
        {paddedDays.map((day, i) => {
          if (!day) return <div key={`pad-${i}`} className="bg-background min-h-20" />
          const events = getEvents(day)
          return (
            <div key={day.toISOString()}
              className={`bg-background min-h-20 p-1 ${isToday(day) ? 'ring-2 ring-primary ring-inset' : ''}`}>
              <span className={`text-xs font-medium ${isToday(day) ? 'text-primary' : 'text-muted-foreground'}`}>
                {format(day, 'd')}
              </span>
              <div className="mt-1 space-y-0.5">
                {events.map(e => (
                  <div key={e.id}
                    className={`text-xs px-1 py-0.5 rounded truncate ${statusStyle[e.status]}`}
                    title={`${e.clientes?.nome ?? ''} — ${e.quantidade}m² — ${e.status}`}>
                    {e.clientes?.nome?.split(' ')[0] ?? e.produto} {e.quantidade}m²
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex gap-4 text-xs">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-500 inline-block" /> Agendado</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500 inline-block" /> Realizado</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-400 inline-block" /> Cancelado</span>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Implement `app/(protected)/carregamentos/page.tsx`**

```typescript
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { CarregamentosTable } from '@/components/carregamentos/carregamentos-table'
import { AgendaCalendar } from '@/components/carregamentos/agenda-calendar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Carregamento, Cliente, Profile } from '@/lib/types'

export default async function CarregamentosPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single()

  let q = supabase.from('carregamentos')
    .select('*, clientes(nome, cidade), profiles(nome)')
    .order('data', { ascending: false })

  if (profile?.role === 'vendedor') {
    q = q.eq('vendedor_id', user!.id)
  }

  const [{ data: carregamentos }, { data: clientes }, { data: vendedores }] = await Promise.all([
    q,
    supabase.from('clientes').select('*').order('nome'),
    supabase.from('profiles').select('id, nome, role, ativo, criado_em').eq('ativo', true),
  ])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Carregamentos</h1>
      <Tabs defaultValue="tabela">
        <TabsList>
          <TabsTrigger value="tabela">Tabela</TabsTrigger>
          <TabsTrigger value="agenda">Agenda</TabsTrigger>
        </TabsList>
        <TabsContent value="tabela" className="mt-4">
          <CarregamentosTable
            initial={(carregamentos ?? []) as Carregamento[]}
            clientes={(clientes ?? []) as Cliente[]}
            vendedores={(vendedores ?? []) as Profile[]}
            currentUserId={user!.id}
            currentRole={profile?.role ?? 'vendedor'}
          />
        </TabsContent>
        <TabsContent value="agenda" className="mt-4">
          <AgendaCalendar carregamentos={(carregamentos ?? []) as Carregamento[]} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add app/ components/carregamentos/
git commit -m "feat: carregamentos page with table tab and agenda calendar"
```

---

### Task 9: Financeiro

**Files:**
- Modify: `app/(protected)/financeiro/page.tsx`
- Create: `components/financeiro/financeiro-summary.tsx`
- Create: `components/financeiro/financeiro-table.tsx`
- Create: `components/financeiro/financeiro-form.tsx`

**Interfaces:**
- Consumes: `Financeiro`, `TipoFinanceiro` types
- Produces: Admin-only financial panel

- [ ] **Step 1: Create `components/financeiro/financeiro-form.tsx`**

```typescript
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import type { Financeiro, TipoFinanceiro, CategoriaFinanceiro } from '@/lib/types'

const tipos: { value: TipoFinanceiro; label: string; categoria: CategoriaFinanceiro }[] = [
  { value: 'salario', label: 'Salário', categoria: 'fixa' },
  { value: 'comissao', label: 'Comissão', categoria: 'variavel' },
  { value: 'imposto', label: 'Imposto (DAS/DARF)', categoria: 'variavel' },
  { value: 'compra_grama', label: 'Compra de Grama', categoria: 'variavel' },
  { value: 'frete', label: 'Frete', categoria: 'variavel' },
  { value: 'plantio', label: 'Plantio', categoria: 'variavel' },
  { value: 'outros_fixo', label: 'Outros (Fixo)', categoria: 'fixa' },
  { value: 'outros_variavel', label: 'Outros (Variável)', categoria: 'variavel' },
]

interface Props {
  open: boolean; onClose: () => void; onSaved: () => void
  mes: number; ano: number; initial?: Partial<Financeiro>
}

export function FinanceiroForm({ open, onClose, onSaved, mes, ano, initial }: Props) {
  const [tipo, setTipo] = useState<TipoFinanceiro>(initial?.tipo ?? 'outros_variavel')
  const [descricao, setDescricao] = useState(initial?.descricao ?? '')
  const [valor, setValor] = useState(String(initial?.valor ?? ''))
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const tipoObj = tipos.find(t => t.value === tipo)!

  async function handleSave() {
    setLoading(true)
    const payload = { mes, ano, tipo, categoria: tipoObj.categoria, descricao, valor: Number(valor) }
    if (initial?.id) {
      await supabase.from('financeiro').update(payload).eq('id', initial.id)
    } else {
      await supabase.from('financeiro').insert(payload)
    }
    setLoading(false)
    onSaved()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>{initial?.id ? 'Editar Lançamento' : 'Novo Lançamento'}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select value={tipo} onValueChange={v => setTipo(v as TipoFinanceiro)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {tipos.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>Descrição</Label><Input value={descricao} onChange={e => setDescricao(e.target.value)} /></div>
          <div className="space-y-2"><Label>Valor (R$)</Label><Input type="number" step="0.01" value={valor} onChange={e => setValor(e.target.value)} /></div>
          <p className="text-xs text-muted-foreground">Categoria: {tipoObj.categoria}</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={loading || !valor}>{loading ? 'Salvando...' : 'Salvar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: Create `components/financeiro/financeiro-summary.tsx`**

```typescript
import type { Financeiro } from '@/lib/types'

function fmt(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const tipoLabel: Record<string, string> = {
  salario: 'Salários', comissao: 'Comissões', imposto: 'Impostos',
  compra_grama: 'Compra de Grama', frete: 'Frete', plantio: 'Plantio',
  outros_fixo: 'Outros Fixo', outros_variavel: 'Outros Variável',
}

export function FinanceiroSummary({ lancamentos, faturamento }: { lancamentos: Financeiro[]; faturamento: number }) {
  const byTipo = lancamentos.reduce((acc, l) => {
    acc[l.tipo] = (acc[l.tipo] ?? 0) + l.valor
    return acc
  }, {} as Record<string, number>)

  const totalDespesas = Object.values(byTipo).reduce((s, v) => s + v, 0)
  const lucroLiquido = faturamento - totalDespesas

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="rounded-lg border p-4 space-y-2">
        <h3 className="font-semibold">Despesas por Categoria</h3>
        {Object.entries(byTipo).map(([tipo, valor]) => (
          <div key={tipo} className="flex justify-between text-sm">
            <span>{tipoLabel[tipo] ?? tipo}</span>
            <span>{fmt(valor)}</span>
          </div>
        ))}
        <div className="border-t pt-2 flex justify-between font-semibold">
          <span>Total Despesas</span><span>{fmt(totalDespesas)}</span>
        </div>
      </div>
      <div className="rounded-lg border p-4 space-y-3">
        <h3 className="font-semibold">Resultado</h3>
        <div className="flex justify-between text-sm"><span>Faturamento Bruto</span><span>{fmt(faturamento)}</span></div>
        <div className="flex justify-between text-sm text-red-600"><span>(-) Total Despesas</span><span>({fmt(totalDespesas)})</span></div>
        <div className="border-t pt-2 flex justify-between font-bold text-lg">
          <span>Lucro Líquido</span>
          <span className={lucroLiquido >= 0 ? 'text-green-700' : 'text-red-700'}>{fmt(lucroLiquido)}</span>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create `components/financeiro/financeiro-table.tsx`**

```typescript
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { FinanceiroForm } from './financeiro-form'
import type { Financeiro } from '@/lib/types'
import { Pencil, Trash2, Plus } from 'lucide-react'

const tipoLabel: Record<string, string> = {
  salario: 'Salário', comissao: 'Comissão', imposto: 'Imposto',
  compra_grama: 'Compra de Grama', frete: 'Frete', plantio: 'Plantio',
  outros_fixo: 'Outros Fixo', outros_variavel: 'Outros Variável',
}

interface Props { initial: Financeiro[]; mes: number; ano: number }

export function FinanceiroTable({ initial, mes, ano }: Props) {
  const [rows, setRows] = useState(initial)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Partial<Financeiro> | undefined>()
  const supabase = createClient()

  async function refresh() {
    const { data } = await supabase.from('financeiro').select('*').eq('mes', mes).eq('ano', ano).order('tipo')
    setRows(data ?? [])
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir lançamento?')) return
    await supabase.from('financeiro').delete().eq('id', id)
    refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => { setEditing(undefined); setFormOpen(true) }}>
          <Plus className="h-4 w-4 mr-2" /> Novo Lançamento
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tipo</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead className="text-right">Valor</TableHead>
            <TableHead className="w-20"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 && (
            <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Nenhum lançamento neste período</TableCell></TableRow>
          )}
          {rows.map(r => (
            <TableRow key={r.id}>
              <TableCell>{tipoLabel[r.tipo] ?? r.tipo}</TableCell>
              <TableCell className="capitalize">{r.categoria}</TableCell>
              <TableCell>{r.descricao}</TableCell>
              <TableCell className="text-right">
                {r.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => { setEditing(r); setFormOpen(true) }}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(r.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <FinanceiroForm open={formOpen} onClose={() => setFormOpen(false)}
        onSaved={refresh} mes={mes} ano={ano} initial={editing} />
    </div>
  )
}
```

- [ ] **Step 4: Implement `app/(protected)/financeiro/page.tsx`**

```typescript
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { FinanceiroSummary } from '@/components/financeiro/financeiro-summary'
import { FinanceiroTable } from '@/components/financeiro/financeiro-table'
import { calcFaturamento } from '@/lib/formulas'
import type { Carregamento } from '@/lib/types'

interface SearchParams { mes?: string; ano?: string }

export default async function FinanceiroPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = createServerSupabaseClient()
  const now = new Date()
  const mes = parseInt(searchParams.mes ?? String(now.getMonth() + 1))
  const ano = parseInt(searchParams.ano ?? String(now.getFullYear()))

  const startDate = `${ano}-${String(mes).padStart(2,'0')}-01`
  const endDate = `${ano}-${String(mes).padStart(2,'0')}-31`

  const [{ data: lancamentos }, { data: carregamentos }] = await Promise.all([
    supabase.from('financeiro').select('*').eq('mes', mes).eq('ano', ano).order('tipo'),
    supabase.from('carregamentos').select('preco_m2, quantidade').gte('data', startDate).lte('data', endDate),
  ])

  const faturamento = ((carregamentos ?? []) as Carregamento[])
    .reduce((s, c) => s + calcFaturamento(c), 0)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Financeiro — {String(mes).padStart(2,'0')}/{ano}</h1>
      <FinanceiroSummary lancamentos={lancamentos ?? []} faturamento={faturamento} />
      <div className="rounded-lg border p-4">
        <h2 className="text-lg font-semibold mb-4">Lançamentos</h2>
        <FinanceiroTable initial={lancamentos ?? []} mes={mes} ano={ano} />
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add app/ components/financeiro/
git commit -m "feat: financeiro page with summary, result and lancamentos CRUD"
```

---

### Task 10: Metas

**Files:**
- Modify: `app/(protected)/metas/page.tsx`
- Create: `components/metas/metas-table.tsx`
- Create: `components/metas/meta-form.tsx`

- [ ] **Step 1: Create `components/metas/meta-form.tsx`**

```typescript
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import type { Meta } from '@/lib/types'

interface Props { open: boolean; onClose: () => void; onSaved: () => void; mes: number; ano: number; initial?: Partial<Meta> }

export function MetaForm({ open, onClose, onSaved, mes, ano, initial }: Props) {
  const [nivel, setNivel] = useState(initial?.nivel ?? '')
  const [lucroMin, setLucroMin] = useState(String(initial?.lucro_min ?? ''))
  const [lucroMax, setLucroMax] = useState(String(initial?.lucro_max ?? ''))
  const [perc, setPerc] = useState(String((initial?.percentual_comissao ?? 0) * 100))
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleSave() {
    setLoading(true)
    const payload = { mes, ano, nivel, lucro_min: Number(lucroMin), lucro_max: Number(lucroMax), percentual_comissao: Number(perc) / 100 }
    if (initial?.id) {
      await supabase.from('metas').update(payload).eq('id', initial.id)
    } else {
      await supabase.from('metas').insert(payload)
    }
    setLoading(false)
    onSaved()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>{initial?.id ? 'Editar Meta' : 'Nova Meta'}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2"><Label>Nível</Label><Input value={nivel} onChange={e => setNivel(e.target.value)} placeholder="Ex: Meta 1" /></div>
          <div className="space-y-2"><Label>Lucro Mínimo (R$)</Label><Input type="number" value={lucroMin} onChange={e => setLucroMin(e.target.value)} /></div>
          <div className="space-y-2"><Label>Lucro Máximo (R$)</Label><Input type="number" value={lucroMax} onChange={e => setLucroMax(e.target.value)} /></div>
          <div className="space-y-2"><Label>Comissão (%)</Label><Input type="number" step="0.1" value={perc} onChange={e => setPerc(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={loading || !nivel}>{loading ? 'Salvando...' : 'Salvar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: Create `components/metas/metas-table.tsx`**

```typescript
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { MetaForm } from './meta-form'
import type { Meta } from '@/lib/types'
import { Pencil, Trash2, Plus } from 'lucide-react'

interface Props { initial: Meta[]; mes: number; ano: number }

export function MetasTable({ initial, mes, ano }: Props) {
  const [rows, setRows] = useState(initial)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Partial<Meta> | undefined>()
  const supabase = createClient()

  async function refresh() {
    const { data } = await supabase.from('metas').select('*').eq('mes', mes).eq('ano', ano).order('lucro_min')
    setRows(data ?? [])
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir meta?')) return
    await supabase.from('metas').delete().eq('id', id)
    refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => { setEditing(undefined); setFormOpen(true) }}>
          <Plus className="h-4 w-4 mr-2" /> Nova Meta
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nível</TableHead>
            <TableHead className="text-right">Lucro Mín.</TableHead>
            <TableHead className="text-right">Lucro Máx.</TableHead>
            <TableHead className="text-right">Comissão</TableHead>
            <TableHead className="w-20"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(r => (
            <TableRow key={r.id}>
              <TableCell className="font-medium">{r.nivel}</TableCell>
              <TableCell className="text-right">{r.lucro_min.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
              <TableCell className="text-right">{r.lucro_max.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
              <TableCell className="text-right">{(r.percentual_comissao * 100).toFixed(1)}%</TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => { setEditing(r); setFormOpen(true) }}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(r.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <MetaForm open={formOpen} onClose={() => setFormOpen(false)} onSaved={refresh} mes={mes} ano={ano} initial={editing} />
    </div>
  )
}
```

- [ ] **Step 3: Implement `app/(protected)/metas/page.tsx`**

```typescript
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { MetasTable } from '@/components/metas/metas-table'

interface SearchParams { mes?: string; ano?: string }

export default async function MetasPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = createServerSupabaseClient()
  const now = new Date()
  const mes = parseInt(searchParams.mes ?? String(now.getMonth() + 1))
  const ano = parseInt(searchParams.ano ?? String(now.getFullYear()))
  const { data: metas } = await supabase.from('metas').select('*').eq('mes', mes).eq('ano', ano).order('lucro_min')
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Metas — {String(mes).padStart(2,'0')}/{ano}</h1>
      <MetasTable initial={metas ?? []} mes={mes} ano={ano} />
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add app/ components/metas/
git commit -m "feat: metas page with commission tiers CRUD"
```

---

### Task 11: Usuários + Route Handler

**Files:**
- Modify: `app/(protected)/usuarios/page.tsx`
- Create: `components/usuarios/usuarios-table.tsx`
- Create: `components/usuarios/usuario-form.tsx`
- Create: `app/api/usuarios/route.ts`

- [ ] **Step 1: Create `app/api/usuarios/route.ts`**

```typescript
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const { email, nome, role } = await request.json()
  if (!email || !nome || !role) return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })

  const { data: authUser, error } = await adminClient.auth.admin.createUser({
    email,
    password: Math.random().toString(36).slice(-10) + 'A1!',
    email_confirm: true,
    user_metadata: { nome },
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  await adminClient.from('profiles').update({ nome, role }).eq('id', authUser.user.id)

  return NextResponse.json({ id: authUser.user.id })
}

export async function PATCH(request: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const { id, role, ativo } = await request.json()
  await adminClient.from('profiles').update({ role, ativo }).eq('id', id)

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Create `components/usuarios/usuario-form.tsx`**

```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import type { Role } from '@/lib/types'

interface Props { open: boolean; onClose: () => void; onSaved: () => void }

export function UsuarioForm({ open, onClose, onSaved }: Props) {
  const [email, setEmail] = useState('')
  const [nome, setNome] = useState('')
  const [role, setRole] = useState<Role>('vendedor')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  async function handleSave() {
    setLoading(true)
    setErro('')
    const res = await fetch('/api/usuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, nome, role }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setErro(data.error); return }
    onSaved()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>Novo Usuário</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2"><Label>Nome</Label><Input value={nome} onChange={e => setNome(e.target.value)} /></div>
          <div className="space-y-2"><Label>Email</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
          <div className="space-y-2">
            <Label>Perfil</Label>
            <Select value={role} onValueChange={v => setRole(v as Role)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="vendedor">Vendedor</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {erro && <p className="text-sm text-red-600">{erro}</p>}
          <p className="text-xs text-muted-foreground">Uma senha temporária será gerada. O usuário pode alterá-la pelo link de redefinição.</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={loading || !email || !nome}>{loading ? 'Criando...' : 'Criar Usuário'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 3: Create `components/usuarios/usuarios-table.tsx`**

```typescript
'use client'

import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { UsuarioForm } from './usuario-form'
import type { Profile } from '@/lib/types'
import { Plus } from 'lucide-react'

export function UsuariosTable({ initial }: { initial: Profile[] }) {
  const [usuarios, setUsuarios] = useState(initial)
  const [formOpen, setFormOpen] = useState(false)

  async function refresh() {
    const res = await fetch('/api/usuarios')
    // Re-fetch via page reload for simplicity
    window.location.reload()
  }

  async function toggleAtivo(u: Profile) {
    await fetch('/api/usuarios', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: u.id, role: u.role, ativo: !u.ativo }),
    })
    setUsuarios(prev => prev.map(p => p.id === u.id ? { ...p, ativo: !p.ativo } : p))
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setFormOpen(true)}><Plus className="h-4 w-4 mr-2" /> Novo Usuário</Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Perfil</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-32"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {usuarios.map(u => (
            <TableRow key={u.id}>
              <TableCell className="font-medium">{u.nome}</TableCell>
              <TableCell><Badge variant="outline">{u.role}</Badge></TableCell>
              <TableCell>
                <Badge variant={u.ativo ? 'default' : 'secondary'}>{u.ativo ? 'Ativo' : 'Inativo'}</Badge>
              </TableCell>
              <TableCell>
                <Button variant="outline" size="sm" onClick={() => toggleAtivo(u)}>
                  {u.ativo ? 'Desativar' : 'Ativar'}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <UsuarioForm open={formOpen} onClose={() => setFormOpen(false)} onSaved={refresh} />
    </div>
  )
}
```

- [ ] **Step 4: Implement `app/(protected)/usuarios/page.tsx`**

```typescript
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { UsuariosTable } from '@/components/usuarios/usuarios-table'
import type { Profile } from '@/lib/types'

export default async function UsuariosPage() {
  const supabase = createServerSupabaseClient()
  const { data: usuarios } = await supabase
    .from('profiles')
    .select('id, nome, role, ativo, criado_em')
    .order('nome')

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Usuários</h1>
      <UsuariosTable initial={(usuarios ?? []) as Profile[]} />
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add app/ components/usuarios/
git commit -m "feat: usuarios page with create via Admin API, activate/deactivate"
```

---

### Task 12: Migration Script

**Files:**
- Create: `scripts/migrate_excel.py`

**Interfaces:**
- Consumes: `06 JUNHO 2026.xlsx` Excel file
- Produces: Populated Supabase database with June 2026 data

- [ ] **Step 1: Install Python dependencies**

```bash
pip install openpyxl requests python-dotenv
```

- [ ] **Step 2: Create `scripts/migrate_excel.py`**

```python
import os
import json
import openpyxl
import requests
from datetime import datetime
from dotenv import load_dotenv

load_dotenv('../.env.local')

SUPABASE_URL = os.environ['NEXT_PUBLIC_SUPABASE_URL']
SERVICE_KEY = os.environ['SUPABASE_SERVICE_ROLE_KEY']
EXCEL_PATH = r"C:\Users\Rafael Concianci\OneDrive\Desktop\RARCC GRAMAS\04 VENDA\06 JUNHO 2026.xlsx"

HEADERS = {
    'apikey': SERVICE_KEY,
    'Authorization': f'Bearer {SERVICE_KEY}',
    'Content-Type': 'application/json',
    'Prefer': 'resolution=merge-duplicates',
}

def upsert(table, data, on_conflict):
    url = f"{SUPABASE_URL}/rest/v1/{table}?on_conflict={on_conflict}"
    r = requests.post(url, headers=HEADERS, data=json.dumps(data))
    if r.status_code not in (200, 201):
        print(f"  ERROR {table}: {r.status_code} {r.text[:200]}")
    return r

def get_or_create_user(email, nome, role):
    # Check if user exists
    r = requests.get(f"{SUPABASE_URL}/auth/v1/admin/users", headers=HEADERS)
    users = r.json().get('users', [])
    for u in users:
        if u['email'] == email:
            print(f"  User exists: {email}")
            upsert('profiles', [{'id': u['id'], 'nome': nome, 'role': role}], 'id')
            return u['id']
    # Create user
    payload = {'email': email, 'password': 'TrocarSenha123!', 'email_confirm': True, 'user_metadata': {'nome': nome}}
    r = requests.post(f"{SUPABASE_URL}/auth/v1/admin/users", headers=HEADERS, data=json.dumps(payload))
    user_id = r.json()['id']
    upsert('profiles', [{'id': user_id, 'nome': nome, 'role': role}], 'id')
    print(f"  Created user: {email} ({role})")
    return user_id

def xl_date(val):
    if val is None:
        return None
    if isinstance(val, datetime):
        return val.strftime('%Y-%m-%d')
    if isinstance(val, (int, float)):
        from datetime import date
        d = date(1899, 12, 30)
        from datetime import timedelta
        return (d + timedelta(days=int(val))).strftime('%Y-%m-%d')
    return str(val)

def safe_float(v, default=0.0):
    try: return float(v or 0)
    except: return default

def safe_int(v, default=0):
    try: return int(float(v or 0))
    except: return default

wb = openpyxl.load_workbook(EXCEL_PATH, data_only=True)

print("=== Creating users ===")
rafael_id = get_or_create_user('rafaelrarcc@gmail.com', 'Rafael Concianci', 'admin')
fabio_id = get_or_create_user('fabio.caiares@rarccgramas.com.br', 'Fábio Caiares', 'vendedor')

vendedor_map = {
    'RAFAEL CONCIANCI': rafael_id,
    'FABIO CAIARES': fabio_id,
    'FÁBIO CAIARES': fabio_id,
}

print("\n=== Importing ADM. VENDAS ===")
ws = wb['ADM. VENDAS']
clientes_seen = {}
carregamentos = []

for row in ws.iter_rows(min_row=5, values_only=True):
    if not row[2]:  # no client name
        continue
    nome_cliente = str(row[2]).strip()
    cidade = str(row[4]).strip() if row[4] else ''
    
    if nome_cliente and nome_cliente not in clientes_seen:
        clientes_seen[nome_cliente] = {'nome': nome_cliente, 'cidade': cidade, 'estado': 'SP'}

clientes_list = list(clientes_seen.values())
print(f"  {len(clientes_list)} clientes únicos")
upsert('clientes', clientes_list, 'nome')

# Fetch inserted cliente IDs
r = requests.get(f"{SUPABASE_URL}/rest/v1/clientes?select=id,nome", headers=HEADERS)
cliente_id_map = {c['nome']: c['id'] for c in r.json()}

data_atual = None
for row in ws.iter_rows(min_row=5, values_only=True):
    if row[0]:  # new date in col A
        data_atual = xl_date(row[0])
    
    nome_cliente = str(row[2]).strip() if row[2] else ''
    vendedor_nome = str(row[15]).upper().strip() if row[15] else ''
    
    if not nome_cliente or not data_atual or not vendedor_nome:
        continue
    if nome_cliente not in cliente_id_map:
        continue
    
    vendedor_id = vendedor_map.get(vendedor_nome)
    if not vendedor_id:
        continue
    
    nf = str(row[6]).strip() if row[6] else ''
    
    carregamentos.append({
        'data': data_atual,
        'data_entrega': data_atual,
        'status': 'realizado',
        'cliente_id': cliente_id_map[nome_cliente],
        'produto': str(row[3]).strip() if row[3] else 'ESMERALDA',
        'quantidade': safe_int(row[5]),
        'nf': nf,
        'motorista': str(row[7]).strip() if row[7] else '',
        'fornecedor': str(row[9]).strip() if row[9] else '',
        'custo_total': safe_float(row[10]),
        'preco_m2': safe_float(row[11]),
        'frete': safe_float(row[12]),
        'ad_servico': safe_float(row[13]),
        'custo_servico': safe_float(row[14]),
        'vendedor_id': vendedor_id,
    })

print(f"  {len(carregamentos)} carregamentos")
if carregamentos:
    upsert('carregamentos', carregamentos, 'nf')

print("\n=== Importing METAS ===")
metas = [
    {'mes': 6, 'ano': 2026, 'nivel': 'Base', 'lucro_min': 0, 'lucro_max': 30000, 'percentual_comissao': 0.05},
    {'mes': 6, 'ano': 2026, 'nivel': 'Meta 1', 'lucro_min': 30001, 'lucro_max': 45000, 'percentual_comissao': 0.07},
    {'mes': 6, 'ano': 2026, 'nivel': 'Meta 2', 'lucro_min': 45001, 'lucro_max': 60000, 'percentual_comissao': 0.09},
    {'mes': 6, 'ano': 2026, 'nivel': 'Meta 3', 'lucro_min': 60001, 'lucro_max': 70000, 'percentual_comissao': 0.12},
    {'mes': 6, 'ano': 2026, 'nivel': 'Super Meta', 'lucro_min': 70001, 'lucro_max': 80000, 'percentual_comissao': 0.15},
]
upsert('metas', metas, 'mes,ano,nivel')
print(f"  {len(metas)} metas")

print("\n=== Importing FINANCEIRO ===")
ws_fin = wb['FINANCEIRO']
fin_rows = list(ws_fin.iter_rows(min_row=2, values_only=True))
lancamentos = []

financeiro_map = [
    (9, 'salario', 'fixa', 'Salário Rafael'),
    (11, 'salario', 'fixa', 'Salário Fábio'),
    (13, 'outros_fixo', 'fixa', 'Google Ads'),
    (14, 'outros_fixo', 'fixa', 'Telefone'),
    (15, 'outros_fixo', 'fixa', 'Internet'),
    (16, 'outros_fixo', 'fixa', 'Vivo Rafael'),
]

for row_idx, tipo, categoria, descricao in financeiro_map:
    if row_idx <= len(fin_rows):
        row = fin_rows[row_idx - 2]
        val = safe_float(row[5] if len(row) > 5 else None)
        if val:
            lancamentos.append({'mes': 6, 'ano': 2026, 'tipo': tipo, 'categoria': categoria, 'descricao': descricao, 'valor': val})

# Fixed known values from Excel
lancamentos += [
    {'mes': 6, 'ano': 2026, 'tipo': 'compra_grama', 'categoria': 'variavel', 'descricao': 'Compra de Grama', 'valor': 222676.5},
    {'mes': 6, 'ano': 2026, 'tipo': 'frete', 'categoria': 'variavel', 'descricao': 'Frete Total', 'valor': 129650.0},
    {'mes': 6, 'ano': 2026, 'tipo': 'plantio', 'categoria': 'variavel', 'descricao': 'Plantio', 'valor': 37000.0},
    {'mes': 6, 'ano': 2026, 'tipo': 'outros_fixo', 'categoria': 'fixa', 'descricao': 'Despesa Fixa Total', 'valor': 42446.69},
]

print(f"  {len(lancamentos)} lançamentos financeiros")
if lancamentos:
    upsert('financeiro', lancamentos, 'mes,ano,tipo,descricao')

print("\n✅ Migração concluída!")
print(f"   Rafael ID: {rafael_id}")
print(f"   Fábio ID:  {fabio_id}")
print("   Senha inicial de todos os usuários: TrocarSenha123!")
```

- [ ] **Step 3: Run migration**

```bash
cd scripts
python migrate_excel.py
```

Expected output:
```
=== Creating users ===
  Created user: rafaelrarcc@gmail.com (admin)
  Created user: fabio.caiares@rarccgramas.com.br (vendedor)
=== Importing ADM. VENDAS ===
  XX clientes únicos
  XX carregamentos
=== Importing METAS ===
  5 metas
=== Importing FINANCEIRO ===
  XX lançamentos financeiros
✅ Migração concluída!
```

- [ ] **Step 4: Verify data in Supabase**

Open Supabase Dashboard → Table Editor → verify rows in `clientes`, `carregamentos`, `metas`, `financeiro`.

- [ ] **Step 5: Commit**

```bash
git add scripts/
git commit -m "feat: excel migration script with upsert strategy"
```

---

### Task 13: Deploy

**Files:**
- Create: `vercel.json` (optional)

- [ ] **Step 1: Push to GitHub**

```bash
git remote add origin https://github.com/<seu-usuario>/crm-rarcc-gramas.git
git branch -M main
git push -u origin main
```

- [ ] **Step 2: Deploy on Vercel**

1. Go to https://vercel.com → New Project → Import from GitHub
2. Select the `crm-rarcc-gramas` repo
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Click Deploy

- [ ] **Step 3: Test production**

- Log in with `rafaelrarcc@gmail.com` / `TrocarSenha123!`
- Verify dashboard shows June 2026 data
- Verify carregamentos table and calendar work
- Verify Fábio's login only shows his own carregamentos
- Verify `/financeiro` is accessible to admin, redirects vendedor

- [ ] **Step 4: Change passwords**

In Supabase → Authentication → Users → send password reset email to both users.

- [ ] **Step 5: Final commit**

```bash
git commit --allow-empty -m "chore: deployed to Vercel"
```
