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
