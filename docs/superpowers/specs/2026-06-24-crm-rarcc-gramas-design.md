# CRM RARCC Gramas — Design Spec

**Data:** 2026-06-24  
**Projeto:** Sistema CRM com login para gestão de vendas de grama  
**Empresa:** RARCC Gramas  

---

## 1. Visão Geral

Aplicação web completa com autenticação (login/senha) para gestão de vendas de grama. Substitui as planilhas Excel mensais por um CRM centralizado, acessível de computador e celular. Múltiplos usuários com permissões diferenciadas (admin e vendedor).

---

## 2. Stack Técnica

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 14 (App Router) |
| Estilo | Tailwind CSS + shadcn/ui |
| Gráficos | Recharts |
| Exportação Excel | SheetJS (xlsx) |
| Backend/Auth | Supabase (PostgreSQL + Auth) |
| Deploy | Vercel (frontend) + Supabase (backend) |
| Migração inicial | Script Python lendo Excel de Junho/2026 |

### Variáveis de Ambiente

```
NEXT_PUBLIC_SUPABASE_URL          # URL pública do projeto Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY     # Chave anônima (segura para o client)
SUPABASE_SERVICE_ROLE_KEY         # Chave de serviço — apenas server-side (Route Handlers)
```

A `SUPABASE_SERVICE_ROLE_KEY` é usada exclusivamente em Route Handlers do Next.js para criação de usuários via Admin API. Nunca exposta ao client.

---

## 3. Autenticação e Roles

- Login via **email + senha** (Supabase Auth)
- Dois roles armazenados na tabela `profiles` (campo `role`):
  - `admin` — acesso total a todas as telas e dados de todos os vendedores
  - `vendedor` — acesso apenas aos próprios carregamentos e métricas pessoais
- Sessão persistente no browser (Supabase Auth cookies via `@supabase/ssr`)
- **Proteção de rotas no Next.js:** `middleware.ts` verifica sessão e role antes de servir cada rota:
  - Não autenticado → redireciona para `/login`
  - `vendedor` tentando acessar `/financeiro` ou `/usuarios` → redireciona para `/dashboard` com erro 403
- Row Level Security (RLS) no Supabase como segunda camada de proteção

### Criação de Usuários

O admin cria usuários pela tela `/usuarios`, que chama um **Route Handler** (`POST /api/usuarios`) usando a `SUPABASE_SERVICE_ROLE_KEY` para:
1. Criar o usuário no Supabase Auth (`auth.admin.createUser`)
2. Inserir o perfil na tabela `profiles` com o `role` definido

Um **database trigger** (`on_auth_user_created`) garante que, se o Auth criar um usuário por qualquer outro meio, um registro em `profiles` seja automaticamente criado com role padrão `vendedor`.

---

## 4. Banco de Dados (PostgreSQL via Supabase)

### `profiles` (substitui `usuarios` — vinculada ao auth.users)
```
id          uuid PK → auth.users.id
nome        text
role        enum('admin', 'vendedor')
ativo       boolean DEFAULT true
criado_em   timestamp DEFAULT now()
```
`email` e dados de autenticação são gerenciados pelo Supabase Auth (`auth.users`). Esta tabela armazena apenas dados de aplicação. O campo `ativo = false` desativa o acesso sem excluir o usuário do Auth.

### `clientes` (compartilhados entre todos os vendedores)
```
id            uuid PK DEFAULT gen_random_uuid()
nome          text NOT NULL
cidade        text
estado        text
criado_em     timestamp DEFAULT now()
```
Clientes são cadastros compartilhados — qualquer vendedor pode usar um cliente existente ao registrar um carregamento.

