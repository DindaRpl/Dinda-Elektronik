import React from 'react';
import './ProductCard.css';

// Tambahkan onBuyNow dan onViewDetail ke dalam props
function ProductCard({ title, description, price, image, onAddToCart, onBuyNow, onViewDetail }) {
    return (
        <div className="product-card">
            {/* 1. BAGIAN GAMBAR (Sekarang bisa diklik untuk Detail) */}
            <div 
                className="product-image-container" 
                onClick={onViewDetail} 
                style={{ cursor: 'pointer', position: 'relative' }}
            >
                {image ? (
                    <img 
                        src={image} 
                        alt={title} 
                        className="product-image"
                    />
                ) : (
                    <div className="placeholder">📱</div>
                )}
                {/* Overlay kecil saat gambar di-hover */}
                <div className="view-detail-overlay">Lihat Detail</div>
            </div>

            <div className="product-info">
                {/* Judul juga bisa diklik untuk detail */}
                <h3 className="product-name" onClick={onViewDetail} style={{ cursor: 'pointer' }}>
                    {title}
                </h3>
                
                <p className="product-description">
                    {description || "Produk Elektronik Pilihan"}
                </p>
                
                <p className="product-price">Rp {price}</p>

                {/* 2. TOMBOL AKSI: Keranjang & Beli Sekarang */}
                <div className="button-group" style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                    <button 
                        className="add-to-cart-btn" 
                        onClick={onAddToCart}
                        title="Tambah ke Keranjang"
                    >
                        🛒
                    </button>
                    
                    <button 
                        className="buy-now-btn" 
                        onClick={onBuyNow}
                        style={{
                            flex: 1,
                            backgroundColor: '#ee4d2d',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                        }}
                    >
                        ⚡ Beli Sekarang
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ProductCard;