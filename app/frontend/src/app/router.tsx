import { BrowserRouter, Navigate, Route, Routes } from "react-router"

import { AppLayout } from "@/layouts/app-layout"

import { LoginPage } from "@/pages/login-page"
import { DocumentUploadPage } from "@/pages/document-upload-page"
import { NotFoundPage } from "@/pages/not-found-page"

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected application routes */}
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/login" replace />} />

          <Route path="/documents/upload" element={<DocumentUploadPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
