import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../App.css";

const ManageCategories = () => {
    const [categories, setCategories] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [currentId, setCurrentId] = useState(null);
    
    // Sesuai categories.js: hanya butuh name dan description
    const [formData, setFormData] = useState({
        name: "",
        description: ""
    });

    const navigate = useNavigate();
    const token = localStorage.getItem("token");

    // 1. GET /categories (Sesuai rute backend kamu)
    const fetchCategories = () => {
        axios.get("http://localhost:3000/categories", {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => {
            // Sesuai backend: res.data.categories
            setCategories(res.data.categories);
        })
        .catch(err => console.error("Gagal ambil data kategori:", err));
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const openModal = (category = null) => {
        if (category) {
            setIsEdit(true);
            setCurrentId(category.id);
            setFormData({
                name: category.name,
                description: category.description || ""
            });
        } else {
            setIsEdit(false);
            setFormData({ name: "", description: "" });
        }
        setShowModal(true);
    };

    // 2. POST & PUT /categories (Sesuai logic di categories.js)
    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Data yang dikirim disesuaikan dengan req.body di backend
        const dataToSend = {
            name: formData.name,
            description: formData.description
        };

        const method = isEdit ? "put" : "post";
        const url = isEdit 
            ? `http://localhost:3000/categories/${currentId}` 
            : "http://localhost:3000/categories";

        axios({
            method: method,
            url: url,
            data: dataToSend,
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(() => {
            alert(isEdit ? "Kategori berhasil diperbarui! ✨" : "Kategori berhasil ditambahkan! ✅");
            setShowModal(false);
            fetchCategories();
        })
        .catch(err => {
            alert(err.response?.data?.message || "Terjadi kesalahan!");
        });
    };

    // 3. DELETE /categories/:id (Sesuai rute backend kamu)
    const handleDelete = (id, name) => {
        if (window.confirm(`Yakin ingin menghapus kategori "${name}"?`)) {
            axios.delete(`http://localhost:3000/categories/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            .then(() => {
                alert("Kategori dihapus! 🗑️");
                fetchCategories();
            })
            .catch(err => alert("Gagal Menghapus Kategori, Kategori Sedang Dipakai Produk!"));
        }
    };

    return (
        <div className="manage-container">
            <div className="manage-header">
                <div className="header-info">
                    <button className="back-btn" onClick={() => navigate("/dashboard")}>← Dashboard</button>
                    <h2>📁 Kelola Kategori Produk</h2>
                </div>
                <button className="add-product-btn" onClick={() => openModal()}>
                    + Tambah Kategori
                </button>
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>{isEdit ? "✏️ Edit Kategori" : "➕ Tambah Kategori Baru"}</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Nama Kategori</label>
                                <input 
                                    type="text" 
                                    placeholder="Contoh: Smartphone"
                                    value={formData.name} 
                                    onChange={(e) => setFormData({...formData, name: e.target.value})} 
                                    required 
                                />
                            </div>
                            
                            <div className="form-group">
                                <label>Deskripsi</label>
                                <textarea 
                                    rows="3" 
                                    placeholder="Penjelasan singkat kategori..."
                                    value={formData.description} 
                                    onChange={(e) => setFormData({...formData, description: e.target.value})} 
                                />
                            </div>
                            
                            <div className="modal-actions">
                                <button type="submit" className="save-btn">Simpan Data</button>
                                <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>Batal</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="table-wrapper">
                <table className="styled-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nama Kategori</th>
                            <th>Deskripsi</th>
                            <th style={{ textAlign: "center" }}>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {categories.length > 0 ? (
                            categories.map((c) => (
                                <tr key={c.id}>
                                    <td>{c.id}</td>
                                    <td style={{ fontWeight: "600", color: "#003366" }}>{c.name}</td>
                                    <td className="desc-cell">
                                        {c.description || "-"}
                                    </td>
                                    <td className="action-btns">
                                        <button className="edit-btn" onClick={() => openModal(c)}>✏️ Edit</button>
                                        <button className="delete-btn" onClick={() => handleDelete(c.id, c.name)}>🗑️ Hapus</button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4" style={{ textAlign: "center", padding: "20px" }}>Data kategori kosong.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ManageCategories;