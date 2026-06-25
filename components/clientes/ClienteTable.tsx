import type { Cliente } from "@/lib/types"
import { StatusBadge } from "./StatusBadge"

interface ClienteTableProps {
  clientes: Cliente[]
}

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-")
  return `${day}/${month}/${year}`
}

export function ClienteTable({ clientes }: ClienteTableProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-green-50 border-b border-gray-200">
            <th className="text-left px-6 py-3 text-green-800 font-semibold">Nome</th>
            <th className="text-left px-6 py-3 text-green-800 font-semibold">Email</th>
            <th className="text-left px-6 py-3 text-green-800 font-semibold">Empresa</th>
            <th className="text-left px-6 py-3 text-green-800 font-semibold">Status</th>
            <th className="text-left px-6 py-3 text-green-800 font-semibold">Cadastro</th>
          </tr>
        </thead>
        <tbody>
          {clientes.map((cliente, index) => (
            <tr
              key={cliente.id}
              className={`border-b border-gray-100 hover:bg-green-50 transition-colors ${
                index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
              }`}
            >
              <td className="px-6 py-4 font-medium text-gray-900">{cliente.nome}</td>
              <td className="px-6 py-4 text-gray-500">{cliente.email}</td>
              <td className="px-6 py-4 text-gray-700">{cliente.empresa}</td>
              <td className="px-6 py-4"><StatusBadge status={cliente.status} /></td>
              <td className="px-6 py-4 text-gray-500">{formatDate(cliente.cadastro)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
