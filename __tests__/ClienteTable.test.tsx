import { render, screen } from "@testing-library/react"
import { ClienteTable } from "@/components/clientes/ClienteTable"
import { clientes } from "@/lib/mock-data"

describe("ClienteTable", () => {
  it("renders all 10 client names", () => {
    render(<ClienteTable clientes={clientes} />)
    expect(screen.getByText("Rafael Silva")).toBeInTheDocument()
    expect(screen.getByText("Larissa Pinto")).toBeInTheDocument()
  })

  it("shows email column", () => {
    render(<ClienteTable clientes={clientes} />)
    expect(screen.getByText("rafael@techcorp.com")).toBeInTheDocument()
  })

  it("shows company column", () => {
    render(<ClienteTable clientes={clientes} />)
    expect(screen.getByText("Tech Corp")).toBeInTheDocument()
  })
})
