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
            // Sesuai backend: res.data.transaction
            setData(res.data.transaction);
        })
        .catch(err => alert("Gagal memuat detail transaksi!"));
    }, [id]);

    if (!data) return <div className="manage-container">Memuat rincian...</div>;

    return (
        <div className="manage-container">
            <div className="manage-header">
                <div className="header-info">
                    <button className="back-btn" onClick={() => navigate("/riwayat-transaksi")}>← Kembali</button>
                    <h2>🔍 Detail Transaksi #TRX-{id}</h2>
                </div>
            </div>

            <div className="transaction-info-card" style={{ marginBottom: "20px", padding: "15px", backgroundColor: "#f8f9fa", borderRadius: "8px" }}>
                <p><strong>Nama Kasir:</strong> {data.kasir_name}</p>
                <p><strong>Waktu:</strong> {new Date(data.created_at).toLocaleString('id-ID')}</p>
                <p><strong>Total Transaksi:</strong> <span style={{ color: "#27ae60", fontWeight: "bold" }}>Rp {Number(data.total_amount).toLocaleString('id-ID')}</span></p>
            </div>

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
                                <td>Rp {Number(item.price_per_item).toLocaleString('id-ID')}</td>
                                <td style={{ fontWeight: "600" }}>Rp {Number(item.subtotal).toLocaleString('id-ID')}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TransactionDetail;