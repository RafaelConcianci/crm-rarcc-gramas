import { render, screen } from "@testing-library/react"
import { KanbanCard } from "@/components/pipeline/KanbanCard"

const deal = {
  id: "1",
  cliente: "Tech Corp",
  valor: 15000,
  responsavel: "Rafael S.",
  estagio: "Prospecção" as const,
}

describe("KanbanCard", () => {
  it("renders client name", () => {
    render(<KanbanCard negocio={deal} />)
    expect(screen.getByText("Tech Corp")).toBeInTheDocument()
  })

  it("renders formatted currency value", () => {
    render(<KanbanCard negocio={deal} />)
    expect(screen.getByText(/15\.000/)).toBeInTheDocument()
  })

  it("renders responsible person", () => {
    render(<KanbanCard negocio={deal} />)
    expect(screen.getByText("Rafael S.")).toBeInTheDocument()
  })
})
