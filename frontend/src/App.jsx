import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Dashboard from '@/pages/Dashboard';
import AdminLogin from '@/pages/AdminLogin';
import ErrorBoundary from '@/components/ErrorBoundary';

const ADMIN_PATH = import.meta.env.VITE_ADMIN_PATH || '/welllabs-admin-portal';

function App() {
  return (
    <Router>
      <ErrorBoundary>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path={ADMIN_PATH} element={<AdminLogin />} />
            <Route path="/:activeTab?" element={<Dashboard />} />
          </Routes>
        </AuthProvider>
      </ErrorBoundary>
    </Router>
  );
}

export default App;
