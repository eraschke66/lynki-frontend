import { Routes, Route, Navigate } from "react-router-dom";
import {
  LandingPage,
  LoginForm,
  SignupForm,
  ProtectedRoute,
  AuthCallback,
} from "@/features/auth";
import { QuizzesPage, QuizTaking, QuizResults } from "@/features/quiz";
import { DocumentsPage } from "@/features/documents";
import { DocumentStudyPage } from "@/features/study";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginForm />} />
      <Route path="/signup" element={<SignupForm />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route
        path="/quizzes"
        element={
          <ProtectedRoute>
            <QuizzesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/quiz/:quizId"
        element={
          <ProtectedRoute>
            <QuizTaking />
          </ProtectedRoute>
        }
      />
      <Route
        path="/quiz/:quizId/results"
        element={
          <ProtectedRoute>
            <QuizResults />
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
        path="/study/:documentId"
        element={
          <ProtectedRoute>
            <DocumentStudyPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
