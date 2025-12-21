

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
import { WebSocketProvider } from '@/contexts/WebSocketContext';

// Utility to handle chunk load errors by reloading the page
const lazyWithReload = (fn: () => Promise<any>) => React.lazy(() => {
  return fn().catch(error => {
    // Check if it's a chunk load error
    if (error.message.includes('Failed to fetch dynamically imported module') ||
      error.message.includes('Importing a module script failed')) {
      window.location.reload();
    }
    throw error;
  });
});

// Lazily loaded view components
const LoginView = lazyWithReload(() => import('@/views/LoginView'));
const ProfileView = lazyWithReload(() => import('@/views/ProfileView'));
const AIToolsView = lazyWithReload(() => import('@/views/AIToolsView'));
const ReportsView = lazyWithReload(() => import('@/views/ReportsView'));
const ScheduleView = lazyWithReload(() => import('@/views/ScheduleView'));
const ChatView = lazyWithReload(() => import('@/views/ChatView'));
const LiveView = lazyWithReload(() => import('@/views/LiveView'));
const DashboardView = lazyWithReload(() => import('@/views/DashboardView'));
const ProjectsView = lazyWithReload(() => import('@/views/ProjectsView'));
const ProjectDetailsView = lazyWithReload(() => import('@/views/ProjectDetailsView'));
const TasksView = lazyWithReload(() => import('@/views/TasksView'));
const TeamView = lazyWithReload(() => import('@/views/TeamView'));
const TimesheetsView = lazyWithReload(() => import('@/views/TimesheetsView'));
const DocumentsView = lazyWithReload(() => import('@/views/DocumentsView'));
const SafetyView = lazyWithReload(() => import('@/views/SafetyView'));
const EquipmentView = lazyWithReload(() => import('@/views/EquipmentView'));
const FinancialsView = lazyWithReload(() => import('@/views/FinancialsView'));
const TeamChatView = lazyWithReload(() => import('@/views/TeamChatView'));
const MLInsightsView = lazyWithReload(() => import('@/views/MLInsightsView'));
const ComplianceView = lazyWithReload(() => import('@/views/ComplianceView'));
const ProcurementView = lazyWithReload(() => import('@/views/ProcurementView'));
const CustomDashView = lazyWithReload(() => import('@/views/CustomDashView'));
const WorkforceView = lazyWithReload(() => import('@/views/WorkforceView'));
const IntegrationsView = lazyWithReload(() => import('@/views/IntegrationsView'));
const SecurityView = lazyWithReload(() => import('@/views/SecurityView'));
const ExecutiveView = lazyWithReload(() => import('@/views/ExecutiveView'));
const MapView = lazyWithReload(() => import('@/views/MapView'));
const ClientsView = lazyWithReload(() => import('@/views/ClientsView'));
const InventoryView = lazyWithReload(() => import('@/views/InventoryView'));
const DevSandboxView = lazyWithReload(() => import('@/views/DevSandboxView'));
const MarketplaceView = lazyWithReload(() => import('@/views/MarketplaceView'));
const ImagineView = lazyWithReload(() => import('@/views/ImagineView'));
const MyDesktopView = lazyWithReload(() => import('@/views/MyDesktopView'));
const LiveProjectMapView = lazyWithReload(() => import('@/views/LiveProjectMapView'));
const ProjectLaunchpadView = lazyWithReload(() => import('@/views/ProjectLaunchpadView'));
const TenantManagementView = lazyWithReload(() => import('@/views/TenantManagementView'));
const TenantAnalyticsView = lazyWithReload(() => import('@/views/TenantAnalyticsView'));
const ResourceOptimizationView = lazyWithReload(() => import('@/views/ResourceOptimizationView'));
const DailyLogsView = lazyWithReload(() => import('@/views/DailyLogsView'));
const RFIView = lazyWithReload(() => import('@/views/RFIView'));

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
              {page === Page.DAILY_LOGS && <DailyLogsView />}
              {page === Page.RFI && <RFIView />}
              {page === Page.CLIENT_PORTAL && <ClientPortalView />}
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
        <NotificationProvider>
          <TenantProvider>
            <ProjectProvider>
              <WebSocketProvider>
                <Suspense fallback={<div className="flex items-center justify-center h-screen bg-gray-50">Loading BuildPro...</div>}>
                  <AuthenticatedApp />
                </Suspense>
              </WebSocketProvider>
            </ProjectProvider>
          </TenantProvider>
        </NotificationProvider>
      </AuthProvider>
    </ToastProvider>
  );
};

export default App;
