import { Routes, Route, Navigate } from "react-router-dom";
import {
  LandingPage,
  LoginForm,
  SignupForm,
  ProtectedRoute,
  AuthCallback,
} from "@/features/auth";
import { DocumentsPage } from "@/features/documents";
import { TestPage } from "@/features/test";
import { Dashboard } from "@/features/dashboard";
import { CourseDetailPage } from "@/features/courses";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginForm />} />
      <Route path="/signup" element={<SignupForm />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/documents"
        element={
          <ProtectedRoute>
            <DocumentsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/course/:courseId"
        element={
          <ProtectedRoute>
            <CourseDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/test/:courseId"
        element={
          <ProtectedRoute>
            <TestPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
