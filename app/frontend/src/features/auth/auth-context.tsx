import { createContext, useContext, useState, type ReactNode } from "react"

import {
  getStoredTokens,
  getUserFromIdToken,
  signIn,
  signOut,
  signUp,
  type Tokens,
  type User,
} from "./auth-api"

interface AuthContextValue {
  user: User | null
  tokens: Tokens | null
  isLoading: boolean
  isAuthenticated: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [tokens, setTokens] = useState<Tokens | null>(() => getStoredTokens())
  const [user, setUser] = useState<User | null>(() => getUserFromIdToken())
  const [isLoading, setIsLoading] = useState(false)

  const handleSignIn = async (email: string, password: string) => {
    setIsLoading(true)

    try {
      const t = await signIn({ email, password })
      setTokens(t)
      setUser(getUserFromIdToken())
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignUp = async (email: string, password: string) => {
    setIsLoading(true)

    try {
      await signUp({ email, password })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = () => {
    signOut()
    setTokens(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        tokens,
        isLoading,
        isAuthenticated: !!tokens,
        signIn: handleSignIn,
        signUp: handleSignUp,
        signOut: handleSignOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return ctx
}
