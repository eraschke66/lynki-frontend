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
import { CourseDetailPage, KnowledgeGardenPage } from "@/features/courses";
import { StudyPlanPage } from "@/features/study-plan";
import { SettingsPage } from "@/features/settings";
import { AdminPage } from "@/features/admin/AdminPage";

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
        path="/course/:courseId/study-plan"
        element={
          <ProtectedRoute>
            <StudyPlanPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/course/:courseId/garden"
        element={
          <ProtectedRoute>
            <KnowledgeGardenPage />
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
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
