"use client"

interface SignOutButtonProps {
  action: () => Promise<void>
}

export function SignOutButton({ action }: SignOutButtonProps) {
  return (
    <form action={action}>
      <button
        type="submit"
        className="text-sm text-white bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors font-medium"
      >
        Sair
      </button>
    </form>
  )
}
