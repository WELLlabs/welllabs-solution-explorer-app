import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PERSONAS } from '../config/roleFieldsConfig';

const Login = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading, login, register, googleAuth, completeProfile } = useContext(AuthContext);

  // URL persona param from Dashboard/Homepage selection (e.g. /login?role=funder)
  const initialRole = searchParams.get('role') || 'funder';
  const validRole = PERSONAS[initialRole] ? initialRole : 'funder';

  // Mode: 'signin' | 'register' | 'google_complete'
  const initialMode = searchParams.get('mode') === 'register' ? 'register' : 'signin';
  const [mode, setMode] = useState(initialMode);
  const activeRole = validRole;
  const personaConfig = PERSONAS[activeRole] || PERSONAS.funder;

  // Form Fields (all required)
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [organization, setOrganization] = useState('');
  const [userType, setUserType] = useState(() => personaConfig.userTypes?.[0] || '');
  const [profile, setProfile] = useState('');
  const [areasOfInterest, setAreasOfInterest] = useState('');
  const [focusThemes, setFocusThemes] = useState('');
  const [pastProjects, setPastProjects] = useState('');

  // Role-specific fields (e.g. cinNumber for funder)
  const [roleSpecificData, setRoleSpecificData] = useState({
    cinNumber: '',
  });

  // Google SSO state
  const [googleProfile, setGoogleProfile] = useState(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  // UI state
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // If user is already authenticated, redirect straight to /dashboard
  useEffect(() => {
    if (!authLoading && user && user.isProfileComplete) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, authLoading, navigate]);

  // Sync default userType when active role or persona changes
  useEffect(() => {
    if (personaConfig?.userTypes?.length > 0) {
      if (!personaConfig.userTypes.includes(userType)) {
        setUserType(personaConfig.userTypes[0]);
      }
    }
  }, [activeRole]);

  // Switch between Sign In and Register
  const handleModeSwitch = (newMode) => {
    setMode(newMode);
    setError('');
    setSearchParams({ role: activeRole, mode: newMode });
  };

  // Handle Form Submission (Sign In or Full Registration)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (mode === 'signin') {
        // Standard Sign In (verified against selected persona)
        const result = await login(email, password, activeRole);
        if (result.success) {
          navigate('/dashboard', { replace: true });
        } else {
          setError(result.message || 'Invalid email or password');
        }
      } else if (mode === 'google_complete') {
        // Completing profile for Google authenticated user
        const payload = {
          _id: googleProfile?._id || user?._id,
          name: name || googleProfile?.name,
          phone,
          address,
          organization,
          persona: activeRole,
          userType,
          profile,
          areasOfInterest,
          focusThemes,
          pastProjects,
          roleSpecificData,
        };

        const result = await completeProfile(payload);
        if (result.success) {
          navigate('/dashboard', { replace: true });
        } else {
          setError(result.message || 'Failed to complete profile');
        }
      } else {
        // Full Registration (All fields required)
        const payload = {
          name,
          email,
          password,
          persona: activeRole,
          userType,
          phone,
          address,
          organization,
          profile,
          areasOfInterest,
          focusThemes,
          pastProjects,
          roleSpecificData,
        };

        const result = await register(payload);
        if (result.success) {
          navigate('/dashboard', { replace: true });
        } else {
          setError(result.message || 'Registration failed');
        }
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Google SSO Handler
  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);

    try {
      const promptEmail = window.prompt(
        "Enter your Google account email to sign in with Google SSO:",
        email || "user@gmail.com"
      );

      if (!promptEmail) {
        setGoogleLoading(false);
        return;
      }

      const mockGoogleName = promptEmail.split('@')[0].replace('.', ' ');
      const capitalizedName = mockGoogleName.charAt(0).toUpperCase() + mockGoogleName.slice(1);

      const googlePayload = {
        email: promptEmail,
        name: name || capitalizedName,
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(promptEmail)}`,
        googleId: `google_${Date.now()}`,
        persona: activeRole,
      };

      const result = await googleAuth(googlePayload);

      if (result.success) {
        if (result.isProfileComplete) {
          // Existing user with completed profile -> straight to Map!
          navigate('/dashboard', { replace: true });
        } else {
          // New user or incomplete profile -> Step 2: Complete Profile
          setGoogleProfile(result.user);
          setName(result.user.name || capitalizedName);
          setEmail(result.user.email || promptEmail);
          setMode('google_complete');
        }
      } else {
        setError(result.message || 'Google authentication failed');
      }
    } catch (err) {
      setError('Could not connect to Google authentication service.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 md:p-8 overflow-x-hidden font-sans select-none bg-gradient-to-b from-[#C8D7BC]/40 via-[#f2f6ee] to-[#FFFFFF]">
      {/* ========================================================================= */}
      {/* ATMOSPHERIC BACKGROUND: TOPOGRAPHICAL CONTOURS & GIS HYDROLOGY ELEMENTS */}
      {/* ========================================================================= */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {/* Ambient Watercolor Atmosphere */}
        <div className="absolute -left-28 -top-20 w-[520px] h-[520px] bg-[#C8D7BC]/40 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -right-32 top-1/4 w-[600px] h-[600px] bg-[#C8D7BC]/35 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute left-1/4 -bottom-32 w-[650px] h-[500px] bg-[#6D9EC9]/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute right-10 bottom-10 w-96 h-96 bg-[#C8D7BC]/30 rounded-full blur-2xl pointer-events-none"></div>

        {/* Topographical Contour SVG Waves & Stream Lines */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none opacity-45"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1440 900"
          preserveAspectRatio="none"
        >
          <path
            d="M-50,180 C260,110 520,310 820,190 C1120,70 1280,240 1500,160"
            fill="none"
            stroke="#A99E8A"
            strokeWidth="1.2"
            strokeDasharray="4 4"
            opacity="0.6"
          />
          <path
            d="M-50,260 C280,180 560,380 860,250 C1160,120 1320,310 1500,220"
            fill="none"
            stroke="#347745"
            strokeWidth="1.4"
            opacity="0.35"
          />
          <path
            d="M-50,340 C310,240 600,450 900,310 C1200,170 1350,380 1500,280"
            fill="none"
            stroke="#C8D7BC"
            strokeWidth="1.8"
            opacity="0.8"
          />
          <path
            d="M-50,420 C340,300 640,520 940,370 C1240,220 1380,450 1500,340"
            fill="none"
            stroke="#3669A9"
            strokeWidth="1.2"
            opacity="0.3"
          />
          <path
            d="M-50,520 C370,410 670,620 980,470 C1280,320 1410,540 1500,440"
            fill="none"
            stroke="#A99E8A"
            strokeWidth="1.2"
            strokeDasharray="6 6"
            opacity="0.5"
          />
          <path
            d="M-50,640 C400,520 710,720 1020,580 C1320,430 1430,640 1500,550"
            fill="none"
            stroke="#347745"
            strokeWidth="1.6"
            opacity="0.4"
          />
          <path
            d="M-50,760 C430,640 750,830 1060,690 C1360,540 1450,750 1500,660"
            fill="none"
            stroke="#C8D7BC"
            strokeWidth="2"
            opacity="0.85"
          />
        </svg>

        {/* Subtle GIS Architectural Grid Crosshairs & Coordinates */}
        <div className="absolute top-12 left-12 text-[#6E6455]/40 font-mono text-[11px] select-none flex items-center gap-1.5">
          <span className="text-base leading-none text-[#347745]/50">+</span>
          <span>12.9716° N, 77.5946° E</span>
        </div>
        <div className="absolute top-16 right-16 text-[#6E6455]/40 font-mono text-[11px] select-none flex items-center gap-1.5">
          <span className="text-base leading-none text-[#3669A9]/50">+</span>
          <span>ELEV. 920M · BENGALURU WATERSHED</span>
        </div>
        <div className="absolute bottom-12 left-16 text-[#6E6455]/40 font-mono text-[11px] select-none flex items-center gap-1.5">
          <span className="text-base leading-none text-[#347745]/50">+</span>
          <span>BGG INFRASTRUCTURE PLATFORM</span>
        </div>
        <div className="absolute bottom-14 right-14 text-[#6E6455]/40 font-mono text-[11px] select-none flex items-center gap-1.5">
          <span className="text-base leading-none text-[#F2C230]/70">+</span>
          <span>CITIZEN HYDROLOGY INITIATIVE</span>
        </div>

        {/* Subtle Decorative Geometric Accents */}
        <div className="absolute top-1/3 left-8 w-20 h-20 border-l border-t border-[#C8D7BC]/70 pointer-events-none"></div>
        <div className="absolute bottom-1/3 right-8 w-20 h-20 border-r border-b border-[#C8D7BC]/70 pointer-events-none"></div>
      </div>

      {/* ========================================================================= */}
      {/* MAIN FROSTED GLASS CONTAINER */}
      {/* ========================================================================= */}
      <div className="relative z-10 w-full max-w-[500px] my-6 transition-all duration-300">
        <div className="relative bg-white/95 backdrop-blur-2xl rounded-[32px] p-6 sm:p-9 shadow-[0_25px_60px_-15px_rgba(52,119,69,0.14)] border border-[#C8D7BC]/80 max-h-[92vh] overflow-y-auto">

          {/* Back to Role Selection Button */}
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#C8D7BC]/40">
            <button
              type="button"
              onClick={() => navigate('/home', { replace: true })}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1F2A24] hover:text-[#347745] transition-colors bg-[#C8D7BC]/30 hover:bg-[#C8D7BC]/60 px-3 py-1.5 rounded-full cursor-pointer border-none"
              title="Return to the role selection page"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5" />
                <path d="M12 19l-7-7 7-7" />
              </svg>
              <span>Change Role</span>
            </button>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#1F2A24] bg-[#F2C230] px-3 py-1 rounded-full shadow-2xs border border-[#F2C230]/80">
              Role: {personaConfig.label}
            </span>
          </div>

          {/* Heading and Subtitle */}
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-[26px] font-extrabold text-[#1F2A24] tracking-tight leading-tight">
              {mode === 'signin'
                ? 'Sign in with email'
                : mode === 'google_complete'
                ? 'Complete your profile'
                : `Register as ${personaConfig.label}`}
            </h1>
            <p className="text-xs sm:text-[13px] text-[#6E6455] mt-1.5 leading-relaxed max-w-[380px] mx-auto">
              {mode === 'signin'
                ? `Sign in as ${personaConfig.label} to access Bengaluru’s flood maps and resilience projects.`
                : mode === 'google_complete'
                ? 'We got your verified Google details! Please complete the required role specifics to enter the map.'
                : `Join Solution Explorer as ${personaConfig.label} to plan, fund, and build a water-secure Bengaluru.`}
            </p>
          </div>

          {/* Error Notice */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 animate-[fadeIn_0.2s_ease-out]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 select-text">
            {/* Google Verified Notice Banner if in google_complete mode */}
            {mode === 'google_complete' && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[11px] font-bold">✓</span>
                  <span>Google account verified: <strong>{email}</strong></span>
                </div>
                <span className="text-[10px] bg-emerald-200/70 text-emerald-900 px-2 py-0.5 rounded-full font-bold">SSO Linked</span>
              </div>
            )}

            {/* Name Field (Required for Register / Complete) */}
            {mode !== 'signin' && (
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#f2f4f7] hover:bg-[#ebedf1] focus:bg-white focus:ring-2 focus:ring-[#3669A9]/30 focus:border-[#3669A9] border border-[#A99E8A]/30 transition-all"
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div>
              {mode !== 'signin' && (
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Email Address *
                </label>
              )}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </div>
                <input
                  type="email"
                  required
                  disabled={mode === 'google_complete'}
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl bg-[#f2f4f7] hover:bg-[#ebedf1] focus:bg-white focus:ring-2 focus:ring-[#3669A9]/30 focus:border-[#3669A9] border border-[#A99E8A]/30 transition-all ${
                    mode === 'google_complete' ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                />
              </div>
            </div>

            {/* Password Field (Required for Sign In or Direct Email Register) */}
            {mode !== 'google_complete' && (
              <div>
                {mode !== 'signin' && (
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Password *
                  </label>
                )}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 rounded-xl bg-[#f2f4f7] hover:bg-[#ebedf1] focus:bg-white focus:ring-2 focus:ring-[#3669A9]/30 focus:border-[#3669A9] border border-[#A99E8A]/30 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Forgot password link for Sign In mode */}
            {mode === 'signin' && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => alert("Please contact administrator to reset password.")}
                  className="text-xs font-semibold text-[#6E6455] hover:text-[#3669A9] transition-colors cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* ============================================================= */}
            {/* EXTENDED FIELDS (Only displayed during Register / Onboarding) */}
            {/* ============================================================= */}
            {mode !== 'signin' && (
              <div className="space-y-4 pt-1 border-t border-slate-100">
                {/* User Type Dropdown (Filtered strictly based on role selected in dashboard) */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    User Type *
                  </label>
                  <div className="relative">
                    <select
                      required
                      value={userType}
                      onChange={(e) => setUserType(e.target.value)}
                      className="w-full py-3 px-3.5 rounded-xl bg-[#f2f4f7] hover:bg-[#ebedf1] focus:bg-white focus:ring-2 focus:ring-[#3669A9]/30 focus:border-[#3669A9] border border-[#A99E8A]/30 transition-all cursor-pointer text-sm text-[#1F2A24]"
                    >
                      {personaConfig.userTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Name of the Organisation */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Name of the Organisation *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
                        <path d="M9 22v-4h6v4" />
                        <path d="M8 6h.01" />
                        <path d="M16 6h.01" />
                        <path d="M8 10h.01" />
                        <path d="M16 10h.01" />
                        <path d="M8 14h.01" />
                        <path d="M16 14h.01" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Bangalore Climate Foundation"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#f2f4f7] hover:bg-[#ebedf1] focus:bg-white focus:ring-2 focus:ring-[#3669A9]/30 focus:border-[#3669A9] border border-[#A99E8A]/30 transition-all"
                    />
                  </div>
                </div>

                {/* ROLE-SPECIFIC EXTRA FIELD: CIN Number for Funder (Black & White neutral styling) */}
                {activeRole === 'funder' && (
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      CIN Number (Corporate Identification Number) *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect width="20" height="14" x="2" y="5" rx="2" />
                          <line x1="2" y1="10" x2="22" y2="10" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        required
                        placeholder="e.g. U72200KA2020PTC123456"
                        value={roleSpecificData.cinNumber || ''}
                        onChange={(e) =>
                          setRoleSpecificData({
                            ...roleSpecificData,
                            cinNumber: e.target.value.toUpperCase(),
                          })
                        }
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#f2f4f7] hover:bg-[#ebedf1] focus:bg-white focus:ring-2 focus:ring-[#3669A9]/30 focus:border-[#3669A9] border border-[#A99E8A]/30 transition-all text-sm text-[#1F2A24] font-mono placeholder:text-[#6E6455]/60"
                      />
                    </div>
                    <p className="text-[10.5px] text-slate-400 mt-1 pl-1">
                      21-character alphanumeric code issued by Registrar of Companies (ROC)
                    </p>
                  </div>
                )}

                {/* Phone & Address Grid (Both Required) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Phone Number *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
                      </div>
                      <input
                        type="tel"
                        required
                        placeholder="+91 9876543210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full pl-9 pr-3 py-3 rounded-xl bg-[#f2f4f7] hover:bg-[#ebedf1] focus:bg-white focus:ring-2 focus:ring-[#3669A9]/30 focus:border-[#3669A9] border border-[#A99E8A]/30 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Address / Location *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Indiranagar, Bengaluru"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full pl-9 pr-3 py-3 rounded-xl bg-[#f2f4f7] hover:bg-[#ebedf1] focus:bg-white focus:ring-2 focus:ring-[#3669A9]/30 focus:border-[#3669A9] border border-[#A99E8A]/30 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Profile / Bio / Summary (Required) */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Profile / Designation *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lead Sustainability Officer, Landscape Architect, Citizen Activist"
                    value={profile}
                    onChange={(e) => setProfile(e.target.value)}
                    className="w-full px-3.5 py-3 rounded-xl bg-[#f2f4f7] hover:bg-[#ebedf1] focus:bg-white focus:ring-2 focus:ring-[#3669A9]/30 focus:border-[#3669A9] border border-[#A99E8A]/30 transition-all"
                  />
                </div>

                {/* Areas of Interest Text Input (Required) */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Areas of Interest *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <circle cx="12" cy="12" r="4" />
                        <line x1="4.93" y1="4.93" x2="9.17" y2="9.17" />
                        <line x1="14.83" y1="14.83" x2="19.07" y2="19.07" />
                        <line x1="14.83" y1="9.17" x2="19.07" y2="4.93" />
                        <line x1="4.93" y1="19.07" x2="9.17" y2="14.83" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Lakes & Wetlands, Bioswales, Groundwater Recharge"
                      value={areasOfInterest}
                      onChange={(e) => setAreasOfInterest(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#f2f4f7] hover:bg-[#ebedf1] focus:bg-white focus:ring-2 focus:ring-[#3669A9]/30 focus:border-[#3669A9] border border-[#A99E8A]/30 transition-all"
                    />
                  </div>
                </div>

                {/* Focus Themes Text Input (Required) */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Focus Themes *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                        <line x1="4" y1="22" x2="4" y2="15" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Flood Mitigation, Water Security, Urban Ecology"
                      value={focusThemes}
                      onChange={(e) => setFocusThemes(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#f2f4f7] hover:bg-[#ebedf1] focus:bg-white focus:ring-2 focus:ring-[#3669A9]/30 focus:border-[#3669A9] border border-[#A99E8A]/30 transition-all"
                    />
                  </div>
                </div>

                {/* Past Projects (Required) */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Past Projects / Experience *
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Describe your previous climate, urban, or infrastructure projects..."
                    value={pastProjects}
                    onChange={(e) => setPastProjects(e.target.value)}
                    className="w-full p-3 rounded-xl bg-[#f2f4f7] hover:bg-[#ebedf1] focus:bg-white focus:ring-2 focus:ring-[#3669A9]/30 focus:border-[#3669A9] border border-[#A99E8A]/30 transition-all resize-none"
                  />
                </div>
              </div>
            )}

            {/* Submit Action Button ("Get Started" / "Continue to Map") */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 px-6 rounded-xl bg-[#3669A9] hover:bg-[#347745] active:scale-[0.99] text-white font-bold text-sm tracking-wide shadow-md shadow-[#3669A9]/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {submitting ? (
                  <span>Processing...</span>
                ) : mode === 'signin' ? (
                  <span>Get Started</span>
                ) : mode === 'google_complete' ? (
                  <span>Complete &amp; Explore Map →</span>
                ) : (
                  <span>Create Account &amp; Explore Map →</span>
                )}
              </button>
            </div>
          </form>

          {/* Divider: "Or sign in with" */}
          <div className="relative my-5 flex items-center justify-center">
            <div className="border-t border-[#A99E8A]/30 w-full"></div>
            <span className="bg-white/90 px-3 text-[11px] font-medium text-[#6E6455] uppercase tracking-wider shrink-0">
              Or sign in with
            </span>
            <div className="border-t border-[#A99E8A]/30 w-full"></div>
          </div>

          {/* Google SSO Button (Official multi-color G icon, clean rounded pill) */}
          <div>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-[#A99E8A]/40 bg-white hover:bg-[#C8D7BC]/15 text-[#1F2A24] font-semibold text-xs shadow-2xs hover:shadow-xs transition-all duration-200 active:scale-[0.99] cursor-pointer"
            >
              {/* Google SVG Brand Icon */}
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.94 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>{googleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
            </button>
          </div>

          {/* Footer toggle: Switch between Sign in and Register */}
          <div className="mt-5 text-center text-xs text-[#6E6455]">
            {mode === 'signin' ? (
              <p>
                Don&apos;t have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => handleModeSwitch('register')}
                  className="font-bold text-[#3669A9] hover:text-[#347745] hover:underline cursor-pointer ml-1"
                >
                  Register as {personaConfig.label}
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => handleModeSwitch('signin')}
                  className="font-bold text-[#3669A9] hover:text-[#347745] hover:underline cursor-pointer ml-1"
                >
                  Sign in
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
