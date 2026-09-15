import React, { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Spinner from './components/common/Spinner';
import {
  fetchProfile,
  selectIsAuthenticated,
  selectAuthInitializing,
} from './store/slices/authSlice';

// Auth pages stay eagerly loaded — they're the entry point for signed-out
// users, so code-splitting them would only add a network round trip before
// the very first meaningful paint.
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import NotFoundPage from './pages/NotFoundPage';

// Everything behind auth is lazy-loaded so the initial bundle stays small.
// Each of these becomes its own chunk fetched on first navigation.
const DashboardPage = lazy(() => import('./pages/Dashborad/DashboardPage'));
const DocumentListPage = lazy(() => import('./pages/Documents/DocumentListPage'));
const DocumentDetailPage = lazy(() => import('./pages/Documents/DocumentDetailsPage'));
const FlashcardsListPage = lazy(() => import('./pages/Flashcards/FlashcardsListPage'));
const FlashcardPage = lazy(() => import('./pages/Flashcards/FlashcardPage'));
const QuizTakePage = lazy(() => import('./pages/Quizzes/QuizTakePage'));
const QuizResultPage = lazy(() => import('./pages/Quizzes/QuizResultPage'));
const ProfilePage = lazy(() => import('./pages/Profile/ProfilePage'));

const FullScreenLoader = () => (
  <div className="flex items-center justify-center h-screen">
    <Spinner size="lg" />
  </div>
);

const App = () => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const initializing = useSelector(selectAuthInitializing);

  useEffect(() => {
    // Only revalidate when a cached session exists. For a genuinely
    // signed-out visitor this would be a guaranteed 401 on every page load.
    if (isAuthenticated) {
      dispatch(fetchProfile());
    }
    // Intentionally runs once on mount: this is a boot-time revalidation,
    // not something that should re-fire on every auth state change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  if (initializing) {
    return <FullScreenLoader />;
  }

  return (
    <Router>
      <Suspense fallback={<FullScreenLoader />}>
        <Routes>
          <Route
            path="/"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/documents" element={<DocumentListPage />} />
            <Route path="/documents/:id" element={<DocumentDetailPage />} />
            <Route path="/flashcards" element={<FlashcardsListPage />} />
            <Route path="/documents/:id/flashcards" element={<FlashcardPage />} />
            <Route path="/quizzes/:quizId" element={<QuizTakePage />} />
            <Route path="/quizzes/:quizId/results" element={<QuizResultPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </Router>
  );
};

export default App;
