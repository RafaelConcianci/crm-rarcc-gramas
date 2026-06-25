import { auth, signOut } from "@/auth"
import { SignOutButton } from "./SignOutButton"

export async function Header() {
  const session = await auth()

  async function handleSignOut() {
    "use server"
    await signOut({ redirectTo: "/login" })
  }

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <span className="text-green-800 font-semibold text-sm">Dashboard</span>
      <div className="flex items-center gap-4">
        <span className="text-gray-500 text-sm">{session?.user?.name ?? "Admin"}</span>
        <SignOutButton action={handleSignOut} />
      </div>
    </header>
  )
}
