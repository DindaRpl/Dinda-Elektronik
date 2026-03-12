const express = require('express');
const router = express.Router();
// Pastikan path ke pool database Anda benar
const pool = require('../db/pool'); 
const verifyToken = require('../middleware/auth');
// Pastikan path ke middleware role Anda benar
const { 
    verifyCashier, // Digunakan untuk Cashier Saja
    verifyRoles    // Digunakan untuk Admin dan Cashier
} = require('../middleware/verifyRole'); 

// Definisikan array roles yang diizinkan untuk akses ganda (Admin, Cashier, Kasir)
const ADMIN_CASHIER = ['admin', 'cashier', 'kasir']; 

/**
 * @swagger
 * components:
 * schemas:
 * Transaction:
 * type: object
 * properties:
 * id: 
 * type: integer
 * description: ID unik transaksi (Primary Key).
 * example: 5001
 * user_id: 
 * type: integer
 * description: ID user (kasir) yang membuat transaksi.
 * example: 101
 * total_amount: 
 * type: number
 * format: float
 * description: Total harga keseluruhan transaksi.
 * example: 75000.00
 * created_at: 
 * type: string
 * format: date-time
 * description: Waktu transaksi dicatat.
 * TransactionItem:
 * type: object
 * properties:
 * id: 
 * type: integer
 * description: ID unik item transaksi.
 * example: 1
 * transaction_id: 
 * type: integer
 * description: ID transaksi induk.
 * example: 5001
 * product_id: 
 * type: integer
 * description: ID produk yang terjual.
 * example: 1
 * product_name:
 * type: string
 * description: Nama produk yang terjual.
 * example: Kopi Latte
 * quantity: 
 * type: integer
 * description: Jumlah unit produk yang dibeli.
 * example: 3
 * price_per_item: 
 * type: number
 * format: float
 * description: Harga satuan produk saat transaksi dilakukan.
 * example: 25000.00
 * subtotal: 
 * type: number
 * format: float
 * description: Subtotal item (quantity * price_per_item).
 * example: 75000.00
 */

/**
 * @swagger
 * tags:
 * name: Transaction Management
 * description: Operasi untuk membuat, melihat, dan memperbarui Transaksi Penjualan.
 */

// ----------------------------------------
// 1. POST /transactions (Create New Transaction - Admin & Cashier)
// ----------------------------------------
/**
 * @swagger
 * /transactions:
 * post:
 * tags: [Transaction Management]
 * summary: Mencatat transaksi penjualan baru (Admin & Cashier)
 * description: Proses ini akan membuat ID transaksi baru, mengurangi stok produk di inventaris, dan mencatat item transaksi secara atomik.
 * security:
 * - BearerAuth: []
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - items
 * properties:
 * items:
 * type: array
 * description: Daftar produk yang dibeli.
 * items:
 * type: object
 * required:
 * - product_id
 * - quantity
 * properties:
 * product_id: 
 * type: integer
 * example: 1 
 * description: ID produk yang dibeli (sesuai products.id).
 * quantity: 
 * type: integer
 * example: 2 
 * description: Jumlah unit produk yang dibeli.
 * responses:
 * 201:
 * description: Transaksi berhasil dicatat.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * message: { type: string, example: Transaksi berhasil dicatat. Stok produk telah diperbarui. }
 * transaction_id: { type: integer, example: 5002 }
 * total_amount: { type: number, example: 50000.00 }
 * 400:
 * description: Validasi input gagal (misalnya, item kosong, stok tidak cukup, atau product_id tidak valid).
 * 401:
 * description: Autentikasi gagal (Token tidak valid/user ID tidak ditemukan).
 * 403:
 * description: Akses ditolak. Diperlukan hak akses Admin atau Cashier.
 * 500:
 * description: Server Error.
 */