### `carregamentos`
```
id            uuid PK DEFAULT gen_random_uuid()
data          date NOT NULL          -- data do carregamento
data_entrega  date                   -- data agendada para entrega
status        text DEFAULT 'agendado' CHECK (status IN ('agendado','realizado','cancelado'))
cliente_id    uuid FK → clientes
produto       text                   -- ex: ESMERALDA
quantidade    integer                -- m²
nf            text
motorista     text
fornecedor    text
custo_total   numeric(10,2)          -- custo total da grama (compra)
preco_m2      numeric(10,2)          -- preço de venda por m²
frete         numeric(10,2)
ad_servico    numeric(10,2)          -- adiantamento de serviço
custo_servico numeric(10,2)
vendedor_id   uuid FK → profiles.id
criado_em     timestamp DEFAULT now()
```

**Fórmulas de negócio (calculadas na aplicação, não armazenadas):**
- `faturamento = preco_m2 × quantidade`
- `lucro_bruto = faturamento − custo_total − frete − custo_servico`
- `lucro_liquido` = lucro_bruto do vendedor no mês − despesas variáveis proporcionais (calculado na tela Financeiro pelo admin)
- `comissao = lucro_bruto_mes × percentual_comissao` onde `percentual_comissao` é buscado na tabela `metas` pelo nível correspondente ao lucro bruto do vendedor no mês

### `metas` (faixas de comissão globais — aplicadas a todos os vendedores)
```
id                    uuid PK DEFAULT gen_random_uuid()
mes                   integer NOT NULL
ano                   integer NOT NULL
nivel                 text NOT NULL   -- 'Base', 'Meta 1', 'Meta 2', 'Meta 3', 'Super Meta'
lucro_min             numeric(10,2)
lucro_max             numeric(10,2)
percentual_comissao   numeric(5,4)    -- ex: 0.07 = 7%
```
As faixas são globais (mesmo critério para Rafael e Fábio). O nível ativo de cada vendedor é determinado pelo seu lucro bruto acumulado no mês comparado às faixas `lucro_min`/`lucro_max`.

### `financeiro`
```
id          uuid PK DEFAULT gen_random_uuid()
mes         integer NOT NULL
ano         integer NOT NULL
tipo        text NOT NULL CHECK (tipo IN ('salario','comissao','imposto','compra_grama','frete','plantio','outros_fixo','outros_variavel'))
categoria   text NOT NULL CHECK (categoria IN ('fixa', 'variavel'))
descricao   text
valor       numeric(10,2)
criado_em   timestamp DEFAULT now()
```
O campo `tipo` permite agrupar e exibir automaticamente categorias na tela Financeiro. `compra_grama` e `frete` são lançados manualmente (ou importados da migração); salários e comissões também são lançamentos manuais do admin.

---

## 5. Políticas RLS (Row Level Security)

### `profiles`
- `SELECT`: usuário vê apenas o próprio perfil; admin vê todos
- `UPDATE`: usuário atualiza apenas o próprio perfil; admin atualiza todos
- `INSERT`/`DELETE`: apenas via Service Role (Route Handler)

### `clientes`
- `SELECT`, `INSERT`, `UPDATE`, `DELETE`: qualquer usuário autenticado (clientes são compartilhados)

### `carregamentos`
- `SELECT`: admin vê todos; vendedor vê apenas `WHERE vendedor_id = auth.uid()`
- `INSERT`: vendedor insere apenas com `vendedor_id = auth.uid()`; admin insere para qualquer vendedor
- `UPDATE`/`DELETE`: admin pode tudo; vendedor apenas nos próprios registros

### `metas`
- `SELECT`: qualquer usuário autenticado
- `INSERT`/`UPDATE`/`DELETE`: apenas admin (`WHERE role = 'admin'` via join com `profiles`)

### `financeiro`
- `SELECT`/`INSERT`/`UPDATE`/`DELETE`: apenas admin

---

## 6. Telas

### 6.1 Login
- Campos: email e senha
- Redirecionamento automático para `/dashboard` após autenticação
- Sem cadastro público — usuários criados pelo admin
- Estado de erro: mensagem "Email ou senha incorretos" inline

