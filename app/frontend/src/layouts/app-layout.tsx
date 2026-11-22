import { Outlet, useNavigate } from "react-router"
import { useAuth } from "@/features/auth/auth-context"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

export function AppLayout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="min-h-svh">
      {user && (
        <header className="border-b px-4 py-3 flex items-center justify-between bg-background">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Document Flow</span>
            <span className="text-xs text-muted-foreground">{user.email}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              signOut()
              navigate("/login", { replace: true })
            }}
          >
            <LogOut className="ml-2 h-4 w-4" /> Sign out
          </Button>
        </header>
      )}

      <div className="p-4">
        <Outlet />
      </div>
    </div>
  )
}
