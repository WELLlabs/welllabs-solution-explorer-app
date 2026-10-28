import React, { useContext, useEffect, useState } from 'react';
import { Navigate, useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '@/context/AuthContext';
import Header from '@/components/Header';
import PendingApproval from '@/components/PendingApproval';
import BggIntroduction from '@/components/BggIntroduction';
import CaseStudies from '@/components/CaseStudies';
import Interventions from '@/components/Interventions';
import DataLayersView from '@/components/DataLayersView';
import NewProjectsView from '@/components/NewProjectsView';
import AdminPanel from '@/components/AdminPanel';

const PAGES_WITH_BACK = ['casestudy', 'interventions', 'newprojects', 'usermanagement'];

const spinnerClass = 'w-10 h-10 border-[3px] border-slate-200 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4';
export const FIELD_PERMISSIONS = {
  'Admin': ['ALL_FIELDS'],
  'WELL Labs1': ['Name of the Project', 'Location', 'Ward No', 'GBA Corporation', 'Surface Area', 'Implementation Start Date', 'Implementation Completion Date', 'Proposed By', 'Proposal Date', 'Other Stakeholders', 'Project Assets', 'Project Consultant', 'DPR', 'Diagrams', 'Cost', 'Impact', 'Donor Name', 'Donor Asset', 'Donor Support'],
  'WELL Labs2': ['Name of the Project', 'Location', 'Ward No', 'GBA Corporation', 'Surface Area', 'Implementation Start Date', 'Implementation Completion Date', 'Proposed By', 'Proposal Date', 'Other Stakeholders', 'Project Assets', 'Project Consultant', 'DPR', 'Diagrams', 'Cost', 'Impact', 'Donor Name', 'Donor Asset', 'Donor Support'],
  'Consultant': ['Name of the Project', 'Location', 'Ward No', 'GBA Corporation', 'Surface Area', 'Implementation Start Date', 'Implementation Completion Date', 'Proposed By', 'Proposal Date', 'Other Stakeholders', 'Project Assets', 'Project Consultant', 'DPR', 'Diagrams', 'Cost', 'Impact', 'Donor Name', 'Donor Asset', 'Donor Support'],
  'GBA': ['Name of the Project', 'Location', 'Ward No', 'GBA Corporation', 'Surface Area', 'Implementation Start Date', 'Implementation Completion Date', 'Proposed By', 'Proposal Date', 'Other Stakeholders', 'Project Assets', 'Project Consultant', 'DPR', 'Diagrams', 'Cost', 'Impact', 'Donor Name', 'Donor Asset', 'Donor Support'],
  'Donor': ['Name of the Project', 'Location', 'Ward No', 'GBA Corporation', 'Surface Area', 'Implementation Start Date', 'Implementation Completion Date', 'Proposed By', 'Proposal Date', 'Other Stakeholders', 'Project Assets', 'Project Consultant', 'DPR', 'Diagrams', 'Cost', 'Impact', 'Donor Name', 'Donor Asset', 'Donor Support'],
  'Funder': ['Name of the Project', 'Location', 'Ward No', 'GBA Corporation', 'Surface Area', 'Implementation Start Date', 'Implementation Completion Date', 'Proposed By', 'Proposal Date', 'Other Stakeholders', 'Project Assets', 'Project Consultant', 'DPR', 'Diagrams', 'Cost', 'Impact', 'Donor Name', 'Donor Asset', 'Donor Support'],
  'Citizen': ['Name of the Project', 'Location', 'Ward No', 'GBA Corporation', 'Surface Area', 'Implementation Start Date', 'Implementation Completion Date', 'Proposed By', 'Proposal Date', 'Other Stakeholders', 'Project Assets', 'Project Consultant', 'DPR', 'Diagrams', 'Cost', 'Impact', 'Donor Name', 'Donor Asset', 'Donor Support']
};

const Dashboard = () => {
  const { user, loading: authLoading, logout } = useContext(AuthContext);

  const SHOW_PLATFORM_TAB = true;

  // Custom Workspace Tabs System driven by URL path name
  const { activeTab: urlActiveTab } = useParams();
  const navigate = useNavigate();
  const activeTab = urlActiveTab || (user ? 'dashboard' : 'home');

  // If user is already authenticated and visits /home or presses back to landing page,
  // automatically redirect them to /dashboard so they cannot go back to pre-login screens
  useEffect(() => {
    if (!authLoading && user && (!urlActiveTab || urlActiveTab === 'home')) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, authLoading, urlActiveTab, navigate]);

  // Shocking news linking state
  const [highlightedCaseTitle, setHighlightedCaseTitle] = useState(null);

  // Platform Permission Matrix Simulator State
  const [simulatedRole, setSimulatedRole] = useState(user?.role || 'WELL Labs1');

  const handleNavigateToCase = (title) => {
    setHighlightedCaseTitle(title);
    navigate('/casestudy');
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center py-[60px] px-5">
          <div className={spinnerClass}></div>
          <p>Loading session...</p>
        </div>
      </div>
    );
  }

  const handleBack = () => {
    // react-router keeps the in-app history position in history.state.idx
    if ((window.history.state?.idx ?? 0) > 0) {
      navigate(-1);
    } else {
      navigate(user ? '/dashboard' : '/home');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate('/home', { replace: true });
    }
  };

  return (
    <div
      className={`min-h-screen text-ink font-[Inter,-apple-system,BlinkMacSystemFont,'Segoe_UI',sans-serif] ${activeTab === 'home' ? 'bg-[#c9d8bd]' : 'bg-page'}`}
    >
      {/* 1. Header component */}
      <Header user={user} onLogout={handleLogout} />

      <main>
        {/* PENDING VIEW */}
        {user?.role === 'Pending' && (
          <PendingApproval />
        )}

        {user?.role !== 'Pending' && PAGES_WITH_BACK.includes(activeTab) && (
          <div className="max-w-[1400px] mx-auto w-full px-3 sm:px-6 lg:px-8 pt-4 text-left">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5" />
                <path d="M12 19l-7-7 7-7" />
              </svg>
              <span>Back</span>
            </button>
          </div>
        )}

        {/* 1. HOME VIEW */}
        {user?.role !== 'Pending' && activeTab === 'home' && (
          <BggIntroduction
            onNavigateToCase={handleNavigateToCase}
            onSetActiveTab={(tab) => navigate('/' + tab)}
          />
        )}

        {/* 2. DASHBOARD VIEW (consists of DataLayersView as the main map interface) */}
        {user?.role !== 'Pending' && activeTab === 'dashboard' && (
          <DataLayersView />
        )}

        {/* 3. CASE STUDY VIEW */}
        {user?.role !== 'Pending' && activeTab === 'casestudy' && (
          <CaseStudies
            highlightedCaseTitle={highlightedCaseTitle}
            clearHighlight={() => setHighlightedCaseTitle(null)}
          />
        )}

        {/* 4. INTERVENTIONS VIEW */}
        {user?.role !== 'Pending' && activeTab === 'interventions' && (
          <Interventions />
        )}

        {/* 5. NEW PROJECTS VIEW */}
        {user?.role !== 'Pending' && activeTab === 'newprojects' && (
          <NewProjectsView />
        )}

        {/* 8. ADMIN PANEL */}
        {user?.role === 'Admin' && activeTab === 'usermanagement' && (
          <AdminPanel />
        )}
      </main>
    </div>
  );
};

export default Dashboard;