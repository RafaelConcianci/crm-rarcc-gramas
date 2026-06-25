import { validateCredentials } from "@/auth"

describe("validateCredentials", () => {
  it("returns user for valid credentials", () => {
    const result = validateCredentials("admin@crm.com", "admin123")
    expect(result).toEqual({ id: "1", name: "Admin", email: "admin@crm.com" })
  })

  it("returns null for wrong password", () => {
    const result = validateCredentials("admin@crm.com", "errada")
    expect(result).toBeNull()
  })

  it("returns null for wrong email", () => {
    const result = validateCredentials("outro@email.com", "admin123")
    expect(result).toBeNull()
  })
})
