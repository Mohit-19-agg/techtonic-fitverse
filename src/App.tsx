import { useState } from 'react';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { AuthPage } from '@/pages/AuthPage';
import { OnboardingPage } from '@/pages/OnboardingPage';
import { AppShell, type Page } from '@/components/AppShell';
import { DashboardPage } from '@/pages/DashboardPage';
import { ExerciseLibraryPage } from '@/pages/ExerciseLibraryPage';
import { FormCoachPage } from '@/pages/FormCoachPage';
import { MyFitnessPage } from '@/pages/MyFitnessPage';
import { CollegeFitnessPage } from '@/pages/CollegeFitnessPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { BMIPage } from '@/pages/BMIPage';
import { PrivacyPage } from '@/pages/PrivacyPage';
import { NotificationsPage } from '@/pages/NotificationsPage';

function AppContent() {
  const { session, profile, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0e1a]">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-sm">Loading FITVERSE...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <AuthPage />;
  }

  // Check if onboarding is complete (college + branch are required fields)
  const onboardingComplete = profile?.college && profile?.branch && profile?.fitness_goal;

  if (!onboardingComplete) {
    return <OnboardingPage />;
  }

  return (
    <AppShell currentPage={currentPage} onNavigate={setCurrentPage}>
      {currentPage === 'dashboard' && <DashboardPage onNavigate={setCurrentPage} />}
      {currentPage === 'exercises' && <ExerciseLibraryPage onNavigate={setCurrentPage} />}
      {currentPage === 'form-coach' && <FormCoachPage onNavigate={setCurrentPage} />}
      {currentPage === 'my-fitness' && <MyFitnessPage />}
      {currentPage === 'college' && <CollegeFitnessPage onNavigate={setCurrentPage} />}
      {currentPage === 'profile' && <ProfilePage onNavigate={setCurrentPage} />}
      {currentPage === 'bmi' && <BMIPage />}
      {currentPage === 'privacy' && <PrivacyPage onNavigate={setCurrentPage} />}
      {currentPage === 'notifications' && <NotificationsPage onNavigate={setCurrentPage} />}
    </AppShell>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
