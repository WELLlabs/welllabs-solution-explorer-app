import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '@/context/AuthContext';
import api from '@/utils/api';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icon paths in bundled Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const PROJECT_TYPES = [
  { id: 'lake', label: 'Lake Interventions', color: '#3b82f6', icon: '🌊', desc: 'Rejuvenation, bund restoration, wetlands, silt traps' },
  { id: 'park', label: 'Parks & Green Spaces', color: '#22c55e', icon: '🌳', desc: 'Bioswales, rain gardens, permeable paths, tree trenches' },
  { id: 'campus', label: 'Institutional Campuses', color: '#f59e0b', icon: '🏛️', desc: 'Rooftop RWH, detention basins, recharge wells on public campuses' },
  { id: 'stormdrain', label: 'Stormdrains & Drainage', color: '#64748b', icon: '🛤️', desc: 'Canal naturalization, roadside bioswales, culvert expansion' },
  { id: 'other', label: 'Other BGG Solution', color: '#8b5cf6', icon: '💡', desc: 'Integrated flood mitigation or customized pilot' },
];

const STAGES = [
  'Proposed',
  'Planning & Feasibility',
  'Detailed Project Report (DPR)',
  'Tender / Procurement',
  'Implementation Ongoing',
  'Completed',
];

const ZONES = [
  'Central',
  'East',
  'West',
  'North',
  'South',
  'Mahadevapura',
  'Bommanahalli',
  'R.R. Nagar',
  'Dasarahalli',
  'Yelahanka',
];

const INITIAL_FORM = {
  name: '',
  type: 'park',
  latitude: '',
  longitude: '',
  ward: '',
  bbmp_zone: 'East',
  watershed: '',
  implementing_agency: '',
  implementation_partners: '',
  project_start_year: new Date().getFullYear().toString(),
  project_end_year: (new Date().getFullYear() + 1).toString(),
  current_stage: 'Proposed',
  total_cost: '',
  pre_intervention_issues: '',
  context: '',
  site_level_impact: '',
  subcatchment_level_impact: '',
  image_url: '',
};

