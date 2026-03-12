const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const verifyToken = require('../middleware/auth');
const { verifyAdmin, verifyCashier, verifyRoles } = require('../middleware/verifyRole');
const ADMIN_CASHIER = ['admin', 'cashier', 'kasir'];

/**
 * @swagger
 * components:
 * schemas:
 * Product:
 * type: object
 * properties:
 * id: { type: integer, description: ID unik produk. }
 * category_id: { type: integer, description: ID kategori. }
 * category_name: { type: string, description: Nama kategori (hanya untuk GET). }
 * name: { type: string, description: Nama produk. }
 * brand: { type: string, description: Merek produk. }
 * description: { type: string, description: Deskripsi lengkap produk. }
 * price: { type: number, format: float, description: Harga jual produk. }
 * stock: { type: integer, description: Jumlah stok produk. }
 * created_at: { type: string, format: date-time, description: Waktu pembuatan. }
 * updated_at: { type: string, format: date-time, description: Waktu pembaruan. }
 */

/**
 * @swagger
 * tags:
 * name: Product Management
 * description: Operasi CRUD untuk Produk (Hanya Admin)
 */

// Fungsi untuk mengambil semua kolom produk (Menggunakan category_id)
const productSelectQuery = `
    SELECT 
        p.id, 
        p.category_id, -- Kolom yang benar di tabel Anda
        c.name as category_name,
        p.name, 
        p.brand, 
        p.description,
        p.price, 
        p.stock, 
        p.created_at,
        p.updated_at,
        p.images
    FROM products p
    JOIN categories c ON p.category_id = c.id -- Join menggunakan category_id
`;

// ----------------------------------------
// 1. GET /products (Retrieve All Products)
// ----------------------------------------
router.get('/', verifyToken, verifyRoles(ADMIN_CASHIER), async (req, res) => {
    try {
        const query = `${productSelectQuery} ORDER BY p.id ASC`;
        const result = await pool.query(query);
        res.status(200).json({
            message: 'Daftar produk berhasil diambil.',
            total: result.rowCount,
            products: result.rows
        });
    } catch (err) {
        
        console.error('Error fetching products:', err.message);
        res.status(500).json({ message: 'Server error saat mengambil data produk.' });
    }
});

// ----------------------------------------
// 2. GET /products/:id (Retrieve Product by ID)
// ----------------------------------------
router.get('/:id', verifyToken, verifyAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const query = `${productSelectQuery} WHERE p.id = $1`;
        const result = await pool.query(query, [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Produk tidak ditemukan.' });
        }
        res.status(200).json({
            message: 'Detail produk berhasil diambil.',
            product: result.rows[0]
        });
    } catch (err) {
        console.error('Error fetching product by ID:', err.message);
        res.status(500).json({ message: 'Server error saat mengambil detail produk.' });
    }
});


// ----------------------------------------
// 3. POST /products (Create New Product)
// ----------------------------------------
/**
 * @swagger
 * /products:
 * post:
 * tags: [Product Management]
 * summary: Menambahkan produk baru (Hanya Admin)
 * security:
 * - BearerAuth: []
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - category_id
 * - name
 * - price
 * - stock
 * properties:
 * category_id: { type: integer, example: 2, description: ID kategori produk. }
 * name: { type: string, example: iPhone 15 Pro Max, description: Nama produk. }
 * brand: { type: string, example: Apple, description: Merek produk. }
 * description: { type: string, example: Layar 6.7 inch, Chip A17 Bionic, Kamera 48MP. Wajib diisi (walaupun boleh string kosong). }
 * price: { type: number, format: float, example: 21999000, description: Harga jual produk. }
 * stock: { type: integer, example: 25, description: Jumlah stok awal. }
 * responses:
 * 201:
 * description: Produk berhasil ditambahkan.
 * 400:
 * description: Validasi input gagal (data wajib tidak lengkap).
 * 404:
 * description: Kategori tidak ditemukan.
 * 500:
 * description: Server Error
 */
router.post('/', verifyToken, verifyAdmin, async (req, res) => {
    // Menggunakan category_id sesuai skema DB Anda
    const { category_id, name, brand, description, price, stock } = req.body; 

    // Memastikan kolom WAJIB diisi
    if (!category_id || !name || price === undefined || stock === undefined) {
        return res.status(400).json({ message: 'Kolom wajib (category_id, name, price, stock) harus diisi.' });
    }

    try {
        // Cek apakah kategori ada
        const categoryCheck = await pool.query('SELECT 1 FROM categories WHERE id = $1', [category_id]); 
        if (categoryCheck.rows.length === 0) {
            return res.status(404).json({ message: 'Kategori dengan ID tersebut tidak ditemukan.' });
        }

        const result = await pool.query(
            'INSERT INTO products (category_id, name, brand, description, price, stock) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, brand',
            [category_id, name, brand || null, description || null, price, stock] 
        );

        res.status(201).json({
            message: 'Produk berhasil ditambahkan.',
            product: result.rows[0]
        });
    } catch (err) {
        console.error('Error creating product:', err.message);
        res.status(500).json({ message: 'Server error saat menambahkan produk.' });
    }
});


