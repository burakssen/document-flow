import { BrowserRouter, Navigate, Route, Routes } from "react-router"

import { AppLayout } from "@/layouts/app-layout"

import { LoginPage } from "@/pages/login-page"
import { SignupPage } from "@/pages/signup-page"
import { DocumentUploadPage } from "@/pages/document-upload-page"
import { NotFoundPage } from "@/pages/not-found-page"

import { useAuth } from "@/features/auth/auth-context"

function RequireAuth({ children }: { children: import("react").ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()

  // Don't render protected content while an auth request is in flight.
  if (isLoading) {
    return null
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Protected application routes */}
        <Route
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="/documents/upload" replace />} />
          <Route path="/documents/upload" element={<DocumentUploadPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
