import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import "../App.css";

const TransactionDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const token = localStorage.getItem("token");

    useEffect(() => {
        axios.get(`http://localhost:3000/transactions/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => {
            setData(res.data.transaction);
        })
        .catch(err => alert("Gagal memuat detail transaksi!"));
    }, [id]);

    const handlePrint = () => {
        window.print();
    };

    if (!data) return <div className="manage-container">Memuat rincian...</div>;

    return (
        <div className="manage-container">
            {/* Header: Hilang saat diprint */}
            <div className="manage-header no-print">
                <div className="header-info">
                    <button className="back-btn" onClick={() => navigate("/riwayat-transaksi")}>← Kembali</button>
                    <h2>🔍 Detail Transaksi #TRX-{id}</h2>
                </div>
                <button className="print-btn-modern" onClick={handlePrint}>
                    🖨️ Cetak Struk
                </button>
            </div>

            {/* Info Card: Kasir & Waktu */}
            <div className="transaction-info-card-modern">
                <div className="info-main">
                    <div className="info-group">
                        <span className="info-label">👤 Nama Kasir</span>
                        <span className="info-value">{data.kasir_name}</span>
                    </div>
                    <div className="info-group">
                        <span className="info-label">📅 Waktu Transaksi</span>
                        <span className="info-value">
                            {new Date(data.created_at).toLocaleString('id-ID')}
                        </span>
                    </div>
                </div>
                <div className="info-total">
                    <span className="info-label">Total Pembayaran</span>
                    <span className="total-amount-badge">
                        Rp {Number(data.total_amount).toLocaleString('id-ID')}
                    </span>
                </div>
            </div>

            {/* Tabel Produk */}
            <div className="table-wrapper">
                <table className="styled-table">
                    <thead>
                        <tr>
                            <th>Nama Produk</th>
                            <th style={{ textAlign: "center" }}>Qty</th>
                            <th>Harga Satuan</th>
                            <th>Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.items.map((item) => (
                            <tr key={item.id}>
                                <td>{item.product_name}</td>
                                <td style={{ textAlign: "center" }}>{item.quantity}</td>
                                <td>
                                    {item.quantity > 1 ? (
                                        <div className="price-detail">
                                            <span>Rp {Number(item.price_per_item).toLocaleString('id-ID')}</span>
                                            <small className="qty-multiply">x {item.quantity}</small>
                                        </div>
                                    ) : (
                                        `Rp ${Number(item.price_per_item).toLocaleString('id-ID')}`
                                    )}
                                </td>
                                <td style={{ fontWeight: "600", color: "#2c3e50" }}>
                                    Rp {Number(item.subtotal).toLocaleString('id-ID')}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            {/* Footer Ucapan Terima Kasih */}
            <div className="footer-thanks-container">
                <div className="thanks-divider"></div>
                <p className="thanks-text">✨ Terima kasih telah berbelanja di <strong>Dinda Elektronik</strong>! ✨</p>
                <p className="sub-thanks">Simpan struk ini sebagai bukti pembayaran yang sah.</p>
                <div className="barcode-mockup only-print">|||| || ||||| |||| || ||| ||||</div>
            </div>
        </div>
    );
};

export default TransactionDetail;