export default function UploadProject() {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('form'); // 'form' | 'submissions'
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successSubmission, setSuccessSubmission] = useState(null);

  // Edit / Suggestion revision state
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [editingSuggestion, setEditingSuggestion] = useState('');
  const [updateNote, setUpdateNote] = useState('');
  const [viewingProject, setViewingProject] = useState(null);

  // My Submissions list state
  const [mySubmissions, setMySubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  // Map state
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const [mapOpen, setMapOpen] = useState(false);

  // Auto-fill agency with consultant info if available
  useEffect(() => {
    if (user && !formData.implementing_agency) {
      setFormData((prev) => ({
        ...prev,
        implementing_agency: user.organization || user.name || '',
      }));
    }
  }, [user]);

  // Fetch my submissions when switching to 'submissions' tab
  const fetchMySubmissions = async () => {
    setLoadingSubmissions(true);
    try {
      const { data } = await api.get('/project-submissions/my');
      if (data.success) {
        setMySubmissions(data.submissions || []);
      }
    } catch (err) {
      console.warn('Failed to fetch my submissions:', err);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'submissions') {
      fetchMySubmissions();
    }
  }, [activeTab]);

  // Leaflet map initialization
  useEffect(() => {
    if (!mapOpen || !mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const initialLat = parseFloat(formData.latitude) || 12.9716;
      const initialLng = parseFloat(formData.longitude) || 77.5946;

      const map = L.map(mapContainerRef.current).setView([initialLat, initialLng], 12);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      mapInstanceRef.current = map;

      // Click handler to pick coordinates
      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        const roundedLat = parseFloat(lat.toFixed(6));
        const roundedLng = parseFloat(lng.toFixed(6));

        setFormData((prev) => ({
          ...prev,
          latitude: roundedLat,
          longitude: roundedLng,
        }));

        if (markerRef.current) {
          markerRef.current.setLatLng([roundedLat, roundedLng]);
        } else {
          markerRef.current = L.marker([roundedLat, roundedLng]).addTo(map);
        }
      });

      if (formData.latitude && formData.longitude) {
        markerRef.current = L.marker([initialLat, initialLng]).addTo(map);
      }
    } else {
      mapInstanceRef.current.invalidateSize();
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, [mapOpen]);

  // Update marker position when inputs change
  useEffect(() => {
    const lat = parseFloat(formData.latitude);
    const lng = parseFloat(formData.longitude);
    if (!isNaN(lat) && !isNaN(lng) && mapInstanceRef.current) {
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        markerRef.current = L.marker([lat, lng]).addTo(mapInstanceRef.current);
      }
      mapInstanceRef.current.panTo([lat, lng]);
    }
  }, [formData.latitude, formData.longitude]);

  // Current Geolocation trigger
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lng = parseFloat(pos.coords.longitude.toFixed(6));
        setFormData((prev) => ({ ...prev, latitude: lat, longitude: lng }));
        setError('');
        if (!mapOpen) setMapOpen(true);
      },
      (err) => {
        setError(`Could not retrieve location: ${err.message}`);
      },
      { timeout: 10000 }
    );
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditProject = (sub) => {
    // If the project was rejected, editing is blocked; show read-only details
    if (sub.status === 'rejected') {
      setViewingProject(sub);
      return;
    }

    setEditingProjectId(sub._id);
    setEditingSuggestion(sub.suggestion || '');
    setUpdateNote(sub.updateNote || '');
    setFormData({
      name: sub.name || '',
      type: sub.type || 'park',
      latitude: sub.latitude || '',
      longitude: sub.longitude || '',
      ward: sub.ward || '',
      bbmp_zone: sub.bbmp_zone || 'East',
      watershed: sub.watershed || '',
      implementing_agency: sub.implementing_agency || '',
      implementation_partners: sub.implementation_partners || '',
      project_start_year: sub.project_start_year || '',
      project_end_year: sub.project_end_year || '',
      current_stage: sub.current_stage || 'Proposed',
      total_cost: sub.total_cost || '',
      pre_intervention_issues: sub.pre_intervention_issues || '',
      context: sub.context || '',
      site_level_impact: sub.site_level_impact || '',
      subcatchment_level_impact: sub.subcatchment_level_impact || '',
      image_url: sub.image_url || '',
    });
    setActiveTab('form');
    setSuccessSubmission(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingProjectId(null);
    setEditingSuggestion('');
    setUpdateNote('');
    setFormData({
      ...INITIAL_FORM,
      implementing_agency: user?.organization || user?.name || '',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Please provide a project name.');
      return;
    }

    const lat = parseFloat(formData.latitude);
    const lng = parseFloat(formData.longitude);
    if (isNaN(lat) || isNaN(lng) || lat < 12.0 || lat > 14.0 || lng < 76.5 || lng > 78.5) {
      setError('Please provide valid Bengaluru latitude (approx 12.7 to 13.3) and longitude (approx 77.3 to 77.8).');
      return;
    }

    setSubmitting(true);
    try {
      if (editingProjectId) {
        const { data } = await api.put(`/project-submissions/${editingProjectId}`, {
          ...formData,
          updateNote,
        });
        if (data.success) {
          setSuccessSubmission(data.submission);
          setEditingProjectId(null);
          setEditingSuggestion('');
          setUpdateNote('');
          setFormData({
            ...INITIAL_FORM,
            implementing_agency: user?.organization || user?.name || '',
          });
          fetchMySubmissions();
        } else {
          setError(data.message || 'Failed to update project');
        }
      } else {
        const { data } = await api.post('/project-submissions', formData);
        if (data.success) {
          setSuccessSubmission(data.submission);
          setFormData({
            ...INITIAL_FORM,
            implementing_agency: user?.organization || user?.name || '',
          });
          fetchMySubmissions();
        } else {
          setError(data.message || 'Failed to register project');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error connecting to server.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-3 sm:px-6 py-6 font-sans">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-[#C8D7BC] p-6 shadow-sm mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#347745]/10 text-[#347745] border border-[#347745]/20 mb-2">
              <span>📐 Consultant Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1F2A24] tracking-tight">
              Register a Project
            </h1>
            <p className="text-sm text-[#6E6455] mt-1 max-w-2xl leading-relaxed">
              Register your proposed or active Blue-Green-Grey infrastructure interventions. Once registered, the WELL Labs admin team reviews your project specifications, provides feedback or suggestions, and accepts it onto the official city-wide map layer.
            </p>
          </div>

          {/* Navigation Pill Tabs */}
          <div className="flex items-center gap-1.5 bg-[#E5ECE0] p-1.5 rounded-full border border-[#C8D7BC] self-start md:self-center shrink-0">
            <button
              type="button"
              onClick={() => {
                if (!editingProjectId) handleCancelEdit();
                setActiveTab('form');
              }}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'form'
                  ? 'bg-white text-[#1F2A24] shadow-sm'
                  : 'text-[#6E6455] hover:text-[#1F2A24]'
              }`}
            >
              {editingProjectId ? '✏️ Editing Project' : '+ Register Project'}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('submissions')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'submissions'
                  ? 'bg-white text-[#1F2A24] shadow-sm'
                  : 'text-[#6E6455] hover:text-[#1F2A24]'
              }`}
            >
              <span>My Registered Projects</span>
              {mySubmissions.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#3669A9] text-white text-[10px] flex items-center justify-center font-bold">
                  {mySubmissions.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Success Modal / Banner */}
      {successSubmission && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-6 mb-6 animate-fade-in text-left">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xl shrink-0 font-bold">
              ✓
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-emerald-900">
                Project Successfully Submitted for Review!
              </h3>
              <p className="text-sm text-emerald-800 mt-1 leading-relaxed">
                Thank you! <strong>{successSubmission.name}</strong> has been logged into the review queue. The administrators will evaluate its coordinates, catchment boundaries, and technical specs, then publish it onto the designated city-wide layer.
              </p>
              <div className="flex flex-wrap gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setSuccessSubmission(null);
                    setActiveTab('submissions');
                  }}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  View My Submissions →
                </button>
                <button
                  type="button"
                  onClick={() => setSuccessSubmission(null)}
                  className="px-4 py-2 bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Submit Another Project
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
          <span>⚠️ {error}</span>
        </div>
      )}

      {/* TAB 1: FORM */}
      {activeTab === 'form' && (
        <form onSubmit={handleSubmit} className="space-y-6 text-left">
          {/* EDITING / SUGGESTION NOTICE BANNER */}
          {editingProjectId && (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 mb-4 text-left shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">✏️</span>
                  <h3 className="text-sm font-extrabold text-amber-950">
                    Editing & Updating Project: {formData.name}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="text-xs font-bold text-amber-900 bg-white border border-amber-300 px-3 py-1 rounded-lg hover:bg-amber-100 transition-colors cursor-pointer"
                >
                  ✕ Cancel Edit
                </button>
              </div>

              {editingSuggestion && (
                <div className="bg-white p-3.5 rounded-xl border border-amber-200 text-xs">
                  <div className="font-bold text-amber-900 flex items-center gap-1.5 mb-1">
                    <span>💡 Admin's Suggestion:</span>
                  </div>
                  <p className="m-0 text-slate-800 leading-relaxed font-medium">{editingSuggestion}</p>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-amber-950 mb-1">
                  Short note for admin on changes made:
                </label>
                <input
                  type="text"
                  value={updateNote}
                  onChange={(e) => setUpdateNote(e.target.value)}
                  placeholder="e.g. Adjusted stormwater metrics and updated coordinates as suggested."
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-white border border-amber-300 text-[#1F2A24] focus:outline-none focus:ring-2 focus:ring-[#347745]"
                />
              </div>
            </div>
          )}

          {/* SECTION 1: BASIC INFORMATION */}
          <div className="bg-white rounded-2xl border border-[#C8D7BC] p-6 shadow-sm">
            <h2 className="text-base font-bold text-[#1F2A24] mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#3669A9] text-white flex items-center justify-center text-xs font-bold">1</span>
              <span>Project Identity & Classification</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1F2A24] mb-1.5">
                  Project Title *
                </label>
                <input
                  type="text"
                  required
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Sarakki Lake Eco-Restoration & Silt Trap Construction"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F4F6F2] border border-[#C8D7BC] text-sm text-[#1F2A24] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#3669A9]"
                />
              </div>

              {/* Project Type Grid */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1F2A24] mb-2">
                  Project Type (Matching City-Wide Layers) *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {PROJECT_TYPES.map((pt) => {
                    const active = formData.type === pt.id;
                    return (
                      <div
                        key={pt.id}
                        onClick={() => setFormData((prev) => ({ ...prev, type: pt.id }))}
                        className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                          active
                            ? 'border-[#3669A9] bg-[#3669A9]/5 shadow-xs'
                            : 'border-[#C8D7BC]/70 bg-white hover:border-[#3669A9]/40'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{pt.icon}</span>
                          <span className="text-xs font-bold text-[#1F2A24]">{pt.label}</span>
                        </div>
                        <p className="text-[11px] text-[#6E6455] leading-snug">{pt.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1F2A24] mb-1.5">
                  Current Project Stage
                </label>
                <select
                  name="current_stage"
                  value={formData.current_stage}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F4F6F2] border border-[#C8D7BC] text-sm text-[#1F2A24] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#3669A9]"
                >
                  {STAGES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1F2A24] mb-1.5">
                  Estimated Total Budget / Cost
                </label>
                <input
                  type="text"
                  name="total_cost"
                  value={formData.total_cost}
                  onChange={handleInputChange}
                  placeholder="e.g. ₹ 2.5 Crore or Rs 175-crore"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F4F6F2] border border-[#C8D7BC] text-sm text-[#1F2A24] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#3669A9]"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: GEOGRAPHIC LOCATION & COORDINATES */}
          <div className="bg-white rounded-2xl border border-[#C8D7BC] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h2 className="text-base font-bold text-[#1F2A24] flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#3669A9] text-white flex items-center justify-center text-xs font-bold">2</span>
                <span>Location & Coordinates (Required for Map Placement)</span>
              </h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  className="px-3 py-1.5 bg-[#E5ECE0] hover:bg-[#d6e2cf] text-[#1F2A24] text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span>📍 GPS My Location</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMapOpen(!mapOpen)}
                  className="px-3 py-1.5 bg-[#3669A9] hover:bg-[#2d568c] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span>🗺️ {mapOpen ? 'Hide Pin Map' : 'Pick on Map'}</span>
                </button>
              </div>
            </div>

            {/* Interactive Map Picker */}
            {mapOpen && (
              <div className="mb-4 rounded-xl overflow-hidden border border-[#C8D7BC] shadow-inner">
                <div className="bg-[#E5ECE0] px-3 py-2 text-xs text-[#1F2A24] flex items-center justify-between">
                  <span>Click anywhere on Bengaluru to place coordinates</span>
                  <span className="font-mono text-[11px] text-[#6E6455]">
                    {formData.latitude ? `${formData.latitude}° N, ${formData.longitude}° E` : 'No pin placed'}
                  </span>
                </div>
                <div ref={mapContainerRef} className="h-64 sm:h-80 w-full z-0" />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1F2A24] mb-1.5">
                  Latitude *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleInputChange}
                  placeholder="e.g. 12.9716"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F4F6F2] border border-[#C8D7BC] text-sm text-[#1F2A24] font-mono focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#3669A9]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1F2A24] mb-1.5">
                  Longitude *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleInputChange}
                  placeholder="e.g. 77.5946"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F4F6F2] border border-[#C8D7BC] text-sm text-[#1F2A24] font-mono focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#3669A9]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1F2A24] mb-1.5">
                  BBMP Zone / Corporation
                </label>
                <select
                  name="bbmp_zone"
                  value={formData.bbmp_zone}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F4F6F2] border border-[#C8D7BC] text-sm text-[#1F2A24] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#3669A9]"
                >
                  {ZONES.map((z) => (
                    <option key={z} value={z}>{z}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1F2A24] mb-1.5">
                  Ward Name / No.
                </label>
                <input
                  type="text"
                  name="ward"
                  value={formData.ward}
                  onChange={handleInputChange}
                  placeholder="e.g. 174 - Mahadevapura"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F4F6F2] border border-[#C8D7BC] text-sm text-[#1F2A24] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#3669A9]"
                />
              </div>

              <div className="md:col-span-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1F2A24] mb-1.5">
                  Micro-Watershed / Catchment
                </label>
                <input
                  type="text"
                  name="watershed"
                  value={formData.watershed}
                  onChange={handleInputChange}
                  placeholder="e.g. Bellandur Valley - Borewell Road Micro Watershed"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F4F6F2] border border-[#C8D7BC] text-sm text-[#1F2A24] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#3669A9]"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: TECHNICAL IMPACT & DESCRIPTION */}
          <div className="bg-white rounded-2xl border border-[#C8D7BC] p-6 shadow-sm">
            <h2 className="text-base font-bold text-[#1F2A24] mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#3669A9] text-white flex items-center justify-center text-xs font-bold">3</span>
              <span>Scope, Problems Solved & Environmental Impact</span>
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1F2A24] mb-1.5">
                  Pre-Intervention Problems & Flooding Issues
                </label>
                <textarea
                  name="pre_intervention_issues"
                  rows={2}
                  value={formData.pre_intervention_issues}
                  onChange={handleInputChange}
                  placeholder="Describe the issues: e.g. Street flooding during heavy rains, overflowing concrete stormwater drain, lack of natural infiltration..."
                  className="w-full px-3.5 py-2 rounded-xl bg-[#F4F6F2] border border-[#C8D7BC] text-sm text-[#1F2A24] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#3669A9]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1F2A24] mb-1.5">
                  Project Description & Design Context
                </label>
                <textarea
                  name="context"
                  rows={3}
                  value={formData.context}
                  onChange={handleInputChange}
                  placeholder="Describe the planned nature-based solution: e.g. Creation of 3 interconnected rain gardens with indigenous wetland species, stepped bioretention terraces..."
                  className="w-full px-3.5 py-2 rounded-xl bg-[#F4F6F2] border border-[#C8D7BC] text-sm text-[#1F2A24] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#3669A9]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#1F2A24] mb-1.5">
                    Site-Level Impact (Water Storage / Infiltration)
                  </label>
                  <input
                    type="text"
                    name="site_level_impact"
                    value={formData.site_level_impact}
                    onChange={handleInputChange}
                    placeholder="e.g. Infiltration of 4,200 KL and storage of 220 KL"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F4F6F2] border border-[#C8D7BC] text-sm text-[#1F2A24] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#3669A9]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#1F2A24] mb-1.5">
                    Subcatchment / Watershed Runoff Reduction
                  </label>
                  <input
                    type="text"
                    name="subcatchment_level_impact"
                    value={formData.subcatchment_level_impact}
                    onChange={handleInputChange}
                    placeholder="e.g. Peak discharge delayed by 25 mins, runoff reduced by 14%"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F4F6F2] border border-[#C8D7BC] text-sm text-[#1F2A24] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#3669A9]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4: STAKEHOLDERS & MEDIA */}
          <div className="bg-white rounded-2xl border border-[#C8D7BC] p-6 shadow-sm">
            <h2 className="text-base font-bold text-[#1F2A24] mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#3669A9] text-white flex items-center justify-center text-xs font-bold">4</span>
              <span>Stakeholders, Photos & Documentation</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1F2A24] mb-1.5">
                  Lead Proposer / Implementing Agency
                </label>
                <input
                  type="text"
                  name="implementing_agency"
                  value={formData.implementing_agency}
                  onChange={handleInputChange}
                  placeholder="e.g. Biome Environmental / Sensing Local / BBMP"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F4F6F2] border border-[#C8D7BC] text-sm text-[#1F2A24] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#3669A9]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1F2A24] mb-1.5">
                  Implementation Partners & Donors
                </label>
                <input
                  type="text"
                  name="implementation_partners"
                  value={formData.implementation_partners}
                  onChange={handleInputChange}
                  placeholder="e.g. BBMP Lakes Division, Local RWA, CSR Partners"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F4F6F2] border border-[#C8D7BC] text-sm text-[#1F2A24] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#3669A9]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1F2A24] mb-1.5">
                  Project Cover Image URL
                </label>
                <input
                  type="url"
                  name="image_url"
                  value={formData.image_url}
                  onChange={handleInputChange}
                  placeholder="https://example.com/site-plan-or-photo.jpg"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F4F6F2] border border-[#C8D7BC] text-sm text-[#1F2A24] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#3669A9]"
                />
              </div>
            </div>
          </div>

          {/* SUBMIT BUTTON BAR */}
          <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#C8D7BC]">
            <div className="text-xs text-[#6E6455]">
              Submitting as: <strong className="text-[#1F2A24]">{user?.name || 'Consultant'}</strong> ({user?.organization || user?.email})
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 rounded-xl bg-[#347745] hover:bg-[#285d35] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{editingProjectId ? 'Updating Project…' : 'Registering Project…'}</span>
                </>
              ) : (
                <>
                  <span>{editingProjectId ? 'Update & Resubmit Project' : 'Register Project for Admin Review'}</span>
                  <span>→</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: MY SUBMISSIONS LIST */}
      {activeTab === 'submissions' && (
        <div className="bg-white rounded-2xl border border-[#C8D7BC] p-6 shadow-sm text-left">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-[#1F2A24]">
              My Registered Projects ({mySubmissions.length})
            </h2>
            <button
              type="button"
              onClick={fetchMySubmissions}
              className="text-xs text-[#3669A9] hover:underline font-semibold cursor-pointer"
            >
              🔄 Refresh
            </button>
          </div>

          {loadingSubmissions ? (
            <div className="py-12 text-center text-sm text-[#6E6455]">
              <div className="w-8 h-8 border-3 border-[#C8D7BC] border-t-[#3669A9] rounded-full animate-spin mx-auto mb-2" />
              Loading your submissions...
            </div>
          ) : mySubmissions.length === 0 ? (
            <div className="py-12 text-center text-sm text-[#6E6455] bg-[#F4F6F2] rounded-xl border border-dashed border-[#C8D7BC]">
              <p className="font-semibold text-[#1F2A24]">No projects registered yet</p>
              <p className="text-xs text-[#6E6455] mt-1">Once you register a project, you can track its review, administrative suggestions, and layer placement status here.</p>
              <button
                type="button"
                onClick={() => {
                  handleCancelEdit();
                  setActiveTab('form');
                }}
                className="mt-3 px-4 py-2 bg-[#3669A9] text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                + Register Your First Project
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {mySubmissions.map((sub) => {
                const typeObj = PROJECT_TYPES.find((t) => t.id === sub.type);
                const isApproved = sub.status === 'approved';
                const isRejected = sub.status === 'rejected';
                const isChangesRequested = sub.status === 'changes_requested';
                return (
                  <div
                    key={sub._id}
                    className="p-4 rounded-xl border border-[#C8D7BC] bg-[#F4F6F2] hover:bg-white transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-base">{typeObj?.icon || '📍'}</span>
                        <h3 className="text-sm font-bold text-[#1F2A24]">{sub.name}</h3>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 ${
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
                            className={`w-1.5 h-1.5 rounded-full ${
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
                            ? 'Published & Live on Map'
                            : isRejected
                            ? 'Not Published (Rejected)'
                            : isChangesRequested
                            ? 'Suggestion Received (Needs Improvement)'
                            : sub.updatedAfterSuggestion
                            ? 'Not Published (Updated - Pending Review)'
                            : 'Not Published (Pending Admin Review)'}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#6E6455] mt-1">
                        <span>📍 {sub.ward || 'Bengaluru'} ({sub.bbmp_zone || 'Zone'})</span>
                        <span>•</span>
                        <span className="font-mono">{sub.latitude?.toFixed(4)}° N, {sub.longitude?.toFixed(4)}° E</span>
                        <span>•</span>
                        <span>Stage: {sub.current_stage}</span>
                        <span>•</span>
                        <span>Submitted: {new Date(sub.createdAt).toLocaleDateString()}</span>
                      </div>

                      {/* Admin Suggestion Box */}
                      {sub.suggestion && (
                        <div className="mt-2.5 p-3 rounded-xl bg-amber-50/90 border border-amber-300 text-xs text-amber-950">
                          <div className="font-bold flex items-center gap-1.5 text-amber-900 mb-1">
                            <span>💡 Admin Suggestion for Improvement:</span>
                          </div>
                          <p className="m-0 leading-relaxed font-medium text-slate-800">{sub.suggestion}</p>
                        </div>
                      )}

                      {/* Consultant Update Note */}
                      {sub.updatedAfterSuggestion && (
                        <div className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-blue-800 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                          <span>🔄 You updated this project per suggestion:</span>
                          <span className="font-semibold italic">"{sub.updateNote}"</span>
                        </div>
                      )}

                      {/* Assigned Layer badge & Live Site ID */}
                      {isApproved && sub.assignedLayer && (
                        <div className="mt-2 flex items-center gap-2 flex-wrap text-xs">
                          <span className="text-emerald-800 font-semibold flex items-center gap-1">
                            ✓ Published to Layer: <strong>{sub.assignedLayer === 'bgg_sites' ? 'City-Wide BGG Projects (Sites)' : 'Existing Interventions'}</strong>
                          </span>
                          {sub.approvedSiteId && (
                            <span className="font-mono text-[11px] font-bold bg-[#E5ECE0] text-[#347745] px-2 py-0.5 rounded border border-[#C8D7BC]">
                              Live ID: {sub.approvedSiteId}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="mt-3 flex items-center gap-2 flex-wrap">
                        {isRejected ? (
                          <>
                            <button
                              type="button"
                              onClick={() => setViewingProject(sub)}
                              className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 text-xs font-bold rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5"
                            >
                              <span>👁️ View Project Details</span>
                            </button>
                            <span className="text-[11px] text-rose-700 italic font-medium">
                              (Project rejected by admin. Closed for editing.)
                            </span>
                          </>
                        ) : !isApproved ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleEditProject(sub)}
                              className="px-3.5 py-1.5 bg-[#347745] hover:bg-[#285d35] text-white text-xs font-bold rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
                            >
                              <span>✏️ {isChangesRequested ? 'Update Project per Suggestion' : 'Edit Project Details'}</span>
                              <span>→</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setViewingProject(sub)}
                              className="px-3 py-1.5 bg-white hover:bg-slate-50 text-[#1F2A24] border border-[#C8D7BC] text-xs font-semibold rounded-xl transition-all cursor-pointer inline-flex items-center gap-1"
                            >
                              <span>👁️ View Details</span>
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setViewingProject(sub)}
                            className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5"
                          >
                            <span>👁️ View Published Specs</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0 self-start md:self-center">
                      <span className="text-xs font-bold text-[#347745] bg-[#347745]/10 px-3 py-1 rounded-full border border-[#347745]/20">
                        {sub.total_cost || 'Budget TBD'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* READ-ONLY PROJECT DETAILS MODAL */}
      {viewingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-[#C8D7BC] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 text-left space-y-5">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-xl">
                    {PROJECT_TYPES.find((t) => t.id === viewingProject.type)?.icon || '📍'}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                    {PROJECT_TYPES.find((t) => t.id === viewingProject.type)?.label || viewingProject.type}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold uppercase tracking-wider ${
                      viewingProject.status === 'approved'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : viewingProject.status === 'rejected'
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : viewingProject.status === 'changes_requested'
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-slate-100 text-slate-800 border border-slate-300'
                    }`}
                  >
                    {viewingProject.status === 'approved'
                      ? '✓ Published & Live'
                      : viewingProject.status === 'rejected'
                      ? '✕ Rejected (Closed for Edits)'
                      : viewingProject.status === 'changes_requested'
                      ? '💡 Suggestion Received'
                      : '⏳ Pending Admin Review'}
                  </span>
                </div>
                <h2 className="text-xl font-extrabold text-[#1F2A24] tracking-tight">
                  {viewingProject.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setViewingProject(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            {/* Rejection Notice Banner if rejected */}
            {viewingProject.status === 'rejected' && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 text-xs text-rose-950 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-rose-900">
                  <span>🚫 Project Status: Rejected</span>
                </div>
                <p className="m-0 leading-relaxed">
                  This project was rejected by the administrators. <strong>It cannot be edited or resubmitted.</strong> You can view all submitted project specifications below for your records.
                </p>
                {viewingProject.adminNotes && (
                  <div className="mt-2 bg-white p-2.5 rounded-lg border border-rose-200 text-rose-900 font-medium">
                    <strong>Admin Note:</strong> {viewingProject.adminNotes}
                  </div>
                )}
              </div>
            )}

            {/* Specifications Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-[#F4F6F2] p-4 rounded-xl border border-[#C8D7BC]">
              <div>
                <span className="text-slate-500 block">Coordinates</span>
                <span className="font-mono font-bold text-[#1F2A24]">
                  {viewingProject.latitude?.toFixed(5)}° N, {viewingProject.longitude?.toFixed(5)}° E
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Location</span>
                <span className="font-bold text-[#1F2A24]">
                  Ward: {viewingProject.ward || '—'} ({viewingProject.bbmp_zone || 'Bengaluru'})
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Watershed</span>
                <span className="font-bold text-[#1F2A24]">{viewingProject.watershed || '—'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Current Stage</span>
                <span className="font-bold text-[#1F2A24]">{viewingProject.current_stage || 'Proposed'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Estimated Budget</span>
                <span className="font-bold text-[#347745]">{viewingProject.total_cost || 'TBD'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Timeline</span>
                <span className="font-bold text-[#1F2A24]">
                  {viewingProject.project_start_year} – {viewingProject.project_end_year || 'Ongoing'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Implementing Agency</span>
                <span className="font-bold text-[#1F2A24]">{viewingProject.implementing_agency || '—'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Partners</span>
                <span className="font-bold text-[#1F2A24]">{viewingProject.implementation_partners || '—'}</span>
              </div>
            </div>

            {/* Pre-intervention Challenges */}
            {viewingProject.pre_intervention_issues && (
              <div className="text-xs space-y-1">
                <span className="font-bold uppercase tracking-wider text-rose-800 block text-[11px]">
                  ⚠️ Pre-Intervention Challenges & Flooding Issues
                </span>
                <p className="m-0 bg-rose-50/50 p-3 rounded-xl border border-rose-200 text-[#1F2A24] leading-relaxed">
                  {viewingProject.pre_intervention_issues}
                </p>
              </div>
            )}

            {/* Context & Description */}
            {viewingProject.context && (
              <div className="text-xs space-y-1">
                <span className="font-bold uppercase tracking-wider text-[#1F2A24] block text-[11px]">
                  📋 Project Description & Scope
                </span>
                <p className="m-0 bg-[#F4F6F2] p-3 rounded-xl border border-[#C8D7BC]/70 text-[#1F2A24] leading-relaxed whitespace-pre-wrap">
                  {viewingProject.context}
                </p>
              </div>
            )}

            {/* Hydrological Impact */}
            {(viewingProject.site_level_impact || viewingProject.subcatchment_level_impact) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {viewingProject.site_level_impact && (
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-950">
                    <span className="font-bold block mb-1">Site-Level Water Retention</span>
                    <p className="m-0 leading-relaxed text-emerald-900">{viewingProject.site_level_impact}</p>
                  </div>
                )}
                {viewingProject.subcatchment_level_impact && (
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-950">
                    <span className="font-bold block mb-1">Subcatchment Runoff Reduction</span>
                    <p className="m-0 leading-relaxed text-emerald-900">{viewingProject.subcatchment_level_impact}</p>
                  </div>
                )}
              </div>
            )}

            {/* Submitted Photo */}
            {viewingProject.image_url && (
              <div className="text-xs space-y-1">
                <span className="font-bold uppercase tracking-wider text-[#6E6455] block text-[11px]">
                  📷 Submitted Photo / Design Layout
                </span>
                <img
                  src={viewingProject.image_url}
                  alt={viewingProject.name}
                  className="w-full max-h-64 object-contain rounded-xl border border-[#C8D7BC] bg-slate-50"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingProject(null)}
                className="px-5 py-2 bg-[#1F2A24] hover:bg-[#2d3a33] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

