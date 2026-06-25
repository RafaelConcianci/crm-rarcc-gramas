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
