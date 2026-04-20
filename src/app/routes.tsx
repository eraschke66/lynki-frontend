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
import { TopicQuizPage } from "@/features/topic-quiz";
import { StudyPlanPage } from "@/features/study-plan";
import { SettingsPage } from "@/features/settings";
import { AdminPage } from "@/features/admin/AdminPage";
import { PricingPage } from "@/features/subscription/components/PricingPage";
import { SubscriptionSuccess } from "@/features/subscription/components/SubscriptionSuccess";
import { PrivacyPolicyPage, TermsOfServicePage, CookiePolicyPage } from "@/features/legal";

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
        path="/course/:courseId/topic-quiz/:topicId"
        element={
          <ProtectedRoute>
            <TopicQuizPage />
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
      <Route path="/pricing" element={<PricingPage />} />
      <Route
        path="/subscription/success"
        element={
          <ProtectedRoute>
            <SubscriptionSuccess />
          </ProtectedRoute>
        }
      />
      <Route path="/privacy" element={<PrivacyPolicyPage />} />
      <Route path="/terms" element={<TermsOfServicePage />} />
      <Route path="/cookies" element={<CookiePolicyPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