### 6.2 Dashboard
- **Cards:** Faturamento do mês, Lucro bruto, Lucro líquido, % da meta atingida
- **Gráfico de barras:** faturamento por vendedor (Recharts)
- **Tabela:** ranking de vendedores com metragem, faturamento, lucro e comissão calculada
- Admin vê todos os vendedores; vendedor vê apenas seus próprios números
- Filtro por mês/ano — padrão: mês atual; refletido na URL (`?mes=6&ano=2026`)
- Estado vazio: mensagem "Nenhum carregamento registrado neste período"

### 6.3 Carregamentos
- **Tabela** com filtros por data, vendedor, cliente, produto e status
- **Calendário/Agenda** — view por semana/mês com entregas agendadas; destaque visual por status (agendado=azul, realizado=verde, cancelado=vermelho); view simplificada em mobile
- Botão "Novo carregamento" — formulário completo com todos os campos
- Ações: editar, excluir carregamento
- Exportar tabela filtrada para Excel (SheetJS)
- Vendedor vê apenas os próprios carregamentos (RLS + middleware)

### 6.4 Clientes
- Lista de clientes com busca por nome e cidade
- Cadastrar, editar, excluir clientes
- Campo de busca integrado ao formulário de carregamento (autocomplete)

### 6.5 Financeiro *(somente admin)*
- Painel mensal com lançamentos agrupados por `tipo`
- Resumo automático: compra de grama, frete total, salários, comissões, impostos (DAS, DARF), plantio
- Lucro líquido = faturamento total do mês − soma de todos os lançamentos do mês
- Cadastrar, editar e excluir lançamentos financeiros
- Filtro por mês/ano

### 6.6 Metas *(somente admin)*
- Tabela de níveis com faixas de lucro e % de comissão
- Admin pode editar os valores
- Filtro por mês/ano — permite definir metas diferentes por período
- Dashboard usa essas metas para calcular comissões em tempo real

### 6.7 Usuários *(somente admin)*
- Lista de usuários com nome, email, role e status (ativo/inativo)
- Cadastrar novo usuário (email, nome, role) via Route Handler com Admin API
- Editar role; desativar usuário (seta `ativo = false` em `profiles`)

---

## 7. Responsividade

- Layout adaptado para mobile e desktop (Tailwind responsive breakpoints)
- Menu lateral colapsável em mobile (drawer)
- Tabelas com scroll horizontal em telas pequenas
- Calendário de agendamentos com view simplificada em mobile

---

## 8. Migração Inicial

Script Python (`scripts/migrate_excel.py`) com estratégia **upsert** (seguro para re-execução):
1. Lê `06 JUNHO 2026.xlsx`
2. Extrai clientes únicos da aba ADM. VENDAS → upsert em `clientes` (por nome)
3. Extrai carregamentos → upsert em `carregamentos` (por `nf` como chave de deduplicação)
4. Extrai metas da aba RELATORIO META → upsert em `metas` (por `mes + ano + nivel`)
5. Extrai despesas da aba FINANCEIRO → upsert em `financeiro` (por `mes + ano + tipo + descricao`)
6. Cria usuários iniciais via Admin API: Rafael Concianci (admin) e Fábio Caiares (vendedor)

---

## 9. Estrutura de Pastas

```
/app
  /login
  /dashboard
  /carregamentos
  /clientes
  /financeiro
  /metas
  /usuarios
  /api
    /usuarios        ← Route Handler (criação de usuário via Admin API)
/components
  /ui               ← shadcn/ui
  /charts
  /calendar
/lib
  supabase.ts       ← client Supabase (browser)
  supabase-server.ts ← client Supabase (server/middleware)
middleware.ts        ← proteção de rotas por role
/scripts
  migrate_excel.py
/docs
  /superpowers/specs
```

---

## 10. Fora do Escopo

- Módulo de Mudas/Paisagismo (removido a pedido do usuário)
- Integração com sistemas fiscais/NF-e
- App mobile nativo
- Relatórios PDF automáticos
- Targets de meta por vendedor individualmente (metas são globais)
