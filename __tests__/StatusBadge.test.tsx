import { render, screen } from "@testing-library/react"
import { StatusBadge } from "@/components/clientes/StatusBadge"

describe("StatusBadge", () => {
  it("renders Ativo", () => {
    render(<StatusBadge status="Ativo" />)
    expect(screen.getByText("Ativo")).toBeInTheDocument()
  })

  it("renders Inativo", () => {
    render(<StatusBadge status="Inativo" />)
    expect(screen.getByText("Inativo")).toBeInTheDocument()
  })
})
