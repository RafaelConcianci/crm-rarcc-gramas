# CRM Login & Dashboard — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Next.js CRM web app with login page, protected dashboard, client list, and sales pipeline kanban — all using mocked data.

**Architecture:** Next.js 14 App Router with NextAuth v5 (Credentials provider) for session-based authentication. Route protection via Next.js middleware. All data served from a single mock-data file. No database.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, NextAuth v5 (Auth.js), Jest, React Testing Library

## Global Constraints

- Node.js >= 18
- Next.js 14 (App Router only — no Pages Router)
- NextAuth v5 (`next-auth@beta`) — not v4
- Tailwind CSS for all styling — no external UI component libraries
- Colors: green `#16A34A`, white `#FFFFFF`, green hover `#22C55E`, text secondary `#6B7280`
- All text in Brazilian Portuguese
- TypeScript strict mode
- Mock credentials: email `admin@crm.com`, password `admin123`

---

## File Map

```
/
├── auth.ts                                    ← NextAuth config + validateCredentials
├── middleware.ts                              ← protects /dashboard/* routes
├── .env.local                                 ← AUTH_SECRET
├── jest.config.ts                             ← Jest + Next.js transform
├── jest.setup.ts                              ← @testing-library/jest-dom
├── app/
│   ├── layout.tsx                             ← root HTML shell
│   ├── page.tsx                               ← redirect to /login
│   ├── globals.css                            ← Tailwind directives
│   ├── login/
│   │   └── page.tsx                           ← login form (client component)
│   ├── dashboard/
│   │   ├── layout.tsx                         ← sidebar + header wrapper
│   │   ├── page.tsx                           ← redirect to /dashboard/clientes
│   │   ├── clientes/
│   │   │   └── page.tsx                       ← metric cards + client table
│   │   └── pipeline/
│   │       └── page.tsx                       ← kanban board
│   └── api/auth/[...nextauth]/
│       └── route.ts                           ← NextAuth API handler
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx                        ← green sidebar, nav links
│   │   ├── Header.tsx                         ← server component, user + logout
│   │   └── SignOutButton.tsx                  ← client component for form submit
│   ├── clientes/
│   │   ├── StatusBadge.tsx                    ← Ativo/Inativo badge
│   │   └── ClienteTable.tsx                   ← table with 10 clients
│   └── pipeline/
│       ├── KanbanCard.tsx                     ← single deal card
│       └── KanbanBoard.tsx                    ← 4-column kanban
└── lib/
    ├── types.ts                               ← Cliente, Negocio, Status types
    └── mock-data.ts                           ← 10 clients + 11 deals
```

---

## Task 1: Project Setup & Test Infrastructure

**Files:**
- Create: (root of `C:\Users\Rafael Concianci\projeto`)
- Create: `jest.config.ts`
- Create: `jest.setup.ts`

**Interfaces:**
- Produces: runnable `npm run dev` and `npm test`

- [ ] **Step 1: Initialize Next.js project**

Run in `C:\Users\Rafael Concianci\projeto`:
```powershell
npx create-next-app@latest . --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*" --yes
```
Expected output: `Success! Created your Next.js app.`

- [ ] **Step 2: Install NextAuth v5**

```powershell
npm install next-auth@beta
```
Expected: package added to `node_modules/next-auth`.

- [ ] **Step 3: Install test dependencies**

```powershell
npm install -D jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom @types/jest
```

- [ ] **Step 4: Create jest.config.ts**

```ts
import type { Config } from "jest"
import nextJest from "next/jest.js"

const createJestConfig = nextJest({ dir: "./" })

const config: Config = {
  coverageProvider: "v8",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
}

export default createJestConfig(config)
```

- [ ] **Step 5: Create jest.setup.ts**

```ts
import "@testing-library/jest-dom"
```

- [ ] **Step 6: Add test script to package.json**

Open `package.json` and add `"test": "jest"` to the `"scripts"` block:
```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "test": "jest"
}
```

- [ ] **Step 7: Verify test runner works**

```powershell
npm test -- --passWithNoTests
```
Expected: `Test Suites: 0 skipped` with exit code 0.

- [ ] **Step 8: Commit**

