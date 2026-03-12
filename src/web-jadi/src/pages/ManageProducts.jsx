import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../App.css";

const ManageProducts = () => {
    const [products, setProducts] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [currentId, setCurrentId] = useState(null);
    
    // images sudah masuk ke state
    const [formData, setFormData] = useState({
        category_id: 1, 
        name: "",
        brand: "",
        description: "",
        price: "",
        stock: "",
        images: "" 
    });

    const navigate = useNavigate();
    const token = localStorage.getItem("token");

    const fetchProducts = () => {
        axios.get("http://localhost:3000/products", {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => setProducts(res.data.products))
        .catch(err => console.error("Gagal ambil data:", err));
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const openModal = (product = null) => {
        if (product) {
            setIsEdit(true);
            setCurrentId(product.id);
            setFormData({
                category_id: product.category_id || 1,
                name: product.name,
                brand: product.brand || "",
                description: product.description || "",
                price: product.price,
                stock: product.stock,
                images: product.images || ""
            });
        } else {
            setIsEdit(false);
            setFormData({ category_id: 1, name: "", brand: "", description: "", price: "", stock: "", images: "" });
        }
        setShowModal(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const dataToSend = {
            category_id: parseInt(formData.category_id),
            name: formData.name,
            brand: formData.brand,
            description: formData.description,
            price: parseFloat(formData.price),
            stock: parseInt(formData.stock),
            images: formData.images
        };

        const method = isEdit ? "put" : "post";
        const url = isEdit 
            ? `http://localhost:3000/products/${currentId}` 
            : "http://localhost:3000/products";

        axios({
            method: method,
            url: url,
            data: dataToSend,
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(() => {
            alert(isEdit ? "Produk diperbarui!" : "Produk ditambahkan!");
            setShowModal(false);
            fetchProducts();
        })
        .catch(err => {
            alert(err.response?.data?.message || "Gagal!");
        });
    };

    const handleDelete = (id, name) => {
        if (window.confirm(`Delete "${name}"?`)) {
            axios.delete(`http://localhost:3000/products/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            .then(() => {
                alert("Deleted! 🗑️");
                fetchProducts();
            })
            .catch(err => alert("Failed!"));
        }
    };

    return (
        <div className="manage-container">
            <div className="manage-header">
                <div className="header-info">
                    <button className="back-btn" onClick={() => navigate("/dashboard")}>← Dashboard</button>
                    <h2>📦 Kelola Produk</h2>
                </div>
                <button className="add-product-btn" onClick={() => openModal()}>
                    + Tambah Produk
                </button>
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>{isEdit ? "✏️ edit_product" : "➕ Tambah Produk"}</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>category_id</label>
                                    <input type="number" value={formData.category_id} onChange={(e) => setFormData({...formData, category_id: e.target.value})} required />
                                </div>
                                <div className="form-group">
                                    <label>name</label>
                                    <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
                                </div>
                            </div>
                            
                            <div className="form-group">
                                <label>brand</label>
                                <input type="text" value={formData.brand} onChange={(e) => setFormData({...formData, brand: e.target.value})} />
                            </div>

                            <div className="form-group">
                                <label>images (URL)</label>
                                <input type="text" value={formData.images} onChange={(e) => setFormData({...formData, images: e.target.value})} placeholder="https://unsplash.com/..." />
                            </div>
                            
                            <div className="form-group">
                                <label>description</label>
                                <textarea rows="3" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
                            </div>
                            
                            <div className="form-row">
                                <div className="form-group">
                                    <label>price</label>
                                    <input type="number" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} required />
                                </div>
                                <div className="form-group">
                                    <label>stock</label>
                                    <input type="number" value={formData.stock} onChange={(e) => setFormData({...formData, stock: e.target.value})} required />
                                </div>
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
                            <th>id</th>
                            <th>images</th>
                            <th>name</th>
                            <th>brand</th>
                            <th>description</th>
                            <th>price</th>
                            <th>stock</th>
                            <th style={{ textAlign: "center" }}>action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((p) => (
                            <tr key={p.id}>
                                <td>{p.id}</td>
                                <td>
                                    <img 
                                        src={p.images || "https://via.placeholder.com/50"} 
                                        alt={p.name} 
                                        style={{ width: "50px", height: "50px", borderRadius: "8px", objectFit: "cover", border: "1px solid #eee" }} 
                                    />
                                </td>
                                <td className="product-name-cell">{p.name}</td>
                                <td style={{ fontWeight: "500", color: "#555" }}>{p.brand || "-"}</td>
                                <td className="desc-cell">
                                    {p.description && p.description.length > 30 
                                        ? p.description.substring(0, 30) + "..." 
                                        : p.description || "-"}
                                </td>
                                <td>Rp {Number(p.price).toLocaleString('id-ID')}</td>
                                <td>
                                    <span className={`stock-badge ${p.stock < 10 ? 'low-stock' : ''}`}>
                                        {p.stock}
                                    </span>
                                </td>
                                <td className="action-btns">
                                    <button className="edit-btn" onClick={() => openModal(p)}>✏️ edit</button>
                                    <button className="delete-btn" onClick={() => handleDelete(p.id, p.name)}>🗑️ delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ManageProducts;