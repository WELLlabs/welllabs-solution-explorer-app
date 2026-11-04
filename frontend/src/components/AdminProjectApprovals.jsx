import React, { useState, useEffect, useRef } from 'react';
import api from '@/utils/api';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icons in bundled Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const LAYER_OPTIONS = [
  {
    id: 'bgg_sites',
    label: 'City wide BGG projects (Sites)',
    badge: 'Recommended',
    description:
      'Publishes directly to the live Citywide BGG Projects interactive map layer. Will appear under its specific category (Lakes, Parks, Stormdrains, or Campuses) with popups, catchment impact, and specs.',
  },
  {
    id: 'existing_interventions',
    label: 'Existing Interventions',
    badge: 'City Pipeline',
    description:
      'Publishes to the "What\'s happening in the city" existing municipal interventions layer across Bengaluru.',
  },
];

const TYPE_ICONS = {
  lake: { icon: '🌊', label: 'Lake Interventions', color: 'text-blue-700 bg-blue-50 border-blue-200' },
  park: { icon: '🌳', label: 'Parks & Green Spaces', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  campus: { icon: '🏛️', label: 'Institutional Campuses', color: 'text-amber-700 bg-amber-50 border-amber-200' },
  stormdrain: { icon: '🛤️', label: 'Stormdrains & Drainage', color: 'text-slate-700 bg-slate-100 border-slate-300' },
  other: { icon: '💡', label: 'Other BGG Solution', color: 'text-purple-700 bg-purple-50 border-purple-200' },
};

export default function AdminProjectApprovals() {
  const [submissions, setSubmissions] = useState([]);
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending_review');
  const [searchTerm, setSearchTerm] = useState('');

  // Selected Submission for FULL-PAGE view (no popup modal)
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  // Approval form state
  const [targetLayer, setTargetLayer] = useState('bgg_sites');
  const [adminNotes, setAdminNotes] = useState('');
  const [actionBusy, setActionBusy] = useState(false);
  const [actionNotice, setActionNotice] = useState(null);
  const [flashNotice, setFlashNotice] = useState(null);

  // Suggestion Modal state
  const [showSuggestModal, setShowSuggestModal] = useState(false);
  const [suggestionText, setSuggestionText] = useState('');

  // Leaflet map reference in full-page view
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (searchTerm) params.search = searchTerm;

      const { data } = await api.get('/project-submissions/admin', { params });
      if (data.success) {
        setSubmissions(data.submissions || []);
        if (data.counts) setCounts(data.counts);

        // Keep selected submission updated if already open
        if (selectedSubmission) {
          const updated = (data.submissions || []).find((s) => s._id === selectedSubmission._id);
          if (updated) setSelectedSubmission(updated);
        }
      }
    } catch (err) {
      console.error('Failed to load project submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [statusFilter]);

  // Leaflet Map in Full-Page Detail View
  useEffect(() => {
    if (!selectedSubmission || !mapContainerRef.current) return;

    const lat = parseFloat(selectedSubmission.latitude);
    const lng = parseFloat(selectedSubmission.longitude);

    if (!isNaN(lat) && !isNaN(lng)) {
      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current).setView([lat, lng], 14);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map);

        L.marker([lat, lng])
          .addTo(map)
          .bindPopup(`<b>${selectedSubmission.name}</b><br>${selectedSubmission.type}`)
          .openPopup();

        mapInstanceRef.current = map;
      } else {
        mapInstanceRef.current.setView([lat, lng], 14);
        mapInstanceRef.current.invalidateSize();
      }
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [selectedSubmission]);

  const handleOpenDetail = (sub) => {
    setSelectedSubmission(sub);
    setTargetLayer(sub.assignedLayer || 'bgg_sites');
    setAdminNotes(sub.adminNotes || '');
    setActionNotice(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToList = () => {
    setSelectedSubmission(null);
    setActionNotice(null);
    fetchSubmissions();
  };

  const handleApprove = async () => {
    if (!selectedSubmission) return;
    setActionBusy(true);
    setActionNotice(null);
    try {
      const projectName = selectedSubmission.name;
      const targetLayerLabel =
        targetLayer === 'bgg_sites' ? 'City wide BGG projects (Sites)' : 'Existing Interventions';

      const { data } = await api.post(`/project-submissions/admin/${selectedSubmission._id}/approve`, {
        targetLayer,
      });

      if (data.success) {
        // Remove the project from showing in the active review view
        setSelectedSubmission(null);

        // Flash message shown on top of the list view
        setFlashNotice({
          type: 'success',
          title: 'Project Accepted & Published!',
          text: `"${projectName}" has been accepted and published to the "${targetLayerLabel}" layer. It has been removed from the pending review queue.`,
        });

        // Refresh submissions list
        fetchSubmissions();
      }
    } catch (err) {
      setActionNotice({ type: 'error', text: err.response?.data?.message || 'Acceptance failed' });
    } finally {
      setActionBusy(false);
    }
  };

  const handleReject = async () => {
    if (!selectedSubmission) return;
    setActionBusy(true);
    setActionNotice(null);
    try {
      const projectName = selectedSubmission.name;
      const { data } = await api.post(`/project-submissions/admin/${selectedSubmission._id}/reject`, {
        reason: 'Rejected by administrator',
      });

      if (data.success) {
        // Remove the project from showing
        setSelectedSubmission(null);

        setFlashNotice({
          type: 'info',
          title: 'Project Rejected',
          text: `"${projectName}" has been rejected and removed from the pending review queue.`,
        });

        fetchSubmissions();
      }
    } catch (err) {
      setActionNotice({ type: 'error', text: err.response?.data?.message || 'Rejection failed' });
    } finally {
      setActionBusy(false);
    }
  };

  const handleSendSuggestion = async () => {
    if (!selectedSubmission || !suggestionText.trim()) return;
    setActionBusy(true);
    setActionNotice(null);
    try {
      const projectName = selectedSubmission.name;
      const { data } = await api.post(`/project-submissions/admin/${selectedSubmission._id}/suggest`, {
        suggestion: suggestionText.trim(),
      });

      if (data.success) {
        setSelectedSubmission(null);
        setShowSuggestModal(false);
        setSuggestionText('');

        setFlashNotice({
          type: 'info',
          title: 'Suggestion Sent',
          text: `Suggestion sent to consultant for "${projectName}". The consultant can now update and resubmit the project.`,
        });

        fetchSubmissions();
      }
    } catch (err) {
      setActionNotice({ type: 'error', text: err.response?.data?.message || 'Failed to send suggestion' });
    } finally {
      setActionBusy(false);
    }
  };

  // =========================================================================
  // VIEW 1: FULL-PAGE DETAILED PROJECT REVIEW WORKSPACE (NO POPUP)
  // =========================================================================
  if (selectedSubmission) {
    const isApproved = selectedSubmission.status === 'approved';
    const isRejected = selectedSubmission.status === 'rejected';
    const isChangesRequested = selectedSubmission.status === 'changes_requested';
    const typeInfo = TYPE_ICONS[selectedSubmission.type] || TYPE_ICONS.other;

    return (
      <div className="w-full text-left font-sans animate-fade-in space-y-6">
        {/* Top Sticky Navigation Bar */}
        <div className="bg-white rounded-2xl border border-[#C8D7BC] p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBackToList}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#E5ECE0] hover:bg-[#d8e4d2] text-[#1F2A24] text-xs font-bold transition-colors cursor-pointer border border-[#C8D7BC]"
            >
              <span>←</span>
              <span>Back to all submissions</span>
            </button>
            <div className="h-4 w-px bg-slate-300 hidden sm:block" />
            <span className="text-xs text-[#6E6455] hidden md:inline">
              Submission ID: <strong className="font-mono text-[#1F2A24]">{selectedSubmission._id}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {selectedSubmission.updatedAfterSuggestion && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-900 border border-blue-300 flex items-center gap-1.5">
                <span>🔄</span>
                <span>Updated per suggestion</span>
              </span>
            )}

            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                isApproved
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : isRejected
                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                  : isChangesRequested
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-slate-100 text-slate-800 border border-slate-300'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isApproved
                    ? 'bg-emerald-600'
                    : isRejected
                    ? 'bg-rose-600'
                    : isChangesRequested
                    ? 'bg-amber-500 animate-pulse'
                    : 'bg-slate-500'
                }`}
              />
              {isApproved
                ? 'Published to Map'
                : isRejected
                ? 'Not Published (Rejected)'
                : isChangesRequested
                ? 'Changes Suggested (Waiting on Consultant)'
                : selectedSubmission.updatedAfterSuggestion
                ? 'Updated per Suggestion (Ready for Review)'
                : 'Not Published (Pending Review)'}
            </span>

            {isApproved && selectedSubmission.assignedLayer && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#347745]/15 text-[#347745] border border-[#347745]/30">
                Layer: {selectedSubmission.assignedLayer === 'bgg_sites' ? 'City-Wide BGG' : 'Existing Interventions'}
              </span>
            )}
          </div>
        </div>

        {/* Action / Notification Banner */}
        {actionNotice && (
          <div
            className={`p-4 rounded-2xl text-xs sm:text-sm font-semibold flex items-center justify-between ${
              actionNotice.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
                : 'bg-rose-50 text-rose-900 border border-rose-300'
            }`}
          >
            <span>{actionNotice.text}</span>
            <button
              type="button"
              onClick={() => setActionNotice(null)}
              className="text-xs font-bold uppercase underline cursor-pointer ml-3"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Updated per Suggestion Alert Card */}
        {selectedSubmission.updatedAfterSuggestion && (
          <div className="bg-blue-50 border-2 border-blue-300 rounded-2xl p-5 shadow-xs text-left space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">🔄</span>
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900">
                Project Updated as per Suggestion
              </h3>
            </div>
            {selectedSubmission.suggestion && (
              <p className="text-xs text-slate-700 m-0 leading-relaxed">
                <strong>Admin's Previous Suggestion:</strong> "{selectedSubmission.suggestion}"
              </p>
            )}
            {selectedSubmission.updateNote && (
              <p className="text-xs text-blue-950 m-0 leading-relaxed font-semibold">
                <strong>Consultant Note:</strong> "{selectedSubmission.updateNote}"
              </p>
            )}
          </div>
        )}

        {/* Project Header Banner */}
        <div className="bg-white rounded-2xl border border-[#C8D7BC] p-6 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${typeInfo.color}`}>
                  {typeInfo.icon} {typeInfo.label}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  Stage: {selectedSubmission.current_stage || 'Proposed'}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  Zone: {selectedSubmission.bbmp_zone || 'Bengaluru'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1F2A24] tracking-tight">
                {selectedSubmission.name}
              </h1>
              <p className="text-xs sm:text-sm text-[#6E6455] mt-1.5 flex items-center gap-2 flex-wrap">
                <span>📍 Ward: <strong>{selectedSubmission.ward || 'Bengaluru'}</strong></span>
                <span>•</span>
                <span>Watershed: <strong>{selectedSubmission.watershed || 'Micro-catchment TBD'}</strong></span>
                <span>•</span>
                <span>Submitted: <strong>{new Date(selectedSubmission.createdAt).toLocaleString()}</strong></span>
              </p>
            </div>

            <div className="flex flex-wrap lg:flex-col gap-2 shrink-0 lg:text-right">
              <div className="bg-[#F4F6F2] px-4 py-2 rounded-xl border border-[#C8D7BC]">
                <div className="text-[10.5px] uppercase font-bold text-[#6E6455]">Estimated Budget</div>
                <div className="text-lg font-black text-[#347745]">{selectedSubmission.total_cost || 'TBD'}</div>
              </div>
              <div className="bg-[#F4F6F2] px-4 py-2 rounded-xl border border-[#C8D7BC]">
                <div className="text-[10.5px] uppercase font-bold text-[#6E6455]">Planned Timeline</div>
                <div className="text-xs font-bold text-[#1F2A24]">
                  {selectedSubmission.project_start_year} – {selectedSubmission.project_end_year || 'Ongoing'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FULL PAGE 2-COLUMN WORKSPACE GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ================================================================= */}
          {/* LEFT COLUMN: PROJECT DETAILS & TECHNICAL SPECIFICATIONS (7 cols)  */}
          {/* ================================================================= */}
          <div className="lg:col-span-7 space-y-6">
            {/* 1. Submitter / Consultant Credentials */}
            <div className="bg-white rounded-2xl border border-[#C8D7BC] p-5 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#6E6455] mb-3 flex items-center gap-1.5">
                <span>👤 Consultant / Proposer Information</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block">Consultant Name</span>
                  <span className="font-bold text-[#1F2A24] text-sm block mt-0.5">
                    {selectedSubmission.submitterName || 'Registered Consultant'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Organization / Agency</span>
                  <span className="font-bold text-[#1F2A24] text-sm block mt-0.5">
                    {selectedSubmission.submitterOrg || selectedSubmission.implementing_agency || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Email Address</span>
                  <a
                    href={`mailto:${selectedSubmission.submitterEmail}`}
                    className="font-medium text-[#3669A9] hover:underline block mt-0.5"
                  >
                    {selectedSubmission.submitterEmail}
                  </a>
                </div>
                <div>
                  <span className="text-slate-500 block">Platform Role</span>
                  <span className="font-bold text-[#347745] block mt-0.5">
                    {selectedSubmission.submitterRole || 'Consultant'}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Problem Statement / Pre-intervention Issues */}
            <div className="bg-white rounded-2xl border border-[#C8D7BC] p-5 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-rose-700 mb-2.5 flex items-center gap-1.5">
                <span>⚠️ Pre-Intervention Challenges & Flooding Issues</span>
              </h3>
              <p className="text-xs sm:text-sm text-[#1F2A24] leading-relaxed bg-rose-50/50 p-4 rounded-xl border border-rose-200">
                {selectedSubmission.pre_intervention_issues ||
                  'No specific pre-intervention issue notes were logged in this submission.'}
              </p>
            </div>

            {/* 3. Detailed Scope & Design Context */}
            <div className="bg-white rounded-2xl border border-[#C8D7BC] p-5 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#1F2A24] mb-2.5 flex items-center gap-1.5">
                <span>📋 Project Description & Design Context</span>
              </h3>
              <p className="text-xs sm:text-sm text-[#1F2A24] leading-relaxed bg-[#F4F6F2] p-4 rounded-xl border border-[#C8D7BC]/70 whitespace-pre-wrap">
                {selectedSubmission.context || 'No extended context provided.'}
              </p>
            </div>

            {/* 4. Hydrological & Climate Impact Metrics */}
            <div className="bg-white rounded-2xl border border-[#C8D7BC] p-5 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#347745] mb-3 flex items-center gap-1.5">
                <span>💧 Verified Hydrological & Environmental Impact</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200">
                  <span className="font-bold text-emerald-900 block mb-1">Site-Level Water Retention</span>
                  <p className="text-xs text-emerald-800 leading-relaxed m-0">
                    {selectedSubmission.site_level_impact || 'Impact calculation not specified'}
                  </p>
                </div>
                <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200">
                  <span className="font-bold text-emerald-900 block mb-1">Subcatchment Runoff Reduction</span>
                  <p className="text-xs text-emerald-800 leading-relaxed m-0">
                    {selectedSubmission.subcatchment_level_impact || 'Subcatchment impact calculation not specified'}
                  </p>
                </div>
              </div>
            </div>

            {/* 5. Implementation Stakeholders */}
            <div className="bg-white rounded-2xl border border-[#C8D7BC] p-5 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#6E6455] mb-3 flex items-center gap-1.5">
                <span>🤝 Stakeholders & Implementation Partners</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block">Lead Agency:</span>
                  <span className="font-bold text-[#1F2A24] text-xs block mt-0.5">
                    {selectedSubmission.implementing_agency || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Partners & Donors:</span>
                  <span className="font-bold text-[#1F2A24] text-xs block mt-0.5">
                    {selectedSubmission.implementation_partners || '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* 6. Media & Cover Photos */}
            {selectedSubmission.image_url && (
              <div className="bg-white rounded-2xl border border-[#C8D7BC] p-5 shadow-xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#6E6455] mb-3">
                  📷 Submitted Photo / Design Layout
                </h3>
                <div className="rounded-xl overflow-hidden border border-[#C8D7BC] bg-slate-100">
                  <img
                    src={selectedSubmission.image_url}
                    alt={selectedSubmission.name}
                    className="w-full h-auto max-h-96 object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
                <a
                  href={selectedSubmission.image_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block text-xs text-[#3669A9] hover:underline font-semibold"
                >
                  Open Full Resolution Media in New Tab ↗
                </a>
              </div>
            )}
          </div>

          {/* ================================================================= */}
          {/* RIGHT COLUMN: MAP VERIFICATION & APPROVAL / ASSIGNMENT (5 cols)   */}
          {/* ================================================================= */}
          <div className="lg:col-span-5 space-y-6">
            {/* 1. Geospatial Map Verification */}
            <div className="bg-white rounded-2xl border border-[#C8D7BC] p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#1F2A24]">
                  🗺️ Map Coordinate Verification
                </h3>
                <span className="font-mono text-xs text-[#3669A9] font-bold">
                  {selectedSubmission.latitude?.toFixed(5)}° N, {selectedSubmission.longitude?.toFixed(5)}° E
                </span>
              </div>

              <div className="rounded-xl overflow-hidden border border-[#C8D7BC] shadow-inner mb-3">
                <div ref={mapContainerRef} className="h-64 sm:h-72 w-full z-0" />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs bg-[#F4F6F2] p-3 rounded-xl border border-[#C8D7BC]/70">
                <div>
                  <span className="text-slate-500 block">Ward:</span>
                  <span className="font-bold text-[#1F2A24]">{selectedSubmission.ward || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">BBMP Zone:</span>
                  <span className="font-bold text-[#1F2A24]">{selectedSubmission.bbmp_zone || '—'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-500 block">Watershed:</span>
                  <span className="font-bold text-[#1F2A24]">{selectedSubmission.watershed || '—'}</span>
                </div>
              </div>
            </div>

            {/* 2. LAYER ASSIGNMENT & DECISION CONTROL PANEL */}
            {isApproved ? (
              <div className="bg-emerald-50 rounded-2xl border-2 border-emerald-500/40 p-5 shadow-xs space-y-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                    Publication Status: Published
                  </span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-emerald-200 space-y-3">
                  <div>
                    <span className="text-[10.5px] uppercase font-bold text-slate-500 block">Published Layer</span>
                    <span className="text-sm font-extrabold text-[#1F2A24]">
                      {selectedSubmission.assignedLayer === 'bgg_sites'
                        ? 'City wide BGG projects (Sites)'
                        : 'Existing Interventions'}
                    </span>
                  </div>

                  {selectedSubmission.approvedSiteId && (
                    <div>
                      <span className="text-[10.5px] uppercase font-bold text-slate-500 block">Live Site Reference ID</span>
                      <span className="font-mono text-xs font-bold text-[#347745] bg-[#E5ECE0] px-2.5 py-1 rounded border border-[#C8D7BC] inline-block mt-0.5">
                        {selectedSubmission.approvedSiteId}
                      </span>
                    </div>
                  )}

                  <div>
                    <span className="text-[10.5px] uppercase font-bold text-slate-500 block">Approved & Published On</span>
                    <span className="text-xs font-medium text-[#1F2A24]">
                      {new Date(selectedSubmission.reviewedAt || selectedSubmission.updatedAt).toLocaleString()}
                    </span>
                  </div>

                  {selectedSubmission.adminNotes && (
                    <div className="pt-2 border-t border-slate-100">
                      <span className="text-[10.5px] uppercase font-bold text-slate-500 block">Admin Verification Note</span>
                      <p className="text-xs text-[#1F2A24] mt-1 leading-relaxed bg-[#F4F6F2] p-2.5 rounded-lg border border-[#C8D7BC]">
                        {selectedSubmission.adminNotes}
                      </p>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleBackToList}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#347745] hover:bg-[#285d35] text-white text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>←</span>
                  <span>Back to Submissions List</span>
                </button>
              </div>
            ) : isRejected ? (
              <div className="bg-rose-50 rounded-2xl border-2 border-rose-400/40 p-5 shadow-xs space-y-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-800">
                    Publication Status: Not Published (Rejected)
                  </span>
                </div>

                <p className="text-xs text-rose-900 leading-relaxed bg-white p-3 rounded-xl border border-rose-200">
                  This submission is not published on any map layer. Revision feedback has been transmitted to the consultant.
                </p>

                {selectedSubmission.adminNotes && (
                  <div className="bg-white p-3 rounded-xl border border-rose-200 text-xs">
                    <span className="font-bold text-slate-600 block mb-1">Feedback Provided:</span>
                    <p className="text-xs text-[#1F2A24] m-0 leading-relaxed">{selectedSubmission.adminNotes}</p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleBackToList}
                  className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-50 text-[#1F2A24] border border-[#C8D7BC] text-xs font-bold transition-colors cursor-pointer"
                >
                  ← Back to Submissions List
                </button>
              </div>
            ) : isChangesRequested ? (
              <div className="bg-amber-50 rounded-2xl border-2 border-amber-300 p-5 shadow-xs space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl">💡</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                    Changes Suggested to Consultant
                  </span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-amber-200 space-y-2">
                  <span className="text-[10.5px] uppercase font-bold text-amber-900 block">Current Suggestion:</span>
                  <p className="text-xs text-slate-800 m-0 leading-relaxed font-medium">{selectedSubmission.suggestion}</p>
                </div>

                <p className="text-xs text-amber-900 m-0">
                  Waiting for the consultant to review the suggestion, update project details, and resubmit.
                </p>

                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    disabled={actionBusy}
                    onClick={handleApprove}
                    className="w-full py-3 px-4 rounded-xl bg-[#347745] hover:bg-[#285d35] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    Accept
                  </button>

                  <button
                    type="button"
                    disabled={actionBusy}
                    onClick={() => setShowSuggestModal(true)}
                    className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    <span>💡</span>
                    <span>Suggest an Improvement</span>
                  </button>

                  <button
                    type="button"
                    disabled={actionBusy}
                    onClick={handleReject}
                    className="w-full py-2.5 px-4 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Reject
                  </button>

                  <button
                    type="button"
                    onClick={handleBackToList}
                    className="w-full py-2 px-4 rounded-xl bg-white border border-[#C8D7BC] text-[#1F2A24] text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    ← Back to Submissions List
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-[#EBF2E7] rounded-2xl border-2 border-[#347745]/30 p-5 shadow-sm space-y-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-[#347745] text-white px-2.5 py-0.5 rounded-full inline-block mb-1.5">
                    Administrative Action
                  </span>
                  <h3 className="text-base font-extrabold text-[#1F2A24]">
                    Assign Map Layer & Decision
                  </h3>
                  <p className="text-xs text-[#6E6455] mt-1 leading-relaxed">
                    Choose which city layer this project will be deployed to once you accept it:
                  </p>
                </div>

                {/* Layer Selection Radio Cards */}
                <div className="space-y-2.5">
                  {LAYER_OPTIONS.map((layer) => {
                    const isChecked = targetLayer === layer.id;
                    return (
                      <label
                        key={layer.id}
                        className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-white border-[#347745] ring-2 ring-[#347745]/20 shadow-xs'
                            : 'bg-white/70 border-[#C8D7BC] hover:bg-white'
                        }`}
                      >
                        <input
                          type="radio"
                          name="targetLayer"
                          value={layer.id}
                          checked={isChecked}
                          onChange={(e) => setTargetLayer(e.target.value)}
                          className="mt-1 text-[#347745] focus:ring-[#347745] cursor-pointer"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-[#1F2A24]">{layer.label}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#347745]/10 text-[#347745]">
                              {layer.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#6E6455] leading-relaxed mt-1 m-0">
                            {layer.description}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>

                {/* Action Buttons: Accept, Suggest an Improvement, Reject */}
                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    disabled={actionBusy}
                    onClick={handleApprove}
                    className="w-full py-3 px-4 rounded-xl bg-[#347745] hover:bg-[#285d35] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {actionBusy ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Processing…</span>
                      </>
                    ) : (
                      <span>Accept</span>
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={actionBusy}
                    onClick={() => setShowSuggestModal(true)}
                    className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    <span>💡</span>
                    <span>Suggest an Improvement</span>
                  </button>

                  <button
                    type="button"
                    disabled={actionBusy}
                    onClick={handleReject}
                    className="w-full py-2.5 px-4 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Suggestion Modal Dialog */}
        {showSuggestModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
            <div className="bg-white rounded-2xl border border-[#C8D7BC] shadow-2xl max-w-lg w-full p-6 text-left space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">💡</span>
                  <h3 className="text-base font-extrabold text-[#1F2A24]">
                    Suggest an Improvement
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowSuggestModal(false);
                    setSuggestionText('');
                  }}
                  className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-[#6E6455] leading-relaxed m-0">
                Write suggestions for <strong>{selectedSubmission.name}</strong>. The consultant will receive this feedback in their portal, update the project details accordingly, and resubmit it for your review.
              </p>

              <div>
                <label className="block text-xs font-bold text-[#1F2A24] uppercase tracking-wider mb-1.5">
                  Improvement Suggestion *
                </label>
                <textarea
                  rows={4}
                  autoFocus
                  value={suggestionText}
                  onChange={(e) => setSuggestionText(e.target.value)}
                  placeholder="e.g. Please adjust the coordinates to align with the BBMP lake boundary, and provide estimated water retention metrics..."
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#F4F6F2] border border-[#C8D7BC] text-[#1F2A24] focus:outline-none focus:bg-white focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  disabled={actionBusy}
                  onClick={() => {
                    setShowSuggestModal(false);
                    setSuggestionText('');
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={actionBusy || !suggestionText.trim()}
                  onClick={handleSendSuggestion}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {actionBusy ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Sending…</span>
                    </>
                  ) : (
                    <span>Send Suggestion</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: SUBMISSIONS LIST TABLE VIEW
  // =========================================================================
  return (
    <div className="w-full text-left font-sans animate-fade-in">
      {/* Top Banner & Stats Header */}
      <div className="bg-white rounded-2xl border border-[#C8D7BC] p-6 shadow-sm mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#1F2A24] tracking-tight">
            Consultant Project Approvals
          </h2>
          <p className="text-xs sm:text-sm text-[#6E6455] mt-1">
            Review proposed Blue-Green-Grey projects uploaded by consultants, inspect all submitted coordinates and hydrology specs, and assign them to the city-wide map layer.
          </p>
        </div>

        {/* Counter Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="px-3.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>{counts.pending} Pending Review</span>
          </div>
          {(counts.changes_requested > 0) && (
            <div className="px-3.5 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-bold flex items-center gap-1.5">
              <span>💡 {counts.changes_requested} Changes Suggested</span>
            </div>
          )}
          <div className="px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            <span>✓ {counts.approved} Published</span>
          </div>
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold">
            <span>Total: {counts.total}</span>
          </div>
        </div>
      </div>

      {/* Action / Success Flash Notice Banner */}
      {flashNotice && (
        <div
          className={`mb-5 p-4 rounded-2xl border text-xs sm:text-sm flex items-start justify-between gap-3 shadow-xs ${
            flashNotice.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
              : 'bg-blue-50 border-blue-300 text-blue-950'
          }`}
        >
          <div className="flex items-start gap-2.5">
            <span className="text-xl leading-none">{flashNotice.type === 'success' ? '🎉' : 'ℹ️'}</span>
            <div>
              <div className="font-extrabold">{flashNotice.title}</div>
              <div className="text-xs mt-0.5 text-slate-700 leading-relaxed">{flashNotice.text}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setFlashNotice(null)}
            className="text-xs font-bold uppercase underline cursor-pointer text-[#6E6455] hover:text-[#1F2A24] shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-1 bg-[#E5ECE0] p-1 rounded-xl border border-[#C8D7BC] overflow-x-auto">
          {[
            { id: 'pending_review', label: `Pending Review (${counts.pending || 0})` },
            { id: 'changes_requested', label: `Changes Suggested (${counts.changes_requested || 0})` },
            { id: 'approved', label: `Published (${counts.approved || 0})` },
            { id: 'rejected', label: `Rejected (${counts.rejected || 0})` },
            { id: 'all', label: `All Submissions (${counts.total || 0})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-white text-[#1F2A24] shadow-xs'
                  : 'text-[#6E6455] hover:text-[#1F2A24]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchSubmissions();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Search by project or consultant…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3.5 py-1.5 rounded-xl bg-white border border-[#C8D7BC] text-xs text-[#1F2A24] focus:outline-none focus:ring-2 focus:ring-[#3669A9] w-full sm:w-64"
          />
          <button
            type="submit"
            className="px-3.5 py-1.5 bg-[#3669A9] text-white text-xs font-bold rounded-xl hover:bg-[#2d568c] transition-colors cursor-pointer shrink-0"
          >
            Search
          </button>
        </form>
      </div>

      {/* Table of Submissions */}
      <div className="bg-white rounded-2xl border border-[#C8D7BC] shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-sm text-[#6E6455]">
            <div className="w-8 h-8 border-3 border-[#C8D7BC] border-t-[#3669A9] rounded-full animate-spin mx-auto mb-2" />
            Loading project submissions...
          </div>
        ) : submissions.length === 0 ? (
          <div className="py-16 text-center text-sm text-[#6E6455]">
            No project submissions found under this filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F4F6F2] border-b border-[#C8D7BC] text-[#6E6455] uppercase tracking-wider font-bold text-[10.5px]">
                  <th className="py-3 px-4">Project Name & Type</th>
                  <th className="py-3 px-4">Consultant Submitter</th>
                  <th className="py-3 px-4">Ward / Coordinates</th>
                  <th className="py-3 px-4">Est. Cost</th>
                  <th className="py-3 px-4">Submitted</th>
                  <th className="py-3 px-4">Publication Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {submissions.map((sub) => {
                  const isApproved = sub.status === 'approved';
                  const isRejected = sub.status === 'rejected';
                  const isChangesRequested = sub.status === 'changes_requested';
                  const typeObj = TYPE_ICONS[sub.type] || TYPE_ICONS.other;

                  return (
                    <tr key={sub._id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-[#1F2A24] text-sm">{sub.name}</span>
                          {sub.updatedAfterSuggestion && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-300">
                              <span>🔄</span>
                              <span>Updated per suggestion</span>
                            </span>
                          )}
                        </div>
                        <div className="inline-block mt-0.5 text-[10.5px] uppercase font-bold px-2 py-0.5 rounded-md bg-[#3669A9]/10 text-[#3669A9]">
                          {typeObj.icon} {typeObj.label}
                        </div>
                        {sub.updatedAfterSuggestion && sub.updateNote && (
                          <div className="text-[11px] text-blue-800 italic mt-0.5 max-w-xs truncate" title={sub.updateNote}>
                            "{sub.updateNote}"
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#1F2A24]">{sub.submitterName || 'Consultant'}</div>
                        <div className="text-[11px] text-[#6E6455]">{sub.submitterOrg || sub.submitterEmail}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-800 font-medium">{sub.ward || 'Bengaluru'} ({sub.bbmp_zone || 'Zone'})</div>
                        <div className="font-mono text-[11px] text-slate-500">
                          {sub.latitude?.toFixed(4)}° N, {sub.longitude?.toFixed(4)}° E
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {sub.total_cost || '—'}
                      </td>
                      <td className="py-3 px-4 text-[#6E6455]">
                        {new Date(sub.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        {isApproved ? (
                          <div className="flex flex-col items-start gap-1">
                            <span className="px-2.5 py-1 rounded-full text-[10.5px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                              Published
                            </span>
                            <span className="text-[11px] font-semibold text-[#347745]">
                              {sub.assignedLayer === 'bgg_sites' ? 'City-Wide BGG Layer' : 'Existing Interventions'}
                            </span>
                            {sub.approvedSiteId && (
                              <span className="text-[10px] font-mono text-[#6E6455] bg-[#F4F6F2] px-1.5 py-0.5 rounded border border-[#C8D7BC]/70">
                                ID: {sub.approvedSiteId}
                              </span>
                            )}
                          </div>
                        ) : isRejected ? (
                          <div className="flex flex-col items-start gap-1">
                            <span className="px-2.5 py-1 rounded-full text-[10.5px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 bg-rose-100 text-rose-800 border border-rose-300">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                              Not Published
                            </span>
                            <span className="text-[10.5px] text-rose-700 font-medium">
                              Rejected
                            </span>
                          </div>
                        ) : isChangesRequested ? (
                          <div className="flex flex-col items-start gap-1">
                            <span className="px-2.5 py-1 rounded-full text-[10.5px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 bg-amber-100 text-amber-900 border border-amber-300">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              Changes Suggested
                            </span>
                            <span className="text-[10.5px] text-amber-900 font-medium">
                              Waiting on Consultant
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-start gap-1">
                            <span className="px-2.5 py-1 rounded-full text-[10.5px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 bg-slate-100 text-slate-800 border border-slate-300">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                              Not Published
                            </span>
                            <span className={`text-[10.5px] font-medium ${sub.updatedAfterSuggestion ? 'text-blue-700 font-bold' : 'text-[#6E6455]'}`}>
                              {sub.updatedAfterSuggestion ? 'Updated (Ready for Review)' : 'Pending Review'}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {isApproved ? (
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(sub)}
                            className="px-3.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5"
                          >
                            <span>View Published Specs</span>
                            <span>→</span>
                          </button>
                        ) : isRejected ? (
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(sub)}
                            className="px-3.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5"
                          >
                            <span>View Details</span>
                            <span>→</span>
                          </button>
                        ) : isChangesRequested ? (
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(sub)}
                            className="px-3.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5"
                          >
                            <span>View Suggestion</span>
                            <span>→</span>
                          </button>
                        ) : sub.updatedAfterSuggestion ? (
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(sub)}
                            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
                          >
                            <span>Review Updated Project</span>
                            <span>→</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(sub)}
                            className="px-3.5 py-1.5 rounded-lg bg-[#3669A9] hover:bg-[#2d568c] text-white text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5"
                          >
                            <span>Review & Publish</span>
                            <span>→</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
