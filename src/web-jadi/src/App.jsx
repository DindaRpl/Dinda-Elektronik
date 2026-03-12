import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./Login";
import Dashboard from "./Dashboard"; 

// Import Halaman Kelola
import ManageProducts from "./pages/ManageProducts"; 
import ManageUsers from "./pages/ManageUsers"; 
import ManageCategories from "./pages/ManageCategories"; 

// Import Halaman Transaksi 
import TransactionHistory from "./pages/TransactionHistory";
import TransactionDetail from "./pages/TransactionDetail";

function App () {
    return(
        <Routes>
            {/* Autentikasi */}
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            
            {/* Rute Master Data */}
            <Route path="/kelola-produk" element={<ManageProducts />} />
            <Route path="/kelola-user" element={<ManageUsers />} />
            <Route path="/kelola-kategori" element={<ManageCategories />} />
            
            {/* Rute Transaksi */}
            {/* 1. Untuk melihat daftar semua transaksi */}
            <Route path="/riwayat-transaksi" element={<TransactionHistory />} />
            
            {/* 2. Untuk melihat detail barang per transaksi (pakai :id sebagai parameter) */}
            <Route path="/detail-transaksi/:id" element={<TransactionDetail />} />
            
            {/* Rute default: Jika path ngawur, lempar ke login */}
            <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
    );
}

export default App;