```powershell
git init
git add .
git commit -m "chore: initialize Next.js 14 project with NextAuth and Jest"
```

---

## Task 2: TypeScript Types & Mock Data

**Files:**
- Create: `lib/types.ts`
- Create: `lib/mock-data.ts`
- Create: `__tests__/mock-data.test.ts`

**Interfaces:**
- Produces:
  - `Cliente { id, nome, email, empresa, status, cadastro }`
  - `Negocio { id, cliente, valor, responsavel, estagio }`
  - `Status = "Ativo" | "Inativo"`
  - `Estagio = "Prospecção" | "Qualificação" | "Proposta" | "Fechado"`
  - `clientes: Cliente[]` (10 items)
  - `negocios: Negocio[]` (11 items)

- [ ] **Step 1: Write failing test**

Create `__tests__/mock-data.test.ts`:
```ts
import { clientes, negocios } from "@/lib/mock-data"

describe("mock-data", () => {
  it("exports 10 clients", () => {
    expect(clientes).toHaveLength(10)
  })

  it("all clients have required fields", () => {
    clientes.forEach((c) => {
      expect(c.id).toBeDefined()
      expect(c.nome).toBeDefined()
      expect(c.email).toBeDefined()
      expect(c.empresa).toBeDefined()
      expect(["Ativo", "Inativo"]).toContain(c.status)
      expect(c.cadastro).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
  })

  it("exports 11 deals", () => {
    expect(negocios).toHaveLength(11)
  })

  it("all deals have valid estagio", () => {
    const valid = ["Prospecção", "Qualificação", "Proposta", "Fechado"]
    negocios.forEach((n) => {
      expect(valid).toContain(n.estagio)
    })
  })
})
```

- [ ] **Step 2: Run test — expect FAIL**

```powershell
npm test -- --testPathPattern="mock-data"
```
Expected: FAIL — `Cannot find module '@/lib/mock-data'`

- [ ] **Step 3: Create lib/types.ts**

```ts
export type Status = "Ativo" | "Inativo"
export type Estagio = "Prospecção" | "Qualificação" | "Proposta" | "Fechado"

export interface Cliente {
  id: string
  nome: string
  email: string
  empresa: string
  status: Status
  cadastro: string
}

export interface Negocio {
  id: string
  cliente: string
  valor: number
  responsavel: string
  estagio: Estagio
}
```

- [ ] **Step 4: Create lib/mock-data.ts**

```ts
import type { Cliente, Negocio } from "./types"

export const clientes: Cliente[] = [
  { id: "1", nome: "Rafael Silva",   email: "rafael@techcorp.com",    empresa: "Tech Corp",       status: "Ativo",   cadastro: "2026-01-10" },
  { id: "2", nome: "Ana Costa",      email: "ana@startupio.com",       empresa: "Startup IO",      status: "Inativo", cadastro: "2026-02-05" },
  { id: "3", nome: "Carlos Lima",    email: "carlos@logitransp.com",   empresa: "LogiTransp",      status: "Ativo",   cadastro: "2026-02-18" },
  { id: "4", nome: "Mariana Souza",  email: "mariana@megavendas.com",  empresa: "MegaVendas",      status: "Ativo",   cadastro: "2026-03-01" },
  { id: "5", nome: "Pedro Alves",    email: "pedro@construtora.com",   empresa: "Construtora XY",  status: "Inativo", cadastro: "2026-03-15" },
  { id: "6", nome: "Juliana Ferraz", email: "juliana@saude360.com",    empresa: "Saúde 360",       status: "Ativo",   cadastro: "2026-04-02" },
  { id: "7", nome: "Bruno Martins",  email: "bruno@financeira.com",    empresa: "Financeira Sul",  status: "Ativo",   cadastro: "2026-04-20" },
  { id: "8", nome: "Camila Rocha",   email: "camila@educatech.com",    empresa: "EducaTech",       status: "Inativo", cadastro: "2026-05-08" },
  { id: "9", nome: "Diego Nunes",    email: "diego@agroprime.com",     empresa: "AgroPrime",       status: "Ativo",   cadastro: "2026-05-22" },
  { id: "10", nome: "Larissa Pinto", email: "larissa@varejo360.com",   empresa: "Varejo 360",      status: "Ativo",   cadastro: "2026-06-01" },
]

export const negocios: Negocio[] = [
  { id: "1",  cliente: "Tech Corp",       valor: 15000, responsavel: "Rafael S.",  estagio: "Prospecção"  },
  { id: "2",  cliente: "AgroPrime",       valor: 9200,  responsavel: "Diego N.",   estagio: "Prospecção"  },
  { id: "3",  cliente: "Varejo 360",      valor: 6500,  responsavel: "Larissa P.", estagio: "Prospecção"  },
  { id: "4",  cliente: "Startup IO",      valor: 8500,  responsavel: "Ana C.",     estagio: "Qualificação" },
  { id: "5",  cliente: "EducaTech",       valor: 12000, responsavel: "Camila R.",  estagio: "Qualificação" },
  { id: "6",  cliente: "Saúde 360",       valor: 7800,  responsavel: "Juliana F.", estagio: "Qualificação" },
  { id: "7",  cliente: "LogiTransp",      valor: 32000, responsavel: "Carlos L.",  estagio: "Proposta"    },
  { id: "8",  cliente: "Financeira Sul",  valor: 18500, responsavel: "Bruno M.",   estagio: "Proposta"    },
  { id: "9",  cliente: "Construtora XY",  valor: 25000, responsavel: "Pedro A.",   estagio: "Proposta"    },
  { id: "10", cliente: "MegaVendas",      valor: 45000, responsavel: "Mariana S.", estagio: "Fechado"     },
  { id: "11", cliente: "Tech Corp",       valor: 28000, responsavel: "Rafael S.",  estagio: "Fechado"     },
]
```

