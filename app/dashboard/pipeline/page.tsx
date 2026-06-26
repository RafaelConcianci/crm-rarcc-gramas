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