// ----------------------------------------
// 4. PUT /products/:id (Update Product)
// ----------------------------------------
/**
 * @swagger
 * /products/{id}:
 * put:
 * tags: [Product Management]
 * summary: Memperbarui detail produk berdasarkan ID (Hanya Admin)
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * category_id: { type: integer, example: 2, description: (Opsional) ID kategori baru. }
 * name: { type: string, example: iPhone 15 Pro Max, description: (Opsional) Nama produk baru. }
 * brand: { type: string, example: Apple Inc., description: (Opsional) Merek produk baru. }
 * description: { type: string, example: Layar 6.7 inch, Chip A17 Bionic. Edisi titanium. }
 * price: { type: number, format: float, example: 22000000, description: (Opsional) Harga jual baru. }
 * stock: { type: integer, example: 30, description: (Opsional) Jumlah stok baru. }
 * responses:
 * 200:
 * description: Produk berhasil diperbarui.
 * 400:
 * description: Tidak ada data yang disediakan untuk pembaruan.
 * 404:
 * description: Produk atau Kategori tidak ditemukan.
 */
router.put('/:id', verifyToken, verifyAdmin, async (req, res) => {
    const { id } = req.params;
    // Menggunakan category_id sesuai skema DB Anda
    const { category_id, name, brand, description, price, stock } = req.body; 

    const updates = [];
    const values = [];
    let paramIndex = 1;

    // Menggunakan category_id
    if (category_id !== undefined) {
        updates.push(`category_id = $${paramIndex++}`); 
        values.push(category_id);
    }
    if (name !== undefined) {
        updates.push(`name = $${paramIndex++}`);
        values.push(name);
    }
    if (brand !== undefined) { 
        updates.push(`brand = $${paramIndex++}`);
        values.push(brand);
    }
    if (description !== undefined) { 
        updates.push(`description = $${paramIndex++}`);
        values.push(description);
    }
    if (price !== undefined) {
        updates.push(`price = $${paramIndex++}`);
        values.push(price);
    }
    if (stock !== undefined) {
        updates.push(`stock = $${paramIndex++}`);
        values.push(stock);
    }

    if (updates.length === 0) {
        return res.status(400).json({ message: 'Tidak ada data yang disediakan untuk pembaruan.' });
    }

    try {
        // Cek kategori jika category_id diubah
        if (category_id !== undefined) {
            const categoryCheck = await pool.query('SELECT 1 FROM categories WHERE id = $1', [category_id]); 
            if (categoryCheck.rows.length === 0) {
                return res.status(404).json({ message: 'Kategori dengan ID tersebut tidak ditemukan.' });
            }
        }

        values.push(id); // Parameter terakhir adalah id produk dari path
        const updateQuery = `
            UPDATE products 
            SET ${updates.join(', ')}, updated_at = NOW() 
            WHERE id = $${paramIndex}
            RETURNING id
        `;
        
        const updateResult = await pool.query(updateQuery, values);

        if (updateResult.rowCount === 0) {
            return res.status(404).json({ message: 'Produk tidak ditemukan.' });
        }

        // Ambil data produk yang sudah diperbarui dengan nama kategori
        const fetchQuery = `${productSelectQuery} WHERE p.id = $1`;
        const fetchResult = await pool.query(fetchQuery, [id]);
        
        res.status(200).json({
            message: 'Produk berhasil diperbarui.',
            product: fetchResult.rows[0]
        });

    } catch (err) {
        console.error('Error updating product:', err.message);
        res.status(500).json({ message: 'Server error saat memperbarui produk.' });
    }
});


// ----------------------------------------
// 5. DELETE /products/:id (Delete Product)
// ----------------------------------------
router.delete('/:id', verifyToken, verifyAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING id', [id]); 
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Produk tidak ditemukan.' });
        }
        res.status(200).json({
            message: 'Produk berhasil dihapus.',
            id: result.rows[0].id
        });
    } catch (err) {
        console.error('Error deleting product:', err.message);
        res.status(500).json({ message: 'Server error saat menghapus produk.' });
    }
});

module.exports = router;