import React, { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { googleLogin, storeAuth } from "../api/authApi";

function Login({ onLogin }) {
  const [error, setError] = useState(null);

  const handleSuccess = async (credentialResponse) => {
    try {
      const data = await googleLogin(credentialResponse.credential);
      storeAuth(data.access, data.user);
      onLogin(data.user);
    } catch {
      setError("Login failed. Please try again.");
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Recallio AI</h1>
        <p>Sign in to access your notes and tasks</p>
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={() => setError("Google sign-in failed.")}
        />
        {error && <p className="login-error">{error}</p>}
      </div>
    </div>
  );
}

export default Login;
