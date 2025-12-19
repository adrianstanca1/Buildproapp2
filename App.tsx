

import React, { useState, lazy, Suspense } from 'react';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import ErrorBoundary from '@/components/ErrorBoundary';
import { Page } from '@/types';
import { ProjectProvider } from '@/contexts/ProjectContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { TenantProvider } from '@/contexts/TenantContext';
import ToastProvider from '@/contexts/ToastContext';
import { NotificationProvider } from '@/contexts/NotificationContext';

// Lazily loaded view components
const LoginView = lazy(() => import('@/views/LoginView'));
const ProfileView = lazy(() => import('@/views/ProfileView'));
const AIToolsView = lazy(() => import('@/views/AIToolsView'));
const ReportsView = lazy(() => import('@/views/ReportsView'));
const ScheduleView = lazy(() => import('@/views/ScheduleView'));
const ChatView = lazy(() => import('@/views/ChatView'));
const LiveView = lazy(() => import('@/views/LiveView'));
const DashboardView = lazy(() => import('@/views/DashboardView'));
const ProjectsView = lazy(() => import('@/views/ProjectsView'));
const ProjectDetailsView = lazy(() => import('@/views/ProjectDetailsView'));
const TasksView = lazy(() => import('@/views/TasksView'));
const TeamView = lazy(() => import('@/views/TeamView'));
const TimesheetsView = lazy(() => import('@/views/TimesheetsView'));
const DocumentsView = lazy(() => import('@/views/DocumentsView'));
const SafetyView = lazy(() => import('@/views/SafetyView'));
const EquipmentView = lazy(() => import('@/views/EquipmentView'));
const FinancialsView = lazy(() => import('@/views/FinancialsView'));
const TeamChatView = lazy(() => import('@/views/TeamChatView'));
const MLInsightsView = lazy(() => import('@/views/MLInsightsView'));
const ComplianceView = lazy(() => import('@/views/ComplianceView'));
const ProcurementView = lazy(() => import('@/views/ProcurementView'));
const CustomDashView = lazy(() => import('@/views/CustomDashView'));
const WorkforceView = lazy(() => import('@/views/WorkforceView'));
const IntegrationsView = lazy(() => import('@/views/IntegrationsView'));
const SecurityView = lazy(() => import('@/views/SecurityView'));
const ExecutiveView = lazy(() => import('@/views/ExecutiveView'));
const MapView = lazy(() => import('@/views/MapView'));
const ClientsView = lazy(() => import('@/views/ClientsView'));
const InventoryView = lazy(() => import('@/views/InventoryView'));
const DevSandboxView = lazy(() => import('@/views/DevSandboxView'));
const MarketplaceView = lazy(() => import('@/views/MarketplaceView'));
const ImagineView = lazy(() => import('@/views/ImagineView'));
const MyDesktopView = lazy(() => import('@/views/MyDesktopView'));
const LiveProjectMapView = lazy(() => import('@/views/LiveProjectMapView'));
const ProjectLaunchpadView = lazy(() => import('@/views/ProjectLaunchpadView'));
const TenantManagementView = lazy(() => import('@/views/TenantManagementView'));
const TenantAnalyticsView = lazy(() => import('@/views/TenantAnalyticsView'));
const ResourceOptimizationView = lazy(() => import('@/views/ResourceOptimizationView'));

