import { AppRouter } from "@/app/router"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/features/auth/auth-context"

export function App() {
  return (
    <ThemeProvider defaultTheme="dark">
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