- [ ] **Step 5: Run test — expect PASS**

```powershell
npm test -- --testPathPattern="mock-data"
```
Expected: PASS — 4 tests passed.

- [ ] **Step 6: Commit**

```powershell
git add lib/ __tests__/mock-data.test.ts
git commit -m "feat: add TypeScript types and mock data"
```

---

## Task 3: Authentication & Route Protection

**Files:**
- Create: `.env.local`
- Create: `auth.ts`
- Create: `app/api/auth/[...nextauth]/route.ts`
- Create: `middleware.ts`
- Create: `__tests__/auth.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `validateCredentials(email, password): { id, name, email } | null`
  - `auth()` — returns session from server components
  - `signIn`, `signOut` — server actions
  - `handlers` — Next.js API route handlers

- [ ] **Step 1: Write failing test**

Create `__tests__/auth.test.ts`:
```ts
import { validateCredentials } from "@/auth"

describe("validateCredentials", () => {
  it("returns user for valid credentials", () => {
    const result = validateCredentials("admin@crm.com", "admin123")
    expect(result).toEqual({ id: "1", name: "Admin", email: "admin@crm.com" })
  })

  it("returns null for wrong password", () => {
    const result = validateCredentials("admin@crm.com", "errada")
    expect(result).toBeNull()
  })

  it("returns null for wrong email", () => {
    const result = validateCredentials("outro@email.com", "admin123")
    expect(result).toBeNull()
  })
})
```

- [ ] **Step 2: Run test — expect FAIL**

```powershell
npm test -- --testPathPattern="auth.test"
```
Expected: FAIL — `Cannot find module '@/auth'`

- [ ] **Step 3: Create .env.local**

```
AUTH_SECRET=crm-secret-key-dev-2026
```

- [ ] **Step 4: Create auth.ts**

```ts
import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"

const MOCK_USER = { id: "1", name: "Admin", email: "admin@crm.com" }

export function validateCredentials(
  email: unknown,
  password: unknown
): typeof MOCK_USER | null {
  if (email === "admin@crm.com" && password === "admin123") return MOCK_USER
  return null
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      authorize(credentials) {
        return validateCredentials(credentials?.email, credentials?.password)
      },
    }),
  ],
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
})
```

- [ ] **Step 5: Run test — expect PASS**

```powershell
npm test -- --testPathPattern="auth.test"
```
Expected: PASS — 3 tests passed.

- [ ] **Step 6: Create app/api/auth/[...nextauth]/route.ts**

```ts
import { handlers } from "@/auth"
export const { GET, POST } = handlers
```

- [ ] **Step 7: Create middleware.ts**

```ts
import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  if (!req.auth && req.nextUrl.pathname.startsWith("/dashboard")) {
    const loginUrl = new URL("/login", req.url)
    return NextResponse.redirect(loginUrl)
  }
})

