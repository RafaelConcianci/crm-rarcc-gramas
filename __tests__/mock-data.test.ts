import { clientes, negocios } from "@/lib/mock-data"

describe("mock-data", () => {
  it("exports 10 clients", () => {
    expect(clientes).toHaveLength(10)
  })

  it("all clients have required fields", () => {
    clientes.forEach((c) => {
      expect(c.id).toBeDefined()
      expect(c.nome).toBeDefined()
      expect(c.email).toBeDefined()
      expect(c.empresa).toBeDefined()
      expect(["Ativo", "Inativo"]).toContain(c.status)
      expect(c.cadastro).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
  })

  it("exports 11 deals", () => {
    expect(negocios).toHaveLength(11)
  })

  it("all deals have valid estagio", () => {
    const valid = ["Prospecção", "Qualificação", "Proposta", "Fechado"]
    negocios.forEach((n) => {
      expect(valid).toContain(n.estagio)
    })
  })
})
