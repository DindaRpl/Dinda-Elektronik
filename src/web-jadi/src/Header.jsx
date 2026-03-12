import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Header.css';

function Header({ 
    user, 
    searchTerm, 
    setSearchTerm, 
    selectedCategory, 
    setSelectedCategory, 
    cartCount,
    onCartClick, 
    onLogoClick  
}) {
    const navigate = useNavigate();
    const [showDropdown, setShowDropdown] = useState(false);

    const handleLogout = () => {
        localStorage.clear();
        navigate("/login");
    };

    return (
        <header className="main-header">
            <div className="top-bar">
                <p>Cari Dan Beli Produk Impian Mu Disinii! 🚚</p>
            </div>

            <div className="mid-header">
                <div className="header-container">
                    <div className="logo" onClick={() => { 
                        setSelectedCategory("Semua"); 
                        onLogoClick(); 
                    }} style={{ cursor: "pointer" }}>
                        <h1>Dinda<span>Elektronik</span></h1>
                    </div>

                    <div className="search-bar-container">
                        <input 
                            type="text" 
                            placeholder="Klik disini untuk cari produk elektronik impianmu..." 
                            className="header-search"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)} 
                        />
                        <button className="search-btn">🔍 Search</button>
                    </div>

                    <div className="header-icons">
                        <div 
                            className="icon-item account" 
                            onMouseEnter={() => setShowDropdown(true)}
                            onMouseLeave={() => setShowDropdown(false)}
                        >
                            <i className="user-icon">👤</i>
                            <div className="account-text">
                                <strong>Akun Saya ▼</strong>
                            </div>

                            {showDropdown && (
                                <div className="account-dropdown">
                                    <div className="dropdown-header">
                                        <p>Role: <strong>{user?.role?.toUpperCase()}</strong></p>
                                    </div>
                                    <hr />
                                    
                                    {/* MENU KHUSUS ADMIN */}
                                    {user?.role === 'admin' && (
                                        <>
                                            <div className="dropdown-item" onClick={() => navigate("/kelola-produk")}>📦 Kelola Produk</div>
                                            <div className="dropdown-item" onClick={() => navigate("/kelola-kategori")}>📂 Kelola Kategori</div>
                                            <div className="dropdown-item" onClick={() => navigate("/kelola-user")}>👥 Kelola User</div>
                                            {/* Admin juga boleh lihat riwayat transaksi dong! */}
                                            <div className="dropdown-item" onClick={() => navigate("/riwayat-transaksi")}>📜 Riwayat Transaksi</div>
                                        </>
                                    )}

                                    {/* MENU KHUSUS KASIR */}
                                    {(user?.role === 'kasir' || user?.role === 'cashier') && (
                                        <>
                                            <div className="dropdown-item" onClick={() => onLogoClick()}>📊 Dashboard</div>
                                            {/* PERBAIKAN: Link disamakan dengan App.jsx */}
                                            <div className="dropdown-item" onClick={() => navigate("/riwayat-transaksi")}>📜 Riwayat Transaksi</div>
                                        </>
                                    )}

                                    <hr />
                                    <div className="dropdown-item logout-red" onClick={handleLogout}>🚪 Logout</div>
                                </div>
                            )}
                        </div>

                        <div className="icon-item cart" onClick={onCartClick} style={{ cursor: "pointer" }}>
                            <i className="cart-icon">🛒</i>
                            <span className="cart-count">{cartCount || 0}</span>
                            <strong>Keranjang</strong>
                        </div>
                    </div>
                </div>
            </div>

            <nav className="bottom-nav">
                <div className="header-container">
                    <ul>
                        {["Semua Produk", "Smartphone", "Laptop", "Gaming & Konsol", "Peralatan Rumah Tangga", "Audio & Hiburan"].map((cat) => (
                            <li 
                                key={cat}
                                className={(selectedCategory === cat || (cat === "Semua Produk" && selectedCategory === "Semua")) ? "active" : ""}
                                onClick={() => {
                                    setSelectedCategory(cat === "Semua Produk" ? "Semua" : cat);
                                    onLogoClick();
                                }}
                            >
                                {cat}
                            </li>
                        ))}
                    </ul>
                </div>
            </nav>
        </header>
    );
}

export default Header;