export const config = {
  matcher: ["/dashboard/:path*"],
}
```

- [ ] **Step 8: Commit**

```powershell
git add .env.local auth.ts middleware.ts app/api/
git commit -m "feat: add NextAuth credentials provider and route protection middleware"
```

---

## Task 4: Root Layout & Redirects

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: nothing
- Produces: root HTML shell; `/` redirects to `/login`

- [ ] **Step 1: Replace app/layout.tsx**

```tsx
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "CRM Dashboard",
  description: "Sistema de gestão de clientes",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
```

- [ ] **Step 2: Replace app/globals.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 3: Replace app/page.tsx**

```tsx
import { redirect } from "next/navigation"

export default function RootPage() {
  redirect("/login")
}
```

- [ ] **Step 4: Verify dev server starts**

```powershell
npm run dev
```
Open `http://localhost:3000` — should redirect to `/login` (404 expected until Task 5).
Stop the server with Ctrl+C.

- [ ] **Step 5: Commit**

```powershell
git add app/layout.tsx app/globals.css app/page.tsx
git commit -m "feat: add root layout and redirect / to /login"
```

---

## Task 5: Login Page

**Files:**
- Create: `app/login/page.tsx`

**Interfaces:**
- Consumes: `signIn` from `next-auth/react`
- Produces: `/login` page — calls `signIn("credentials", ...)`, redirects to `/dashboard/clientes` on success

- [ ] **Step 1: Create app/login/page.tsx**

```tsx
"use client"

import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      setError("Email ou senha inválidos.")
      setLoading(false)
    } else {
      router.push("/dashboard/clientes")
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-green-600">CRM</h1>
          <p className="text-gray-500 mt-2 text-sm">Acesse sua conta</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-green-800 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="admin@crm.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-green-800 mb-1">
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50 text-sm"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify login page renders**

```powershell
npm run dev
```
Open `http://localhost:3000` — should redirect to `/login` and show the login form with green "CRM" heading.
Stop the server.

- [ ] **Step 3: Commit**

```powershell
git add app/login/
git commit -m "feat: add login page with credentials form"
```

---

## Task 6: Dashboard Layout (Sidebar + Header)

**Files:**
- Create: `components/layout/Sidebar.tsx`
- Create: `components/layout/SignOutButton.tsx`
- Create: `components/layout/Header.tsx`
- Create: `app/dashboard/layout.tsx`
- Create: `app/dashboard/page.tsx`

**Interfaces:**
- Consumes: `auth()` from `@/auth`, `signOut` from `@/auth`
- Produces: dashboard shell with green sidebar + white header visible on all `/dashboard/*` pages

- [ ] **Step 1: Create components/layout/Sidebar.tsx**

```tsx
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const navItems = [
  {
    href: "/dashboard/clientes",
    label: "Clientes",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    href: "/dashboard/pipeline",
    label: "Pipeline",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-60 bg-green-600 min-h-screen flex flex-col flex-shrink-0">
      <div className="px-6 py-7">
        <h1 className="text-white text-2xl font-bold tracking-tight">CRM</h1>
        <p className="text-green-200 text-xs mt-0.5">Gestão de Clientes</p>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-white text-green-700"
                  : "text-white hover:bg-green-700"
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="px-6 py-4">
        <p className="text-green-200 text-xs">© 2026 CRM</p>
      </div>
    </aside>
  )
}
```

- [ ] **Step 2: Create components/layout/SignOutButton.tsx**

```tsx
"use client"

interface SignOutButtonProps {
  action: () => Promise<void>
}

export function SignOutButton({ action }: SignOutButtonProps) {
  return (
    <form action={action}>
      <button
        type="submit"
        className="text-sm text-white bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors font-medium"
      >
        Sair
      </button>
    </form>
  )
}
```

- [ ] **Step 3: Create components/layout/Header.tsx**