// HAK AKSES: Admin dan Cashier
router.post('/', verifyToken, verifyRoles(ADMIN_CASHIER), async (req, res) => {
    const { items } = req.body;
    // Menggunakan id_user dari payload token yang diisi oleh verifyToken
    const userId = req.user.id_user; 

    if (!items || items.length === 0) {
        return res.status(400).json({ message: 'Daftar item tidak boleh kosong.' });
    }

    if (!userId) {
        // Pengecekan penting jika token valid tapi tidak memiliki req.user.id_user
        return res.status(401).json({ 
            message: 'User ID tidak ditemukan di token. Autentikasi gagal.' 
        });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        let total_amount = 0;
        const transactionItemsData = [];

        // 1. Proses setiap item, cek stok, dan hitung total
        for (const item of items) {
            const { product_id, quantity } = item;

            if (!product_id || !quantity || quantity <= 0 || !Number.isInteger(quantity)) {
                await client.query('ROLLBACK');
                return res.status(400).json({ message: `Data item tidak valid: product_id ${product_id}, quantity ${quantity}. Quantity harus bilangan bulat positif.` });
            }

            // Ambil detail produk dan cek stok dengan LOCK BARIS (FOR UPDATE)
            const productResult = await client.query('SELECT name, price, stock FROM products WHERE id = $1 FOR UPDATE', [product_id]);
            
            if (productResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ message: `Produk dengan ID ${product_id} tidak ditemukan.` });
            }

            const product = productResult.rows[0];
            if (product.stock < quantity) {
                await client.query('ROLLBACK');
                return res.status(400).json({ message: `Stok produk ${product.name} (ID: ${product_id}) tidak cukup. Stok tersedia: ${product.stock}, diminta: ${quantity}.` });
            }

            // Hitung subtotal dan total keseluruhan
            const subtotal = product.price * quantity;
            total_amount += subtotal;

            transactionItemsData.push({
                product_id,
                quantity,
                price: product.price,
                subtotal,
                product_name: product.name
            });

            // Kurangi stok produk
            await client.query('UPDATE products SET stock = stock - $1, updated_at = NOW() WHERE id = $2', [quantity, product_id]);
        }
        
        // Memastikan total_amount tidak negatif (seharusnya tidak terjadi jika logika benar)
        if (total_amount < 0) {
            await client.query('ROLLBACK');
            return res.status(500).json({ message: 'Kesalahan perhitungan total jumlah transaksi.' });
        }


        // 2. Masukkan ke tabel transactions
        const transactionInsertResult = await client.query(
            'INSERT INTO transactions (user_id, total_amount) VALUES ($1, $2) RETURNING id',
            [userId, total_amount]
        );
        const transaction_id_int = transactionInsertResult.rows[0].id;

        // 3. Masukkan ke tabel transaction_items
        for (const itemData of transactionItemsData) {
            await client.query(
                'INSERT INTO transaction_items (transaction_id, product_id, quantity, price_per_item, subtotal) VALUES ($1, $2, $3, $4, $5)',
                [transaction_id_int, itemData.product_id, itemData.quantity, itemData.price, itemData.subtotal]
            );
        }

        await client.query('COMMIT');
        res.status(201).json({
            message: 'Transaksi berhasil dicatat. Stok produk telah diperbarui.',
            transaction_id: transaction_id_int,
            total_amount: parseFloat(total_amount.toFixed(2)) // Format angka untuk respons
        });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error in transaction (POST):', err.message);
        res.status(500).json({ message: 'Server error saat memproses transaksi.', error: err.message });
    } finally {
        client.release();
    }
});

// ----------------------------------------
// 2. GET /transactions (Retrieve All Transactions - Admin & Cashier)
// ----------------------------------------
/**
 * @swagger
 * /transactions:
 * get:
 * tags: [Transaction Management]
 * summary: Mengambil daftar semua transaksi (Admin & Cashier)
 * description: Mengambil ringkasan semua transaksi penjualan, termasuk nama kasir yang mencatatnya.
 * security:
 * - BearerAuth: []
 * responses:
 * 200:
 * description: Daftar transaksi berhasil diambil.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * message: { type: string, example: Daftar transaksi berhasil diambil. }
 * total: { type: integer, example: 10 }
 * transactions:
 * type: array
 * items:
 * type: object
 * properties:
 * id: { type: integer, example: 5001 }
 * user_id: { type: integer, example: 101 }
 * kasir_name: { type: string, example: Budi Santoso }
 * total_amount: { type: number, format: float, example: 75000.00 }
 * created_at: { type: string, format: date-time }
 * 403:
 * description: Akses ditolak. Diperlukan hak akses Admin atau Cashier.
 * 500:
 * description: Server Error.
 */
// HAK AKSES: Admin dan Cashier (Menggunakan verifyRoles)
router.get('/', verifyToken, verifyRoles(ADMIN_CASHIER), async (req, res) => {
    try {
        const query = `
            SELECT 
                t.id, 		
                t.user_id, 
                u.username as kasir_name, 
                t.total_amount, 
                t.transaction_date as created_at -- PERBAIKAN: Mengganti 'created_at' dengan nama kolom yang benar 'transaction_date'
            FROM transactions t
            JOIN users u ON t.user_id = u.id_user
            ORDER BY t.transaction_date DESC -- PERBAIKAN: Gunakan nama kolom yang benar
        `;
        const result = await pool.query(query);
        res.status(200).json({
            message: 'Daftar transaksi berhasil diambil.',
            total: result.rowCount,
            transactions: result.rows
        });
    } catch (err) {
        console.error('Error fetching transactions:', err.message);
        res.status(500).json({ message: 'Server error saat mengambil data transaksi.', error: err.message });
    }
});

