import { Routes, Route, Navigate } from "react-router-dom";
import {
  LandingPage,
  LoginForm,
  SignupForm,
  ProtectedRoute,
  AuthCallback,
} from "@/features/auth";
import { DocumentsPage } from "@/features/documents";
import { CourseStudyPage } from "@/features/study";
import { Dashboard } from "@/features/dashboard";

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
        path="/study/:courseId"
        element={
          <ProtectedRoute>
            <CourseStudyPage />
          </ProtectedRoute>
        }
      />
      {/* Legacy quiz routes removed — BKT adaptive study replaces static quizzes */}
      <Route path="/quizzes" element={<Navigate to="/documents" replace />} />
      <Route path="/quiz/*" element={<Navigate to="/documents" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