const AuthenticatedApp: React.FC = () => {
  const [page, setPage] = useState<Page>(Page.LOGIN);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const { user } = useAuth();

  // Shared State for Marketplace Apps
  const [installedApps, setInstalledApps] = useState<string[]>(['Procore', 'Slack', 'QuickBooks']);

  const toggleAppInstall = (appName: string) => {
    if (installedApps.includes(appName)) {
      setInstalledApps(prev => prev.filter(n => n !== appName));
    } else {
      setInstalledApps(prev => [...prev, appName]);
    }
  };

  const handleProjectSelect = (projectId: string) => {
    setSelectedProjectId(projectId);
    setPage(Page.PROJECT_DETAILS);
  };

  // If not authenticated, show Login
  if (!user) {
    return <LoginView setPage={setPage} />;
  }

  return (
    <div className="flex h-screen bg-zinc-50 text-zinc-900 overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar currentPage={page} setPage={setPage} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full relative overflow-hidden">
        <TopBar setPage={setPage} />

        <main className="flex-1 overflow-y-auto bg-zinc-50/50 relative">
          <ErrorBoundary>
            <Suspense fallback={<div className="p-4 text-center">Loading...</div>}>
              {page === Page.DASHBOARD && <DashboardView setPage={setPage} />}
              {page === Page.EXECUTIVE && <ExecutiveView />}
              {page === Page.LIVE_PROJECT_MAP && <LiveProjectMapView />}
              {page === Page.PROJECT_LAUNCHPAD && <ProjectLaunchpadView onClose={() => setPage(Page.PROJECTS)} onViewProject={handleProjectSelect} />}
              {page === Page.PROJECTS && <ProjectsView onProjectSelect={handleProjectSelect} setPage={setPage} />}
              {page === Page.PROJECT_DETAILS && (
                <ProjectDetailsView
                  projectId={selectedProjectId}
                  onBack={() => setPage(Page.PROJECTS)}
                />
              )}
              {page === Page.TASKS && <TasksView />}
              {page === Page.TEAM && <TeamView />}
              {page === Page.TIMESHEETS && <TimesheetsView />}
              {page === Page.DOCUMENTS && <DocumentsView />}
              {page === Page.SAFETY && <SafetyView />}
              {page === Page.EQUIPMENT && <EquipmentView />}
              {page === Page.FINANCIALS && <FinancialsView />}
              {page === Page.TEAM_CHAT && <TeamChatView />}
              {page === Page.AI_TOOLS && <AIToolsView setPage={setPage} />}
              {page === Page.ML_INSIGHTS && <MLInsightsView />}
              {page === Page.COMPLIANCE && <ComplianceView />}
              {page === Page.PROCUREMENT && <ProcurementView />}
              {page === Page.SCHEDULE && <ScheduleView />}
              {page === Page.CUSTOM_DASH && <CustomDashView />}
              {page === Page.REPORTS && <ReportsView />}
              {page === Page.WORKFORCE && <WorkforceView />}
              {page === Page.INTEGRATIONS && <IntegrationsView />}
              {page === Page.SECURITY && <SecurityView />}
              {page === Page.PROFILE && <ProfileView />}
              {page === Page.MAP_VIEW && <MapView />}
              {page === Page.CLIENTS && <ClientsView />}
              {page === Page.INVENTORY && <InventoryView />}
              {page === Page.CHAT && <ChatView setPage={setPage} />}
              {page === Page.LIVE && <LiveView setPage={setPage} />}
              {page === Page.DEV_SANDBOX && <DevSandboxView />}
              {page === Page.MARKETPLACE && (
                <MarketplaceView
                  installedApps={installedApps}
                  toggleInstall={toggleAppInstall}
                />
              )}
              {page === Page.IMAGINE && <ImagineView />}
              {page === Page.MY_DESKTOP && (
                <MyDesktopView
                  installedApps={installedApps}
                  setPage={setPage}
                />
              )}
              {page === Page.TENANT_MANAGEMENT && <TenantManagementView />}
              {page === Page.TENANT_ANALYTICS && <TenantAnalyticsView />}
              {page === Page.RESOURCE_OPTIMIZATION && <ResourceOptimizationView />}
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ToastProvider>
      <AuthProvider>
        <ProjectProvider>
          <TenantProvider>
            <NotificationProvider>
              <Suspense fallback={<div className="flex items-center justify-center h-screen bg-gray-50">Loading BuildPro...</div>}>
                <AuthenticatedApp />
              </Suspense>
            </NotificationProvider>
          </TenantProvider>
        </ProjectProvider>
      </AuthProvider>
    </ToastProvider>
  );
};

export default App;
