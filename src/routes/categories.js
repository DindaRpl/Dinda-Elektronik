const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const verifyToken = require('../middleware/auth');
const { verifyAdmin } = require('../middleware/verifyRole');


/**
 * @swagger
 * tags:
 * name: Category Management
 * description: Operasi CRUD untuk Kategori Produk (Hanya Admin)
 */


/** ------------------------------------
 * 1. GET /categories
 * ------------------------------------
 * @swagger
 * /categories:
 * get:
 * tags: [Category Management]
 * summary: Mengambil daftar semua kategori produk (Hanya Admin)
 * security:
 * - BearerAuth: []
 * responses:
 * 200:
 * description: Daftar kategori berhasil diambil.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * message: { type: string, example: Daftar kategori berhasil diambil. }
 * total: { type: integer, example: 3 }
 * categories:
 * type: array
 * items:
 * type: object
 * properties:
 * id: { type: integer, example: 1 }
 * name: { type: string, example: Makanan Ringan }
 * description: { type: string, example: Semua jenis makanan ringan. }
 * created_at: { type: string, format: date-time }
 * updated_at: { type: string, format: date-time }
 * 403:
 * description: Akses ditolak (Bukan Admin)
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/ErrorMessage'
 */
router.get('/', verifyToken, verifyAdmin, async (req, res) => {
    try {
        // PERBAIKAN: Menggunakan 'id' bukan 'id_category' dan menyertakan 'description'
        const result = await pool.query('SELECT id, name, description, created_at, updated_at FROM categories ORDER BY id ASC');
        
        res.status(200).json({
            message: 'Daftar kategori berhasil diambil.',
            total: result.rowCount,
            categories: result.rows
        });
    } catch (err) {
        console.error('Error fetching categories:', err.message);
        res.status(500).json({ message: 'Server error saat mengambil data kategori.' });
    }
});


/** ------------------------------------
 * 2. GET /categories/:id
 * ------------------------------------
 * @swagger
 * /categories/{id}:
 * get:
 * tags: [Category Management]
 * summary: Mengambil detail kategori berdasarkan ID (Hanya Admin)
 * security:
 * - BearerAuth: []
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: integer
 * example: 1
 * responses:
 * 200:
 * description: Detail kategori berhasil diambil.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * message: { type: string, example: Detail kategori berhasil diambil. }
 * category:
 * type: object
 * properties:
 * id: { type: integer, example: 1 }
 * name: { type: string, example: Makanan Ringan }
 * description: { type: string, example: Semua jenis makanan ringan. }
 * created_at: { type: string, format: date-time }
 * updated_at: { type: string, format: date-time }
 * 404:
 * description: Kategori tidak ditemukan.
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/ErrorMessage'
 */
router.get('/:id', verifyToken, verifyAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        
        const result = await pool.query('SELECT id, name, description, created_at, updated_at FROM categories WHERE id = $1', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Kategori tidak ditemukan.' });
        }
        res.status(200).json({
            message: 'Detail kategori berhasil diambil.',
            category: result.rows[0]
        });
    } catch (err) {
        console.error('Error fetching category by ID:', err.message);
        res.status(500).json({ message: 'Server error saat mengambil detail kategori.' });
    }
});


/** ------------------------------------
 * 3. POST /categories
 * ------------------------------------
 * @swagger
 * /categories:
 * post:
 * tags: [Category Management]
 * summary: Menambahkan kategori baru (Hanya Admin)
 * security:
 * - BearerAuth: []
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - name
 * properties:
 * name:
 * type: string
 * example: Minuman Dingin
 * description:
 * type: string
 * example: Semua minuman yang disajikan dingin.
 * responses:
 * 201:
 * description: Kategori berhasil ditambahkan.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * message: { type: string, example: Kategori berhasil ditambahkan. }
 * category:
 * type: object
 * properties:
 * id: { type: integer, example: 4 }
 * name: { type: string, example: Minuman Dingin }
 * description: { type: string, example: Semua minuman yang disajikan dingin. }
 * 400:
 * description: Nama kategori wajib diisi.
 * 403:
 * description: Akses ditolak (Bukan Admin)
 * 500:
 * description: Server Error
 */
