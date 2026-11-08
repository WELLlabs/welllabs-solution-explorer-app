// OAuth client ID for "Sign in with Google". It is public (it is sent to every browser),
// so it can live in code; GOOGLE_CLIENT_ID overrides it. Must match VITE_GOOGLE_CLIENT_ID in the frontend.
const GOOGLE_CLIENT_ID =
  process.env.GOOGLE_CLIENT_ID || '660304717733-g5d02t6mn67jcppsoc0ef0m9go39qe8a.apps.googleusercontent.com';

module.exports = { GOOGLE_CLIENT_ID };
