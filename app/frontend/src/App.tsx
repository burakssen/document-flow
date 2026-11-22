import { AppRouter } from "@/app/router"
import { ThemeProvider } from "@/components/theme-provider"

export function App() {
  return (
    <ThemeProvider defaultTheme="dark">
      <AppRouter />
    </ThemeProvider>
  )
}

export default App
