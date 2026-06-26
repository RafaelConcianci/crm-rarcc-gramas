import type { Status } from "@/lib/types"

interface StatusBadgeProps {
  status: Status
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const styles =
    status === "Ativo"
      ? "bg-green-100 text-green-700"
      : "bg-gray-100 text-gray-600"

  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${styles}`}>
      {status}
    </span>
  )
}
