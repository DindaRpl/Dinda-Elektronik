import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Dashboard.css";
import Header from "./Header";
import Footer from "./Footer";
import ProductCard from "./components/ProductCard";

function Dashboard() {
    const [products, setProducts] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState("Semua");
    const [searchTerm, setSearchTerm] = useState(""); 
    const [cart, setCart] = useState([]); 
    const [showCart, setShowCart] = useState(false); 
    const [selectedItems, setSelectedItems] = useState([]); 
    const [userData, setUserData] = useState(null);

    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("token");
        const savedUser = localStorage.getItem("user");

        if (!token) {
            navigate("/login");
        } else {
            if (savedUser) {
                setUserData(JSON.parse(savedUser));
            }
            fetchProducts();
        }
    }, [navigate]);

    const fetchProducts = async () => {
        const token = localStorage.getItem("token");
        try {
            const response = await axios.get("http://localhost:3000/products", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProducts(response.data.products); 
        } catch (error) {
            console.error("Gagal mengambil data produk:", error);
        }
    };

    // --- FUNGSI KERANJANG ---
    const addToCart = (product) => {
        const existingItemIndex = cart.findIndex(item => item.id === product.id);
        if (existingItemIndex !== -1) {
            const updatedCart = [...cart];
            updatedCart[existingItemIndex].quantity += 1;
            setCart(updatedCart);
        } else {
            setCart((prevCart) => [...prevCart, { ...product, quantity: 1 }]);
        }
        alert(`${product.name} masuk ke keranjang 🛒`);
    };

    // --- FUNGSI BARU: BELI SEKARANG (Create Transaction) ---
    const handleBuyNow = async (product) => {
        const token = localStorage.getItem("token");
        const confirmBuy = window.confirm(`Konfirmasi pembelian ${product.name}?`);
        
        if (confirmBuy) {
            try {
                const dataTransaksi = {
                    items: [{ product_id: product.id, quantity: 1 }]
                };

                const response = await axios.post("http://localhost:3000/transactions", dataTransaksi, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (response.status === 201) {
                    alert("Pembayaran Berhasil! Stok telah diperbarui. 🚀");
                    fetchProducts(); // Refresh stok tanpa reload halaman
                }
            } catch (error) {
                alert(error.response?.data?.message || "Gagal memproses transaksi.");
            }
        }
    };

    // --- FUNGSI BARU: LIHAT DETAIL (Read Detail) ---
    const handleViewDetail = (product) => {
        alert(`📄 DETAIL PRODUK\n\nNama: ${product.name}\nKategori: ${product.category_name}\nDeskripsi: ${product.description || "Tidak ada deskripsi"}\nStok Tersisa: ${product.stock}`);
    };

    const updateQuantity = (index, delta) => {
        const updatedCart = [...cart];
        const newQuantity = (updatedCart[index].quantity || 1) + delta;
        if (newQuantity >= 1) {
            updatedCart[index].quantity = newQuantity;
            setCart(updatedCart);
        }
    };

    const removeFromCart = (indexToRemove) => {
        const itemToRemove = cart[indexToRemove];
        const updatedCart = cart.filter((_, index) => index !== indexToRemove);
        setCart(updatedCart);
        setSelectedItems(selectedItems.filter(id => id !== itemToRemove.id));
    };

    const toggleSelect = (productId) => {
        if (selectedItems.includes(productId)) {
            setSelectedItems(selectedItems.filter(id => id !== productId));
        } else {
            setSelectedItems([...selectedItems, productId]);
        }
    };

    const totalPrice = cart
        .filter(item => selectedItems.includes(item.id))
        .reduce((sum, item) => sum + (Number(item.price) * (item.quantity || 1)), 0);

    const filteredProducts = products.filter((item) => {
        const categoryMapping = {
            1: "Smartphone", 2: "Laptop", 3: "Peralatan Rumah Tangga",
            4: "Audio & Hiburan", 5: "Gaming & Konsol"
        };
        const categoryName = item.category_name || categoryMapping[item.category_id] || item.category;
        const matchesCategory = selectedCategory === "Semua" || categoryName === selectedCategory;
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    return (
        <>
            <Header 
                searchTerm={searchTerm} 
                setSearchTerm={setSearchTerm} 
                selectedCategory={selectedCategory} 
                setSelectedCategory={setSelectedCategory}
                cartCount={cart.reduce((sum, item) => sum + (item.quantity || 1), 0)}
                onCartClick={() => setShowCart(true)} 
                onLogoClick={() => setShowCart(false)}
                user={userData} 
            /> 

            <div className="dashboard-container">
                {showCart ? (
                    /* ... (Bagian Cart View tetap sama seperti sebelumnya) ... */
                    <div className="cart-view-container">
                        <div className="cart-header-shopee">
                            <h2 className="cart-title">🛒 Keranjang Belanja</h2>
                            <button className="back-shopping-btn" onClick={() => setShowCart(false)}>← Kembali</button>
                        </div>
                        {/* Render isi cart di sini (seperti kode awalmu) */}
                        <div className="cart-content-shopee">
                             <div className="cart-items-list-shopee">
                                {cart.length > 0 ? cart.map((item, index) => (
                                    <div key={index} className="cart-item-card-shopee">
                                        <input type="checkbox" onChange={() => toggleSelect(item.id)} checked={selectedItems.includes(item.id)} />
                                        <img src={item.images || "https://via.placeholder.com/150"} alt={item.name} className="cart-item-img-shopee" />
                                        <div className="cart-item-details-shopee">
                                            <h4>{item.name}</h4>
                                            <p>Rp {Number(item.price).toLocaleString('id-ID')}</p>
                                        </div>
                                        <div className="cart-item-action-shopee">
                                            <button onClick={() => updateQuantity(index, -1)}>−</button>
                                            <span>{item.quantity}</span>
                                            <button onClick={() => updateQuantity(index, 1)}>+</button>
                                            <button onClick={() => removeFromCart(index)}>🗑️</button>
                                        </div>
                                    </div>
                                )) : <p>Keranjang kosong</p>}
                             </div>
                             {/* Summary Cart */}
                             <div className="cart-summary-card-shopee">
                                <h3>Total: Rp {totalPrice.toLocaleString('id-ID')}</h3>
                                <button className="checkout-btn-shopee" disabled={selectedItems.length === 0}>Checkout</button>
                             </div>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="recommendation-section">
                            <h2 className="section-title">✨ Produk Rekomendasi Untukmu</h2>
                            <div className="recommendation-grid">
                                {products.slice(0, 3).map((prod) => (
                                    <div key={prod.id} className="recommend-item" onClick={() => handleViewDetail(prod)} style={{cursor:'pointer'}}>
                                        <span>🔥 HOT: </span> <strong>{prod.name}</strong>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <h2 className="dashboard-title">Katalog Produk Unggulan</h2>

                        <div className="product-grid">
                            {filteredProducts.length > 0 ? (
                                filteredProducts.map((item) => (
                                    <ProductCard
                                        key={item.id}
                                        title={item.name}
                                        description={`${item.brand || 'Original'} | Stok: ${item.stock}`} 
                                        price={Number(item.price).toLocaleString('id-ID')}
                                        image={item.images || "https://via.placeholder.com/500?text=Produk"}
                                        onAddToCart={() => addToCart(item)}
                                        // PASANG FUNGSI BARU DISINI
                                        onBuyNow={() => handleBuyNow(item)}
                                        onViewDetail={() => handleViewDetail(item)}
                                    />
                                ))
                            ) : (
                                <p className="no-product">Produk tidak ditemukan...</p>
                            )}
                        </div>
                    </>
                )}
                <Footer />
            </div>
        </>
    );
}

export default Dashboard;