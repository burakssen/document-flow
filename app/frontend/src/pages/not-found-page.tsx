import { useNavigate } from "react-router"

import { Button } from "@/components/ui/button"

export function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-4xl font-bold">404</h1>

      <p className="text-muted-foreground">
        The page you're looking for doesn't exist.
      </p>

      <Button type="button" onClick={() => navigate("/documents/upload")}>
        Back to uploads
      </Button>
    </main>
  )
}