```tsx
import { auth, signOut } from "@/auth"
import { SignOutButton } from "./SignOutButton"

export async function Header() {
  const session = await auth()

  async function handleSignOut() {
    "use server"
    await signOut({ redirectTo: "/login" })
  }

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <span className="text-green-800 font-semibold text-sm">Dashboard</span>
      <div className="flex items-center gap-4">
        <span className="text-gray-500 text-sm">{session?.user?.name ?? "Admin"}</span>
        <SignOutButton action={handleSignOut} />
      </div>
    </header>
  )
}
```

- [ ] **Step 4: Create app/dashboard/layout.tsx**

```tsx
import { Sidebar } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 bg-white">{children}</main>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Create app/dashboard/page.tsx**

```tsx
import { redirect } from "next/navigation"

export default function DashboardPage() {
  redirect("/dashboard/clientes")
}
```

- [ ] **Step 6: Verify layout renders**

```powershell
npm run dev
```
Go to `http://localhost:3000`, log in with `admin@crm.com` / `admin123`. Should see green sidebar on the left, white header on top with "Admin" and "Sair" button. Stop the server.

- [ ] **Step 7: Commit**

```powershell
git add components/layout/ app/dashboard/layout.tsx app/dashboard/page.tsx
git commit -m "feat: add dashboard layout with green sidebar and header"
```

---

## Task 7: Clientes Page

**Files:**
- Create: `components/clientes/StatusBadge.tsx`
- Create: `components/clientes/ClienteTable.tsx`
- Create: `app/dashboard/clientes/page.tsx`
- Create: `__tests__/StatusBadge.test.tsx`
- Create: `__tests__/ClienteTable.test.tsx`

**Interfaces:**
- Consumes: `Cliente` from `@/lib/types`, `clientes` from `@/lib/mock-data`
- Produces: `/dashboard/clientes` page with 4 metric cards and a 10-row table

- [ ] **Step 1: Write failing tests**

Create `__tests__/StatusBadge.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react"
import { StatusBadge } from "@/components/clientes/StatusBadge"

describe("StatusBadge", () => {
  it("renders Ativo", () => {
    render(<StatusBadge status="Ativo" />)
    expect(screen.getByText("Ativo")).toBeInTheDocument()
  })

  it("renders Inativo", () => {
    render(<StatusBadge status="Inativo" />)
    expect(screen.getByText("Inativo")).toBeInTheDocument()
  })
})
```

Create `__tests__/ClienteTable.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react"
import { ClienteTable } from "@/components/clientes/ClienteTable"
import { clientes } from "@/lib/mock-data"

describe("ClienteTable", () => {
  it("renders all 10 client names", () => {
    render(<ClienteTable clientes={clientes} />)
    expect(screen.getByText("Rafael Silva")).toBeInTheDocument()
    expect(screen.getByText("Larissa Pinto")).toBeInTheDocument()
  })

  it("shows email column", () => {
    render(<ClienteTable clientes={clientes} />)
    expect(screen.getByText("rafael@techcorp.com")).toBeInTheDocument()
  })

  it("shows company column", () => {
    render(<ClienteTable clientes={clientes} />)
    expect(screen.getByText("Tech Corp")).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests — expect FAIL**

```powershell
npm test -- --testPathPattern="StatusBadge|ClienteTable"
```
Expected: FAIL — `Cannot find module '@/components/clientes/StatusBadge'`

- [ ] **Step 3: Create components/clientes/StatusBadge.tsx**

```tsx
import type { Status } from "@/lib/types"

