import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../App.css";

const TransactionHistory = () => {
    const [transactions, setTransactions] = useState([]);
    const navigate = useNavigate();
    const token = localStorage.getItem("token");

    const fetchTransactions = () => {
        axios.get("http://localhost:3000/transactions", {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => {
            // Sesuai backend: res.data.transactions
            setTransactions(res.data.transactions);
        })
        .catch(err => console.error("Gagal ambil data:", err));
    };

    useEffect(() => {
        fetchTransactions();
    }, []);

    return (
        <div className="manage-container">
            <div className="manage-header">
                <div className="header-info">
                    <button className="back-btn" onClick={() => navigate("/dashboard")}>← Dashboard</button>
                    <h2>📜 Riwayat Transaksi Penjualan</h2>
                </div>
            </div>

            <div className="table-wrapper">
                <table className="styled-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Kasir</th>
                            <th>Tanggal</th>
                            <th>Total Bayar</th>
                            <th style={{ textAlign: "center" }}>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.length > 0 ? (
                            transactions.map((t) => (
                                <tr key={t.id}>
                                    <td>TRX-{t.id}</td>
                                    <td>{t.kasir_name}</td>
                                    <td>{new Date(t.created_at).toLocaleString('id-ID')}</td>
                                    <td style={{ fontWeight: "bold", color: "#27ae60" }}>
                                        Rp {Number(t.total_amount).toLocaleString('id-ID')}
                                    </td>
                                    <td className="action-btns">
                                        <button 
                                            className="edit-btn" 
                                            style={{ backgroundColor: "#3498db" }}
                                            onClick={() => navigate(`/detail-transaksi/${t.id}`)}
                                        >
                                            🔍 Detail
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan="5" style={{ textAlign: "center" }}>Belum ada transaksi.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TransactionHistory;