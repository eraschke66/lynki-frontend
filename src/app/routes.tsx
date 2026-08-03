import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/features/auth/components/ProtectedRoute";
import { RouteLoader } from "@/components/garden/RouteLoader";

/**
 * Every screen below is loaded on demand.
 *
 * Two rules keep this working:
 *  1. Import the component file directly, never the feature barrel
 *     (`@/features/auth`). A barrel re-exports its whole feature, which drags
 *     unrelated screens into the same chunk.
 *  2. Never convert one of these back to a static import. ProtectedRoute is
 *     the only eager one, because it guards the others.
 */

// Public — must stay small, no app engine.
const LandingPage = lazy(() =>
  import("@/features/auth/components/LandingPage").then((m) => ({ default: m.LandingPage })),
);
const PricingPage = lazy(() =>
  import("@/features/subscription/components/PricingPage").then((m) => ({ default: m.PricingPage })),
);
const PrivacyPolicyPage = lazy(() =>
  import("@/features/legal/PrivacyPolicyPage").then((m) => ({ default: m.PrivacyPolicyPage })),
);
const TermsOfServicePage = lazy(() =>
  import("@/features/legal/TermsOfServicePage").then((m) => ({ default: m.TermsOfServicePage })),
);
const CookiePolicyPage = lazy(() =>
  import("@/features/legal/CookiePolicyPage").then((m) => ({ default: m.CookiePolicyPage })),
);

// Auth / callback.
const LoginForm = lazy(() =>
  import("@/features/auth/components/LoginForm").then((m) => ({ default: m.LoginForm })),
);
const SignupForm = lazy(() =>
  import("@/features/auth/components/SignupForm").then((m) => ({ default: m.SignupForm })),
);
const AuthCallback = lazy(() =>
  import("@/features/auth/components/AuthCallback").then((m) => ({ default: m.AuthCallback })),
);

// Dashboard + Knowledge Garden.
const Dashboard = lazy(() =>
  import("@/features/dashboard/components/Dashboard").then((m) => ({ default: m.Dashboard })),
);
const KnowledgeGardenPage = lazy(() =>
  import("@/features/courses/components/KnowledgeGardenPage").then((m) => ({
    default: m.KnowledgeGardenPage,
  })),
);
const CourseDetailPage = lazy(() =>
  import("@/features/courses/components/CourseDetailPage").then((m) => ({
    default: m.CourseDetailPage,
  })),
);

// Quiz-taking flow — question view + results.
const TestPage = lazy(() =>
  import("@/features/test/components/TestPage").then((m) => ({ default: m.TestPage })),
);
const AttemptResultsPage = lazy(() =>
  import("@/features/test/components/AttemptResultsPage").then((m) => ({
    default: m.AttemptResultsPage,
  })),
);
const TopicQuizPage = lazy(() =>
  import("@/features/topic-quiz/components/TopicQuizPage").then((m) => ({
    default: m.TopicQuizPage,
  })),
);
const TendingFlowPage = lazy(() =>
  import("@/features/tending/pages/TendingFlowPage").then((m) => ({ default: m.TendingFlowPage })),
);

// Study plan — pulls react-markdown + remark-gfm, so it must stay out of entry.
const StudyPlanPage = lazy(() =>
  import("@/features/study-plan/components/StudyPlanPage").then((m) => ({
    default: m.StudyPlanPage,
  })),
);

// Materials / upload.
const DocumentsPage = lazy(() =>
  import("@/features/documents/components/DocumentsPage").then((m) => ({
    default: m.DocumentsPage,
  })),
);

const SettingsPage = lazy(() =>
  import("@/features/settings/components/SettingsPage").then((m) => ({ default: m.SettingsPage })),
);
const SubscriptionSuccess = lazy(() =>
  import("@/features/subscription/components/SubscriptionSuccess").then((m) => ({
    default: m.SubscriptionSuccess,
  })),
);

// Admin — admin-only, must never ship in the main bundle.
const AdminPage = lazy(() =>
  import("@/features/admin/AdminPage").then((m) => ({ default: m.AdminPage })),
);

export function AppRoutes() {
  return (
    <Suspense fallback={<RouteLoader />}>
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
          path="/attempts/:attemptId"
          element={
            <ProtectedRoute>
              <AttemptResultsPage />
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
          path="/course/:courseId/tend/:topicId"
          element={
            <ProtectedRoute>
              <TendingFlowPage />
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
    </Suspense>
  );
}