interface StatusBadgeProps {
  status: Status
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const styles =
    status === "Ativo"
      ? "bg-green-100 text-green-700"
      : "bg-gray-100 text-gray-600"

  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${styles}`}>
      {status}
    </span>
  )
}
```

- [ ] **Step 4: Create components/clientes/ClienteTable.tsx**

```tsx
import type { Cliente } from "@/lib/types"
import { StatusBadge } from "./StatusBadge"

interface ClienteTableProps {
  clientes: Cliente[]
}

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-")
  return `${day}/${month}/${year}`
}

export function ClienteTable({ clientes }: ClienteTableProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-green-50 border-b border-gray-200">
            <th className="text-left px-6 py-3 text-green-800 font-semibold">Nome</th>
            <th className="text-left px-6 py-3 text-green-800 font-semibold">Email</th>
            <th className="text-left px-6 py-3 text-green-800 font-semibold">Empresa</th>
            <th className="text-left px-6 py-3 text-green-800 font-semibold">Status</th>
            <th className="text-left px-6 py-3 text-green-800 font-semibold">Cadastro</th>
          </tr>
        </thead>
        <tbody>
          {clientes.map((cliente, index) => (
            <tr
              key={cliente.id}
              className={`border-b border-gray-100 hover:bg-green-50 transition-colors ${
                index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
              }`}
            >
              <td className="px-6 py-4 font-medium text-gray-900">{cliente.nome}</td>
              <td className="px-6 py-4 text-gray-500">{cliente.email}</td>
              <td className="px-6 py-4 text-gray-700">{cliente.empresa}</td>
              <td className="px-6 py-4"><StatusBadge status={cliente.status} /></td>
              <td className="px-6 py-4 text-gray-500">{formatDate(cliente.cadastro)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 5: Run tests — expect PASS**

```powershell
npm test -- --testPathPattern="StatusBadge|ClienteTable"
```
Expected: PASS — 5 tests passed.

- [ ] **Step 6: Create app/dashboard/clientes/page.tsx**

```tsx
import { clientes } from "@/lib/mock-data"
import { ClienteTable } from "@/components/clientes/ClienteTable"

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <p className="text-gray-500 text-sm">{label}</p>
      <p className="text-3xl font-bold text-green-600 mt-1">{value}</p>
    </div>
  )
}

export default function ClientesPage() {
  const total = clientes.length
  const ativos = clientes.filter((c) => c.status === "Ativo").length
  const inativos = clientes.filter((c) => c.status === "Inativo").length
  const mesAtual = new Date().toISOString().slice(0, 7)
  const novos = clientes.filter((c) => c.cadastro.startsWith(mesAtual)).length

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-green-800 mb-6">Clientes</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <MetricCard label="Total de Clientes" value={total} />
        <MetricCard label="Clientes Ativos" value={ativos} />
        <MetricCard label="Clientes Inativos" value={inativos} />
        <MetricCard label="Novos este Mês" value={novos} />
      </div>

      <ClienteTable clientes={clientes} />
    </div>
  )
}
```

- [ ] **Step 7: Verify clientes page**

```powershell
npm run dev
```
Log in and navigate to Clientes. Should show 4 green metric cards and a table with 10 rows. Stop the server.

- [ ] **Step 8: Commit**

```powershell
git add components/clientes/ app/dashboard/clientes/ __tests__/StatusBadge.test.tsx __tests__/ClienteTable.test.tsx
git commit -m "feat: add clientes page with metric cards and client table"
```

---

## Task 8: Pipeline Page

**Files:**
- Create: `components/pipeline/KanbanCard.tsx`
- Create: `components/pipeline/KanbanBoard.tsx`
- Create: `app/dashboard/pipeline/page.tsx`
- Create: `__tests__/KanbanCard.test.tsx`

**Interfaces:**
- Consumes: `Negocio`, `Estagio` from `@/lib/types`, `negocios` from `@/lib/mock-data`
- Produces: `/dashboard/pipeline` page with 4 kanban columns

- [ ] **Step 1: Write failing test**

Create `__tests__/KanbanCard.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react"
import { KanbanCard } from "@/components/pipeline/KanbanCard"

const deal = {
  id: "1",
  cliente: "Tech Corp",
  valor: 15000,
  responsavel: "Rafael S.",
  estagio: "Prospecção" as const,
}

