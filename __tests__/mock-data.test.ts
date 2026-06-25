import { clientes } from "@/lib/mock-data"

describe("mock-data", () => {
  it("exports 10 clients", () => {
    expect(clientes).toHaveLength(10)
  })

  it("all clients have required fields", () => {
    clientes.forEach((c) => {
      expect(c.id).toBeDefined()
      expect(c.nome).toBeDefined()
      expect(c.cidade).toBeDefined()
      expect(c.estado).toBeDefined()
      expect(c.criado_em).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
  })
})
