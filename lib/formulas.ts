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
