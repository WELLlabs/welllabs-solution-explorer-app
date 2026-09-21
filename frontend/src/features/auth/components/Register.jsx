import React from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';

const Register = () => {
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role') || 'funder';
  return <Navigate to={`/login?role=${role}&mode=register`} replace />;
};

export default Register;