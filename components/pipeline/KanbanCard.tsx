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