// ----------------------------------------
// 3. GET /transactions/:id (Retrieve Transaction Detail - Cashier Only)
// ----------------------------------------
/**
 * @swagger
 * /transactions/{id}:
 * get:
 * tags: [Transaction Management]
 * summary: Mengambil detail transaksi dan item-itemnya berdasarkan ID (Hanya Cashier)
 * description: Mengambil data transaksi spesifik, termasuk daftar lengkap item yang terjual.
 * security:
 * - BearerAuth: []
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: integer
 * example: 5001
 * description: ID transaksi yang ingin dilihat detailnya.
 * responses:
 * 200:
 * description: Detail transaksi berhasil diambil.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * message: { type: string, example: Detail transaksi berhasil diambil. }
 * transaction:
 * type: object
 * properties:
 * id: { type: integer, example: 5001 }
 * user_id: { type: integer, example: 101 }
 * kasir_name: { type: string, example: Budi Santoso }
 * total_amount: { type: number, format: float, example: 75000.00 }
 * created_at: { type: string, format: date-time }
 * items:
 * type: array
 * items:
 * $ref: '#/components/schemas/TransactionItem'
 * 404:
 * description: Transaksi tidak ditemukan.
 * 403:
 * description: Akses ditolak. Diperlukan hak akses Cashier.
 * 500:
 * description: Server Error.
 */
// HAK AKSES: Cashier Only
router.get('/:id', verifyToken, verifyCashier, async (req, res) => {
    const { id } = req.params;
    
    // Validasi ID numerik
    if (!/^\d+$/.test(id)) {
        return res.status(400).json({ message: 'ID transaksi harus berupa angka.' });
    }
    
    try {
        // Ambil data header transaksi
        const transactionQuery = `
            SELECT 
                t.id, 		
                t.user_id, 
                u.username as kasir_name, 
                t.total_amount, 
                t.transaction_date as created_at -- PERBAIKAN: Ganti 'created_at' dengan nama kolom yang benar 'transaction_date'
            FROM transactions t
            JOIN users u ON t.user_id = u.id_user
            WHERE t.id = $1 	
        `;
        const transactionResult = await pool.query(transactionQuery, [id]);
        
        if (transactionResult.rows.length === 0) {
            return res.status(404).json({ message: 'Transaksi tidak ditemukan.' });
        }

        const transactionData = transactionResult.rows[0];

        // Ambil data item transaksi
        const itemsQuery = `
            SELECT 
                ti.id, 			
                ti.product_id, 			
                p.name as product_name, 
                ti.quantity, 
                ti.price_per_item as price_per_item, 
                ti.subtotal
            FROM transaction_items ti
            JOIN products p ON ti.product_id = p.id 
            WHERE ti.transaction_id = $1 
            ORDER BY ti.id ASC
        `;
        const itemsResult = await pool.query(itemsQuery, [id]);

        res.status(200).json({
            message: 'Detail transaksi berhasil diambil.',
            transaction: {
                ...transactionData,
                items: itemsResult.rows
            }
        });

    } catch (err) {
        console.error('Error fetching transaction detail:', err.message);
        res.status(500).json({ message: 'Server error saat mengambil detail transaksi.', error: err.message });
    }
});


// ----------------------------------------
// 4. PUT /transactions/:id (Modify an existing transaction - Cashier Only)
// ----------------------------------------
/**
 * @swagger
 * /transactions/{id}:
 * put:
 * tags: [Transaction Management]
 * summary: Memperbarui item dalam transaksi yang sudah ada (Hanya Cashier)
 * description: Proses ini mengembalikan stok produk lama, menghapus item lama, memproses item baru, mengurangi stok, dan memperbarui header transaksi secara atomik.
 * security:
 * - BearerAuth: []
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: integer
 * example: 5001
 * description: ID transaksi yang akan diperbarui.
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - items
 * properties:
 * items:
 * type: array
 * description: Daftar item baru untuk menggantikan item lama.
 * items:
 * type: object
 * required:
 * - product_id
 * - quantity
 * properties:
 * product_id: { type: integer, example: 2, description: ID produk yang dibeli (sesuai products.id). }
 * quantity: { type: integer, example: 3, description: Jumlah unit produk yang dibeli. }
 * responses:
 * 200:
 * description: Transaksi berhasil diperbarui. Stok produk telah disesuaikan.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * message: { type: string, example: Transaksi berhasil diperbarui. Stok produk telah disesuaikan. }
 * transaction_id: { type: integer, example: 5001 }
 * total_amount: { type: number, example: 90000.00 }
 * 400:
 * description: Validasi input gagal (item kosong, stok tidak cukup, dll.).
 * 404:
 * description: Transaksi atau produk tidak ditemukan.
 * 403:
 * description: Akses ditolak. Diperlukan hak akses Cashier.
 * 500:
 * description: Server Error.
 */
