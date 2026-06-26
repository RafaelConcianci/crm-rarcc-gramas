import { render, screen, within } from "@testing-library/react"
import { KanbanBoard } from "@/components/pipeline/KanbanBoard"
import type { Negocio } from "@/lib/types"

const negocios: Negocio[] = [
  { id: "1", cliente: "Tech Corp",  valor: 15000, responsavel: "Rafael S.", estagio: "Prospecção" },
  { id: "2", cliente: "AgroPrime",  valor: 9000,  responsavel: "Diego N.",  estagio: "Prospecção" },
  { id: "3", cliente: "LogiTransp", valor: 32000, responsavel: "Carlos L.", estagio: "Proposta" },
]

describe("KanbanBoard", () => {
  it("renders all four stage columns", () => {
    render(<KanbanBoard negocios={negocios} />)
    expect(screen.getByText("Prospecção")).toBeInTheDocument()
    expect(screen.getByText("Qualificação")).toBeInTheDocument()
    expect(screen.getByText("Proposta")).toBeInTheDocument()
    expect(screen.getByText("Fechado")).toBeInTheDocument()
  })

  it("places each deal in its stage column", () => {
    render(<KanbanBoard negocios={negocios} />)
    const prospeccao = screen.getByText("Prospecção").closest("div")!.parentElement!
    expect(within(prospeccao).getByText("Tech Corp")).toBeInTheDocument()
    expect(within(prospeccao).getByText("AgroPrime")).toBeInTheDocument()
    expect(within(prospeccao).queryByText("LogiTransp")).not.toBeInTheDocument()
  })

  it("shows the deal count and pluralizes correctly", () => {
    render(<KanbanBoard negocios={negocios} />)
    // Prospecção has 2 deals (plural), Proposta has 1 (singular)
    expect(screen.getByText(/2 negócios/)).toBeInTheDocument()
    expect(screen.getByText(/1 negócio ·/)).toBeInTheDocument()
  })

  it("sums the total value per column", () => {
    render(<KanbanBoard negocios={negocios} />)
    // Prospecção: 15000 + 9000 = 24000
    expect(screen.getByText(/24\.000/)).toBeInTheDocument()
  })

  it("renders an empty column with zero deals", () => {
    render(<KanbanBoard negocios={negocios} />)
    // Qualificação and Fechado have no deals
    expect(screen.getAllByText(/0 negócios/).length).toBeGreaterThanOrEqual(1)
  })
})
