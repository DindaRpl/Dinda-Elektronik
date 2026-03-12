import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./Login";
import Dashboard from "./Dashboard"; 
// 1. IMPORT file yang baru kita buat
import ManageProducts from "./pages/ManageProducts"; 
import ManageUsers from "./pages/ManageUsers"; // Pastikan path filenya benar ya!

function App () {
    return(
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            
            {/* 2. TAMBAHKAN rute untuk Kelola Produk */}
            <Route path="/kelola-produk" element={<ManageProducts />} />

            {/* 3. TAMBAHKAN rute untuk Kelola User biar nggak mental ke login */}
            <Route path="/kelola-user" element={<ManageUsers />} />
            
            {/* Rute default: Kalau alamat ngawur, lempar ke login */}
            <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
    );
}

export default App;