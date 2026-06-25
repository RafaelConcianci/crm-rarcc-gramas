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