describe("KanbanCard", () => {
  it("renders client name", () => {
    render(<KanbanCard negocio={deal} />)
    expect(screen.getByText("Tech Corp")).toBeInTheDocument()
  })

  it("renders formatted currency value", () => {
    render(<KanbanCard negocio={deal} />)
    expect(screen.getByText(/15\.000/)).toBeInTheDocument()
  })

  it("renders responsible person", () => {
    render(<KanbanCard negocio={deal} />)
    expect(screen.getByText("Rafael S.")).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test — expect FAIL**

```powershell
npm test -- --testPathPattern="KanbanCard"
```
Expected: FAIL — `Cannot find module '@/components/pipeline/KanbanCard'`

- [ ] **Step 3: Create components/pipeline/KanbanCard.tsx**

```tsx
import type { Negocio } from "@/lib/types"

interface KanbanCardProps {
  negocio: Negocio
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

export function KanbanCard({ negocio }: KanbanCardProps) {
  return (
    <div className="bg-white border-l-4 border-green-500 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
      <p className="font-semibold text-gray-900 text-sm">{negocio.cliente}</p>
      <p className="text-green-600 font-bold text-base mt-1">{formatCurrency(negocio.valor)}</p>
      <p className="text-gray-400 text-xs mt-2">{negocio.responsavel}</p>
    </div>
  )
}
```

- [ ] **Step 4: Run test — expect PASS**

```powershell
npm test -- --testPathPattern="KanbanCard"
```
Expected: PASS — 3 tests passed.

- [ ] **Step 5: Create components/pipeline/KanbanBoard.tsx**

```tsx
import type { Negocio, Estagio } from "@/lib/types"
import { KanbanCard } from "./KanbanCard"

const ESTAGIOS: Estagio[] = ["Prospecção", "Qualificação", "Proposta", "Fechado"]

const COLUMN_COLORS: Record<Estagio, string> = {
  "Prospecção":  "bg-blue-50   border-blue-200",
  "Qualificação":"bg-yellow-50  border-yellow-200",
  "Proposta":    "bg-orange-50  border-orange-200",
  "Fechado":     "bg-green-50   border-green-200",
}

const HEADER_COLORS: Record<Estagio, string> = {
  "Prospecção":  "text-blue-700",
  "Qualificação":"text-yellow-700",
  "Proposta":    "text-orange-700",
  "Fechado":     "text-green-700",
}

interface KanbanBoardProps {
  negocios: Negocio[]
}

export function KanbanBoard({ negocios }: KanbanBoardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {ESTAGIOS.map((estagio) => {
        const cards = negocios.filter((n) => n.estagio === estagio)
        const total = cards.reduce((sum, n) => sum + n.valor, 0)

        return (
          <div
            key={estagio}
            className={`border rounded-xl p-4 ${COLUMN_COLORS[estagio]}`}
          >
            <div className="mb-4">
              <h3 className={`font-bold text-sm ${HEADER_COLORS[estagio]}`}>
                {estagio}
              </h3>
              <p className="text-gray-400 text-xs mt-0.5">
                {cards.length} {cards.length === 1 ? "negócio" : "negócios"} ·{" "}
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(total)}
              </p>
            </div>
            <div className="space-y-3">
              {cards.map((negocio) => (
                <KanbanCard key={negocio.id} negocio={negocio} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 6: Create app/dashboard/pipeline/page.tsx**

```tsx
import { negocios } from "@/lib/mock-data"
import { KanbanBoard } from "@/components/pipeline/KanbanBoard"

export default function PipelinePage() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-green-800 mb-6">Pipeline de Vendas</h2>
      <KanbanBoard negocios={negocios} />
    </div>
  )
}
```

- [ ] **Step 7: Run all tests**

```powershell
npm test
```
Expected: PASS — all test suites pass.

- [ ] **Step 8: Verify full app end-to-end**

```powershell
npm run dev
```
Checklist:
- `http://localhost:3000` → redirects to `/login` ✓
- Login with wrong password → shows error "Email ou senha inválidos." ✓
- Login with `admin@crm.com` / `admin123` → redirects to `/dashboard/clientes` ✓
- Clientes page: 4 metric cards visible, 10 rows in table with green Ativo / gray Inativo badges ✓
- Click "Pipeline" in sidebar → 4 kanban columns with deal cards ✓
- Click "Sair" → session destroyed, back to `/login` ✓
- Try accessing `http://localhost:3000/dashboard/clientes` while logged out → redirects to `/login` ✓

Stop the server.

- [ ] **Step 9: Final commit**

```powershell
git add components/pipeline/ app/dashboard/pipeline/ __tests__/KanbanCard.test.tsx
git commit -m "feat: add pipeline kanban page — completes CRM dashboard"
```