// HAK AKSES: Cashier Only
router.put('/:id', verifyToken, verifyCashier, async (req, res) => {
    const { id } = req.params;
    const { items } = req.body;
    const userId = req.user.id_user;
    
    // Validasi ID numerik
    if (!/^\d+$/.test(id)) {
        return res.status(400).json({ message: 'ID transaksi harus berupa angka.' });
    }

    if (!items || items.length === 0) {
        return res.status(400).json({ message: 'Daftar item baru tidak boleh kosong.' });
    }
    
    if (!userId) {
        // Pengecekan penting jika token valid tapi tidak memiliki req.user.id_user
        return res.status(401).json({ 
            message: 'User ID tidak ditemukan di token. Pastikan verifyToken mengisi req.user.id_user.' 
        });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // A. CEK & AMBIL TRANSAKSI LAMA dengan lock
        const transactionResult = await client.query('SELECT user_id FROM transactions WHERE id = $1 FOR UPDATE', [id]);
        if (transactionResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: `Transaksi dengan ID ${id} tidak ditemukan.` });
        }
        
        // B. KEMBALIKAN STOK LAMA 
        const oldItemsResult = await client.query('SELECT product_id, quantity FROM transaction_items WHERE transaction_id = $1', [id]);

        for (const oldItem of oldItemsResult.rows) {
            // Tambahkan stok lama kembali ke products.stock
            // Gunakan FOR UPDATE pada products untuk menghindari konflik stok saat update
            await client.query('UPDATE products SET stock = stock + $1, updated_at = NOW() WHERE id = $2', 
                [oldItem.quantity, oldItem.product_id]);
        }

        // C. HAPUS ITEM LAMA
        await client.query('DELETE FROM transaction_items WHERE transaction_id = $1', [id]);

        
        // D. PROSES ITEM BARU (Duplikasi logika POST)
        let total_amount = 0;
        const transactionItemsData = [];

        for (const item of items) {
            const { product_id, quantity } = item;
            
            if (!product_id || !quantity || quantity <= 0 || !Number.isInteger(quantity)) {
                await client.query('ROLLBACK');
                return res.status(400).json({ message: `Data item baru tidak valid: product_id ${product_id}, quantity ${quantity}. Quantity harus bilangan bulat positif.` });
            }

            // Ambil detail produk dan cek stok dengan LOCK BARIS (FOR UPDATE)
            const productResult = await client.query('SELECT name, price, stock FROM products WHERE id = $1 FOR UPDATE', [product_id]);
            
            if (productResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ message: `Produk dengan ID ${product_id} tidak ditemukan.` });
            }

            const product = productResult.rows[0];
            if (product.stock < quantity) {
                await client.query('ROLLBACK');
                return res.status(400).json({ message: `Stok produk ${product.name} (ID: ${product_id}) tidak cukup. Stok tersedia: ${product.stock}, diminta: ${quantity}.` });
            }

            const subtotal = product.price * quantity;
            total_amount += subtotal;

            transactionItemsData.push({
                product_id,
                quantity,
                price: product.price,
                subtotal
            });

            // Kurangi stok produk
            await client.query('UPDATE products SET stock = stock - $1, updated_at = NOW() WHERE id = $2', [quantity, product_id]);
        }
        
        // Memastikan total_amount tidak negatif
        if (total_amount < 0) {
            await client.query('ROLLBACK');
            return res.status(500).json({ message: 'Kesalahan perhitungan total jumlah transaksi baru.' });
        }

        // E. PERBARUI HEADER TRANSAKSI
        // Memperbarui user_id ke user yang melakukan PUT saat ini (kasir yang sedang login)
        // Kolom created_at tidak perlu diubah, atau jika ada updated_at, gunakan itu. Karena tidak ada updated_at, kita biarkan saja.
        await client.query(
            'UPDATE transactions SET user_id = $1, total_amount = $2 WHERE id = $3', 
            [userId, total_amount, id]
        );

        // F. MASUKKAN ITEM BARU ke transaction_items
        for (const itemData of transactionItemsData) {
            await client.query(
                'INSERT INTO transaction_items (transaction_id, product_id, quantity, price_per_item, subtotal) VALUES ($1, $2, $3, $4, $5)',
                [id, itemData.product_id, itemData.quantity, itemData.price, itemData.subtotal]
            );
        }

        await client.query('COMMIT');
        res.status(200).json({
            message: 'Transaksi berhasil diperbarui. Stok produk telah disesuaikan.',
            transaction_id: parseInt(id),
            total_amount: parseFloat(total_amount.toFixed(2)) // Format angka untuk respons
        });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error in transaction (PUT):', err.message);
        res.status(500).json({ message: 'Server error saat memperbarui transaksi.', error: err.message });
    } finally {
        client.release();
    }
});


module.exports = router;