import { Navigate, Route, Routes } from "react-router-dom";
import {
  ProtectedRoute,
  LoginPage,
  RegisterPage,
  useAuth,
} from "@/features/auth";
import { GeneratePage } from "@/features/generation";
import { HomePage, NotFoundPage, LandingPage } from "@/features/home";
import { ProjectsPage } from "@/features/projects";

const BYPASS_AUTH = import.meta.env.VITE_BYPASS_AUTH === "true";

export const AppRoutes = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (!BYPASS_AUTH && isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Routes>
        <Route
          path="/login"
          element={
            !isAuthenticated ? <LoginPage /> : <Navigate to="/home" replace />
          }
        />
        <Route
          path="/register"
          element={
            !isAuthenticated ? (
              <RegisterPage />
            ) : (
              <Navigate to="/home" replace />
            )
          }
        />
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects"
          element={
            <ProtectedRoute>
              <ProjectsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <GeneratePage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
};
