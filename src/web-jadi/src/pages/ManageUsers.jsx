import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../App.css";

const ManageUsers = () => {
    const [users, setUsers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [currentId, setCurrentId] = useState(null);
    
    // Sesuaikan dengan kunci ID di token kamu (id_user)
    const loggedInUserId = localStorage.getItem("user_id"); 

    const [formData, setFormData] = useState({
        username: "",
        full_name: "", // Tambahan sesuai backend
        password: "",
        role: "kasir", // Default sesuai backend
        is_active: true 
    });

    const navigate = useNavigate();
    const token = localStorage.getItem("token");

    // ALAMAT API: Sesuaikan dengan route di server.js kamu (misal /user-management)
    const API_URL = "http://localhost:3000/user-management";

    const fetchUsers = () => {
        axios.get(API_URL, {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => {
            // Backend kamu mengirim objek { users: [...] }
            setUsers(res.data.users); 
        })
        .catch(err => console.error("Gagal ambil data user:", err));
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const openModal = (user = null) => {
        if (user) {
            setIsEdit(true);
            setCurrentId(user.id_user); // Pake id_user
            setFormData({
                username: user.username,
                full_name: user.full_name,
                password: "",
                role: user.role,
                is_active: user.is_active
            });
        } else {
            setIsEdit(false);
            setFormData({ username: "", full_name: "", password: "", role: "kasir", is_active: true });
        }
        setShowModal(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (isEdit && currentId === parseInt(loggedInUserId) && formData.is_active === false) {
            alert("⚠️ Bahaya! Jangan nonaktifkan akun sendiri!");
            return;
        }

        // Jika edit pake PUT ke /:id_user, jika baru pake POST ke /register
        const url = isEdit ? `${API_URL}/${currentId}` : `${API_URL}/register`;
        const method = isEdit ? "put" : "post";

        axios({
            method: method,
            url: url,
            data: formData,
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(() => {
            alert(isEdit ? "Data diperbarui! ✨" : "User baru terdaftar! 🚀");
            setShowModal(false);
            fetchUsers();
        })
        .catch(err => alert(err.response?.data?.message || "Ada error!"));
    };

    return (
        <div className="manage-container">
            <div className="manage-header">
                <div className="header-info">
                    <button className="back-btn" onClick={() => navigate("/dashboard")}>← Dashboard</button>
                    <h2>👥 Kelola User</h2>
                </div>
                <button className="add-product-btn" onClick={() => openModal()}>
                    + Tambah User
                </button>
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>{isEdit ? "✏️ edit_user" : "➕ Tambah User"}</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>username</label>
                                <input type="text" value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} required disabled={isEdit} />
                            </div>
                            <div className="form-group">
                                <label>full_name (Nama Lengkap)</label>
                                <input type="text" value={formData.full_name} onChange={(e) => setFormData({...formData, full_name: e.target.value})} required />
                            </div>
                            {!isEdit && (
                                <div className="form-group">
                                    <label>password</label>
                                    <input type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required />
                                </div>
                            )}
                            <div className="form-group">
                                <label>role</label>
                                <select value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})}>
                                    <option value="kasir">kasir</option>
                                    <option value="admin">admin</option>
                                </select>
                            </div>
                            <div className="form-group-checkbox">
                                <label>
                                    <input 
                                        type="checkbox" 
                                        checked={formData.is_active} 
                                        onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                                        disabled={isEdit && currentId === parseInt(loggedInUserId)} 
                                    />
                                    is_active (Status Aktif)
                                </label>
                            </div>
                            <div className="modal-actions">
                                <button type="submit" className="save-btn">Simpan</button>
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
                            <th>id_user</th>
                            <th>username</th>
                            <th>full_name</th>
                            <th>role</th>
                            <th>status</th>
                            <th style={{ textAlign: "center" }}>action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((u) => (
                            <tr key={u.id_user}>
                                <td>{u.id_user}</td>
                                <td>{u.username}</td>
                                <td>{u.full_name}</td>
                                <td><span className={`role-badge ${u.role}`}>{u.role}</span></td>
                                <td>
                                    <span className={`status-pill ${u.is_active ? 'active' : 'inactive'}`}>
                                        {u.is_active ? "● Aktif" : "○ Nonaktif"}
                                    </span>
                                </td>
                                <td className="action-btns">
                                    <button className="edit-btn" onClick={() => openModal(u)}>✏️ edit</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ManageUsers;