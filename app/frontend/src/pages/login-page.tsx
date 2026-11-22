import { useState, type SubmitEvent } from "react"
import { Link, useLocation, useNavigate } from "react-router"
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  FileCheck2,
  FileText,
  Files,
  Folder,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/features/auth/auth-context"

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signIn, isLoading } = useAuth()

  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [email, setEmail] = useState(
    () => (location.state as { email?: string } | null)?.email ?? ""
  )
  const [password, setPassword] = useState("")

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()

    setError(null)

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!email) {
      setError("Please enter an email address.")
      return
    }

    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.")
      return
    }

    if (!password) {
      setError("Please enter your password.")
      return
    }

    try {
      await signIn(email, password)
      navigate("/documents/upload", { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.")
    }
  }

  return (
    <main className="grid min-h-svh min-w-0 grid-cols-1 bg-background lg:grid-cols-[minmax(320px,1fr)_minmax(0,2fr)]">
      {/* Login panel */}
      <section className="flex min-h-svh min-w-0 items-center justify-center px-6 py-8 sm:px-10 lg:px-8 xl:px-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              Welcome back
            </h1>

            <p className="text-sm leading-6 text-muted-foreground">
              Sign in to your account to continue managing your documents.
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-none bg-destructive p-3 text-sm text-white">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>

              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="h-11 rounded-none pl-10"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="password">Password</Label>

                <Link
                  to="/forgot-password"
                  className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
                >
                  Forgot password?
                </Link>
              </div>

              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-11 rounded-none pl-10 pr-10"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-2">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
                className="h-4 w-4 cursor-pointer rounded-none border-input accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />

              <Label
                htmlFor="remember-me"
                className="cursor-pointer text-sm font-normal text-muted-foreground"
              >
                Remember me for 30 days
              </Label>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              className="h-11 w-full rounded-none"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign in"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          {/* Divider */}
          <div className="my-7 flex items-center gap-4">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">OR</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Sign up */}
          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="font-medium text-primary transition-colors hover:text-primary/80"
            >
              Create an account
            </Link>
          </p>

          {/* Legal */}
          <p className="mt-10 text-center text-xs leading-5 text-muted-foreground">
            By continuing, you agree to our{" "}
            <Link to="/terms" className="underline underline-offset-4">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link to="/privacy" className="underline underline-offset-4">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </section>

      {/* Marketing panel */}
      <aside className="relative hidden min-h-svh min-w-0 flex-col overflow-hidden border-l bg-muted/20 px-8 py-8 lg:flex xl:px-12">
        <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col gap-7">
          {/* Brand */}
          <header className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-primary text-primary-foreground shadow-sm">
              <Files className="h-5 w-5" />
            </div>

            <span className="text-xl font-semibold tracking-tight">
              Document Flow
            </span>
          </header>

          {/* Hero */}
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              DOCUMENT MANAGEMENT
            </div>

            <h2 className="max-w-xl text-3xl font-semibold leading-tight tracking-tight xl:text-4xl">
              Everything your documents need.
              <span className="text-primary"> All in one place.</span>
            </h2>

            <p className="max-w-lg text-sm leading-6 text-muted-foreground">
              Organize, process, and manage your documents in one secure
              workspace.
            </p>
          </div>

          {/* Product illustration */}
          <div className="relative flex min-h-[min(42vh,360px)] flex-1 items-center">
            <div className="w-full overflow-hidden border bg-card shadow-lg shadow-black/4">
              {/* Dashboard header */}
              <div className="flex items-center justify-between gap-4 border-b px-5 py-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-primary/10 text-primary">
                    <Files className="h-4 w-4" />
                  </div>

                  <span className="truncate text-sm font-semibold">
                    Workspace
                  </span>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <div className="h-2 w-2 bg-emerald-500" />
                  <span className="text-xs text-muted-foreground">
                    All systems ready
                  </span>
                </div>
              </div>

              {/* Dashboard content */}
              <div className="grid min-w-0 md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
                {/* Document list */}
                <div className="min-w-0 border-b p-5 md:border-b-0 md:border-r sm:p-6">
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">Recent documents</p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        Your document library
                      </p>
                    </div>

                    <div className="flex h-8 w-8 items-center justify-center bg-muted">
                      <Folder className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    {[
                      {
                        name: "Quarterly report.pdf",
                        size: "2.4 MB",
                        active: true,
                      },
                      {
                        name: "Financial overview.pdf",
                        size: "1.8 MB",
                        active: false,
                      },
                      {
                        name: "Project documents.pdf",
                        size: "4.2 MB",
                        active: false,
                      },
                      {
                        name: "Business agreement.pdf",
                        size: "980 KB",
                        active: false,
                      },
                    ].map((file) => (
                      <div
                        key={file.name}
                        className={`flex min-w-0 items-center gap-3 border p-3 transition-colors ${
                          file.active
                            ? "border-primary/30 bg-primary/4"
                            : "border-transparent bg-muted/30"
                        }`}
                      >
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center ${
                            file.active
                              ? "bg-primary/10 text-primary"
                              : "bg-background text-muted-foreground"
                          }`}
                        >
                          <FileText className="h-4 w-4" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium">
                            {file.name}
                          </p>

                          <p className="mt-1 text-[10px] text-muted-foreground">
                            {file.size}
                          </p>
                        </div>

                        {file.active && (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Document preview */}
                <div className="flex min-w-0 flex-col justify-center gap-5 bg-muted/20 p-5 sm:p-6">
                  <div className="mx-auto w-full max-w-65 border bg-card p-5 shadow-sm shadow-black/3">
                    <div className="mb-5 flex items-center justify-between">
                      <div className="flex h-9 w-9 items-center justify-center bg-primary/10 text-primary">
                        <FileText className="h-5 w-5" />
                      </div>

                      <span className="border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                        Approved
                      </span>
                    </div>

                    <div className="mb-6 space-y-2">
                      <div className="h-2.5 w-3/4 bg-foreground/15" />
                      <div className="h-2 w-full bg-muted-foreground/15" />
                      <div className="h-2 w-5/6 bg-muted-foreground/15" />
                    </div>

                    <div className="mb-5 bg-muted/50 p-3">
                      <div className="mb-3 flex items-center justify-between">
                        <div className="h-2 w-20 bg-foreground/15" />
                        <div className="h-2 w-8 bg-primary/40" />
                      </div>

                      <div className="space-y-2">
                        <div className="h-1.5 w-full bg-muted-foreground/10" />
                        <div className="h-1.5 w-4/5 bg-muted-foreground/10" />
                        <div className="h-1.5 w-11/12 bg-muted-foreground/10" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="h-2 w-full bg-muted-foreground/10" />
                      <div className="h-2 w-5/6 bg-muted-foreground/10" />
                      <div className="h-2 w-2/3 bg-muted-foreground/10" />
                    </div>
                  </div>

                  {/* Processing status */}
                  <div className="mx-auto flex w-full max-w-65 items-center gap-3 border bg-card p-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <FileCheck2 className="h-4 w-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold">
                          Processing
                        </span>

                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          100%
                        </span>
                      </div>

                      <div className="mt-2 h-1.5 overflow-hidden bg-muted">
                        <div className="h-full w-full bg-emerald-500" />
                      </div>
                    </div>

                    <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                  </div>
                </div>
              </div>

              {/* Dashboard bottom bar */}
              <div className="flex items-center justify-between gap-3 border-t bg-card px-5 py-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Secure workspace
                </div>

                <span className="text-xs text-muted-foreground">
                  Document Flow
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer className="flex flex-wrap items-center justify-between gap-3 border-t pt-5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Built for your documents
            </div>

            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Document Flow
            </p>
          </footer>
        </div>
      </aside>
    </main>
  )
}