router.post('/', verifyToken, verifyAdmin, async (req, res) => {
    // Menambahkan kolom 'description' dari request body
    const { name, description } = req.body;
    
    if (!name) {
        return res.status(400).json({ message: 'Nama kategori wajib diisi.' });
    }
    
    try {
        // PERBAIKAN: Menggunakan 'id' di RETURNING. Menambahkan 'description'
        const insertQuery = `
            INSERT INTO categories (name, description) 
            VALUES ($1, COALESCE($2, '')) 
            RETURNING id, name, description, created_at, updated_at
        `;

        const result = await pool.query(insertQuery, [name, description]);
        
        res.status(201).json({
            message: 'Kategori berhasil ditambahkan.',
            category: result.rows[0]
        });
    } catch (err) {
        console.error('Error creating category:', err.message);
        res.status(500).json({ message: 'Server error saat menambahkan kategori.' });
    }
});


/** ------------------------------------
 * 4. PUT /categories/:id
 * ------------------------------------
 * @swagger
 * /categories/{id}:
 * put:
 * tags: [Category Management]
 * summary: Memperbarui nama dan deskripsi kategori (Hanya Admin)
 * security:
 * - BearerAuth: []
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: integer
 * example: 1
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - name
 * properties:
 * name:
 * type: string
 * example: Makanan Ringan dan Berat
 * description:
 * type: string
 * example: Kumpulan snack dan makanan utama.
 * responses:
 * 200:
 * description: Kategori berhasil diperbarui.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * message: { type: string, example: Kategori berhasil diperbarui. }
 * category:
 * type: object
 * properties:
 * id: { type: integer, example: 1 }
 * name: { type: string, example: Makanan Ringan dan Berat }
 * description: { type: string, example: Kumpulan snack dan makanan utama. }
 * updated_at: { type: string, format: date-time }
 * 404:
 * description: Kategori tidak ditemukan.
 * 403:
 * description: Akses ditolak (Bukan Admin)
 * 500:
 * description: Server Error
 */
router.put('/:id', verifyToken, verifyAdmin, async (req, res) => {
    const { id } = req.params;
    // Menambahkan 'description' ke update body
    const { name, description } = req.body;
    
    if (!name) {
        return res.status(400).json({ message: 'Nama kategori wajib diisi.' });
    }
    
    try {
        // PERBAIKAN: Menggunakan 'id' di klausa WHERE dan RETURNING. Memasukkan 'description' ke UPDATE.
        const updateQuery = `
            UPDATE categories 
            SET name = $1, description = COALESCE($2, description), updated_at = NOW() 
            WHERE id = $3 
            RETURNING id, name, description, updated_at
        `;

        const result = await pool.query(updateQuery, [name, description, id]);
        
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Kategori tidak ditemukan.' });
        }
        
        res.status(200).json({
            message: 'Kategori berhasil diperbarui.',
            category: result.rows[0]
        });
    } catch (err) {
        console.error('Error updating category:', err.message);
        res.status(500).json({ message: 'Server error saat memperbarui kategori.' });
    }
});


/** ------------------------------------
 * 5. DELETE /categories/:id
 * ------------------------------------
 * @swagger
 * /categories/{id}:
 * delete:
 * tags: [Category Management]
 * summary: Menghapus kategori berdasarkan ID (Hanya Admin)
 * security:
 * - BearerAuth: []
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: integer
 * example: 1
 * responses:
 * 200:
 * description: Kategori berhasil dihapus.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * message: { type: string, example: Kategori berhasil dihapus. }
 * id: { type: integer, example: 1 }
 * 404:
 * description: Kategori tidak ditemukan.
 * 403:
 * description: Akses ditolak (Bukan Admin)
 * 500:
 * description: Server Error
 */
router.delete('/:id', verifyToken, verifyAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        // PERBAIKAN: Menggunakan 'id' di klausa WHERE dan RETURNING
        const result = await pool.query('DELETE FROM categories WHERE id = $1 RETURNING id', [id]);
        
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Kategori tidak ditemukan.' });
        }
        
        res.status(200).json({
            message: 'Kategori berhasil dihapus.',
            // PERBAIKAN: Menggunakan 'id' di response body
            id: result.rows[0].id
        });
    } catch (err) {
        console.error('Error deleting category:', err.message);
        res.status(500).json({ message: 'Server error saat menghapus kategori.' });
    }
});

module.exports = router;