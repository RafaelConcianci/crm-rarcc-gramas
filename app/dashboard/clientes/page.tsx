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
