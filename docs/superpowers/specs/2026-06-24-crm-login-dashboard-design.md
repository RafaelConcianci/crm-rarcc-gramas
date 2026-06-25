# CRM Login & Dashboard — Design Spec

**Data:** 2026-06-24  
**Status:** Aprovado

---

## Visão Geral

Sistema de login com autenticação protegida que acessa um dashboard de CRM com duas seções principais: lista de clientes e pipeline de vendas. O projeto usa dados mockados e não requer banco de dados real nesta versão.

---

## Stack Tecnológica

| Camada         | Tecnologia             |
|----------------|------------------------|
| Framework      | Next.js 14 (App Router)|
| Autenticação   | NextAuth.js v5         |
| Estilização    | Tailwind CSS           |
| Linguagem      | TypeScript             |
| Dados          | Mock (arquivos .ts)    |

---

## Arquitetura de Pastas

```
/app
  /login                  → página pública de login
  /dashboard              → rota protegida (layout compartilhado)
    /page.tsx             → visão geral (redirect para /clientes)
    /clientes/page.tsx    → lista de clientes
    /pipeline/page.tsx    → kanban de vendas
/components
  /layout
    Sidebar.tsx           → navegação lateral
    Header.tsx            → header com usuário e logout
  /clientes
    ClienteTable.tsx      → tabela de clientes
    StatusBadge.tsx       → badge de status (Ativo/Inativo)
  /pipeline
    KanbanBoard.tsx       → board com colunas
    KanbanCard.tsx        → card de negócio
/lib
  auth.ts                 → configuração NextAuth (credentials provider)
  mock-data.ts            → dados mockados de clientes e negócios
/middleware.ts             → proteção de rotas (redireciona para /login)
```

---

## Autenticação

- Provider: **NextAuth Credentials** (email + senha fixos no código)
- Credenciais mockadas:
  - Email: `admin@crm.com`
  - Senha: `admin123`
- Sessão via cookie seguro (JWT)
- Middleware protege todas as rotas `/dashboard/*`
- Logout destrói a sessão e redireciona para `/login`

**Fluxo:**
1. Usuário acessa qualquer rota → middleware verifica sessão
2. Sem sessão → redireciona para `/login`
3. Login com credenciais válidas → sessão criada → redireciona para `/dashboard/clientes`
4. Logout → sessão destruída → `/login`

---

## Interface Visual

### Paleta de Cores

| Elemento              | Cor                        |
|-----------------------|----------------------------|
| Sidebar (fundo)       | Verde `#16A34A`            |
| Sidebar (texto/ícones)| Branco `#FFFFFF`           |
| Header                | Branco `#FFFFFF`           |
| Botões primários      | Verde `#16A34A`            |
| Hover / destaque      | Verde `#22C55E`            |
| Badges ativos         | Verde claro `#DCFCE7`      |
| Fundo geral           | Branco `#FFFFFF`           |
| Títulos               | Verde escuro `#14532D`     |
| Textos secundários    | Cinza `#6B7280`            |
| Bordas/separadores    | Cinza suave `#E5E7EB`      |

### Página de Login
- Fundo branco
- Card centralizado com:
  - Logo / nome do CRM
  - Campo email
  - Campo senha
  - Botão "Entrar" (verde)
  - Mensagem de erro em caso de credenciais inválidas

### Layout do Dashboard
- **Sidebar esquerda** (fundo verde): logo, links de navegação (Clientes, Pipeline), item ativo destacado em branco
- **Header** (branco): nome da página atual à esquerda, nome do usuário + botão logout à direita
- **Área de conteúdo**: ocupa o restante da tela, fundo branco

---

## Página: Clientes

### Cards de métricas (topo)
- Total de Clientes
- Clientes Ativos
- Clientes Inativos
- Novos este mês

### Tabela de Clientes
Colunas: **Nome | Email | Empresa | Status | Data de Cadastro**

Dados mockados (~10 registros):

| Nome           | Email                    | Empresa        | Status  | Cadastro    |
|----------------|--------------------------|----------------|---------|-------------|
| Rafael Silva   | rafael@techcorp.com      | Tech Corp      | Ativo   | 2026-01-10  |
| Ana Costa      | ana@startupio.com        | Startup IO     | Inativo | 2026-02-05  |
| Carlos Lima    | carlos@logitransp.com    | LogiTransp     | Ativo   | 2026-02-18  |
| Mariana Souza  | mariana@megavendas.com   | MegaVendas     | Ativo   | 2026-03-01  |
| Pedro Alves    | pedro@construtora.com    | Construtora XY | Inativo | 2026-03-15  |
| Juliana Ferraz | juliana@saude360.com     | Saúde 360      | Ativo   | 2026-04-02  |
| Bruno Martins  | bruno@financeira.com     | Financeira Sul | Ativo   | 2026-04-20  |
| Camila Rocha   | camila@educatech.com     | EducaTech      | Inativo | 2026-05-08  |
| Diego Nunes    | diego@agroprime.com      | AgroPrime      | Ativo   | 2026-05-22  |
| Larissa Pinto  | larissa@varejo360.com    | Varejo 360     | Ativo   | 2026-06-01  |

- Linhas com hover suave (verde muito claro)
- Badge verde para Ativo, cinza para Inativo

---

## Página: Pipeline de Vendas

### Kanban com 4 colunas

**Colunas:** Prospecção → Qualificação → Proposta → Fechado

Cada card mostra:
- Nome do cliente
- Valor do negócio (R$)
- Responsável

Dados mockados:

**Prospecção**
- Tech Corp — R$ 15.000 — Rafael S.
- AgroPrime — R$ 9.200 — Diego N.
- Varejo 360 — R$ 6.500 — Larissa P.

**Qualificação**
- Startup IO — R$ 8.500 — Ana C.
- EducaTech — R$ 12.000 — Camila R.
- Saúde 360 — R$ 7.800 — Juliana F.

**Proposta**
- LogiTransp — R$ 32.000 — Carlos L.
- Financeira Sul — R$ 18.500 — Bruno M.
- Construtora XY — R$ 25.000 — Pedro A.

**Fechado**
- MegaVendas — R$ 45.000 — Mariana S.
- Tech Corp — R$ 28.000 — Rafael S.

Cards: fundo branco, borda esquerda verde, sombra suave.

---

## Tratamento de Erros

- Login com credenciais erradas → mensagem de erro inline no formulário
- Acesso a rota protegida sem sessão → redirect automático para `/login`
- Rota inexistente → página 404 padrão do Next.js

---

## O que está fora do escopo (esta versão)

- Banco de dados real
- CRUD de clientes (criar, editar, deletar)
- Múltiplos usuários
- Arrastar cards no kanban (drag & drop)
- Filtros e busca na tabela
- Gráficos e relatórios
