export type Role = 'admin' | 'vendedor'
export type StatusCarregamento = 'agendado' | 'realizado' | 'cancelado'
export type CategoriaFinanceiro = 'fixa' | 'variavel'
export type TipoFinanceiro =
  | 'salario' | 'comissao' | 'imposto' | 'compra_grama'
  | 'frete' | 'plantio' | 'outros_fixo' | 'outros_variavel'
export type Status = 'Ativo' | 'Inativo'

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
  cidade?: string
  estado?: string
  criado_em?: string
  email: string
  empresa: string
  status: Status
  cadastro: string
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

export interface Negocio {
  id: string
  cliente: string
  valor: number
  responsavel: string
  estagio: string
}
