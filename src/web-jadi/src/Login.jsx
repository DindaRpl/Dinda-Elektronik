import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Login.css"; 

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); 
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // Endpoint diarahkan ke port 3000 sesuai settingan backend kamu
      const response = await axios.post("http://localhost:3000/auth/login", {
        username,
        password
      });

      // --- BAGIAN LOGIKA PENYAMBUNG DATABASE ---
      if (response.data.token) {
        // 1. Simpan Token untuk akses API
        localStorage.setItem("token", response.data.token);
        
        // 2. Simpan Data User (Nama & Role) agar Dashboard tahu siapa yang login
        // Ini kuncinya supaya menu Admin/Kasir bisa muncul nanti!
        localStorage.setItem("user", JSON.stringify(response.data.user)); 
        
        navigate("/dashboard"); 
      }
      // ------------------------------------------

    } catch (error) {
      console.error("Login Error:", error);
      alert("Login gagal! Pastikan Username & Password benar atau cek koneksi Backend.");
    }
  };

  return (
    <div className="container">
      <div className="login-box">
        <h1 className="login-title">Toko Elektronik Dinda</h1>
        <p className="login-subtitle">Silakan login untuk mengakses Dashboard Anda.</p>
        
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="input-label">Enter Username</label>
            <input
              type="text"
              className="input-box" 
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label className="input-label">Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                className="input-box password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <span 
                className="toggle-password" 
                onClick={() => setShowPassword(!showPassword)}
                style={{ cursor: "pointer" }}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </span>
            </div>
          </div>

          <div className="login-helpers">
            <div className="remember-me">
              <input type="checkbox" id="rememberMe" />
              <label htmlFor="rememberMe">Remember me</label>
            </div>
            <a href="#" className="forgot-password">Forgot password?</a>
          </div>
          
          <button type="submit" className="btn-login">
            Login
          </button>
        </form>

        <div className="sign-up-wrapper">
          Don't have an account? 
          <a href="#" className="login-link"> Sign Up</a>
        </div>
      </div>
    </div>
  );
};

export default Login;