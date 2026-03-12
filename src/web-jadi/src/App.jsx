import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./Login";
import Dashboard from "./Dashboard"; 
import ManageProducts from "./pages/ManageProducts"; 
import ManageUsers from "./pages/ManageUsers"; 
// 1. IMPORT file ManageCategories yang baru saja kamu buat
import ManageCategories from "./pages/ManageCategories"; 

function App () {
    return(
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            
            {/* Rute untuk Kelola Produk */}
            <Route path="/kelola-produk" element={<ManageProducts />} />

            {/* Rute untuk Kelola User */}
            <Route path="/kelola-user" element={<ManageUsers />} />
            
            {/* 2. TAMBAHKAN rute untuk Kelola Kategori */}
            <Route path="/kelola-kategori" element={<ManageCategories />} />
            
            {/* Rute default: Jika path tidak ditemukan, lempar ke login */}
            <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
    );
}

export default App;