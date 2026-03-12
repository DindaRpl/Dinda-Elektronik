const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const bcrypt = require('bcrypt');
const verifyToken = require('../middleware/auth'); // Middleware Autentikasi
const { verifyAdmin } = require('../middleware/verifyRole'); // Middleware Otorisasi


/**
 * @swagger
 * components:
 * securitySchemes:
 * BearerAuth:
 * type: http
 * scheme: bearer
 * bearerFormat: JWT
 *
 * schemas:
 * User:
 * type: object
 * properties:
 * id_user: { type: integer, description: ID unik pengguna. }
 * username: { type: string, description: Nama pengguna untuk login. }
 * full_name: { type: string, description: Nama lengkap pengguna. }
 * role: { type: string, description: Peran pengguna ('admin' atau 'kasir'). }
 * is_active: { type: boolean, description: Status akun aktif. }
 * created_at: { type: string, format: date-time, description: Waktu pembuatan. }
 * updated_at: { type: string, format: date-time, description: Waktu pembaruan. }
 *
 * UserRegisterInput:
 * type: object
 * required: [username, password, full_name]
 * properties:
 * username: { type: string, example: kasir_baru }
 * password: { type: string, format: password, example: strongpassword123 }
 * full_name: { type: string, example: Nama Kasir }
 * role: { type: string, enum: [admin, kasir], default: kasir, description: Opsional. }
 *
 * UserDeactivateInput:
 * type: object
 * required: [id_user]
 * properties:
 * id_user: { type: integer, example: 5, description: ID user yang akan dinonaktifkan. }
 */

/**
 * @swagger
 * tags:
 * name: User Management
 * description: Operasi untuk manajemen pengguna (CRUD, Register, Profile, Deaktivasi)
 */


/** ----------------------------------------
 * 1. GET / (Admin Only) - Retrieve All Users
 * -----------------------------------------
 * @swagger
 * /user-management:
 * get:
 * tags: [User Management]
 * summary: Mengambil daftar semua pengguna (Hanya Admin)
 * security:
 * - BearerAuth: []
 * responses:
 * 200:
 * description: Daftar pengguna berhasil diambil.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * message: { type: string, example: Daftar pengguna berhasil diambil. }
 * total: { type: integer, example: 5 }
 * users:
 * type: array
 * items:
 * $ref: '#/components/schemas/User'
 * 401:
 * description: Akses ditolak (Token tidak valid/kadaluarsa).
 * 403:
 * description: Akses dilarang (Bukan Admin).
 */
router.get('/', verifyToken, verifyAdmin, async (req, res) => {
    try {
        // Query untuk mengambil semua users (hanya data penting)
        const query = 'SELECT id_user, username, full_name, role, is_active, created_at FROM users ORDER BY id_user ASC';
        const result = await pool.query(query);

        res.status(200).json({
            message: 'Daftar pengguna berhasil diambil.',
            total: result.rowCount,
            users: result.rows
        });
    } catch (err) {
        console.error('Error fetching all users:', err.message);
        res.status(500).json({ message: 'Server error saat mengambil data pengguna.' });
    }
});


/** ------------------------------------
 * 2. POST /register 
 * ------------------------------------
 * @swagger
 * /user-management/register:
 * post:
 * tags: [User Management]
 * summary: Mendaftarkan pengguna baru (Admin atau Kasir)
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/UserRegisterInput'
 * responses:
 * 201:
 * description: User berhasil didaftarkan.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * message: { type: string, example: User berhasil didaftarkan. }
 * user:
 * type: object
 * properties:
 * id_user: { type: integer, example: 6 }
 * username: { type: string, example: kasir_baru }
 * role: { type: string, example: kasir }
 * 400:
 * description: Validasi gagal (data tidak lengkap atau role tidak valid).
 * 409:
 * description: Konflik (Username sudah digunakan).
 */
router.post('/register', async (req, res) => {
    const { username, password, full_name, role = 'kasir' } = req.body;

    if (!username || !password || !full_name) {
        return res.status(400).json({ message: 'Username, password, dan Nama Lengkap wajib diisi.' });
    }

    if (role !== 'admin' && role !== 'kasir') {
        return res.status(400).json({ message: 'Role harus admin atau kasir.' });
    }

    try {
        // 1. Hash Password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 2. Simpan user ke database
        // Pengecekan duplikasi username di sini dihapus karena sudah dilakukan 
        // oleh UNIQUE constraint di database. Kita akan menangani error 23505.
        const result = await pool.query(
            `INSERT INTO users (username, password, full_name, role, is_active)
             VALUES ($1, $2, $3, $4, TRUE) RETURNING id_user, username, role`, 
            [username, hashedPassword, full_name, role]
        );

        res.status(201).json({
            message: 'User berhasil didaftarkan.',
            user: result.rows[0]
        });

    } catch (err) {
        // Penanganan error jika username sudah ada (kode PostgreSQL 23505 - Unique Violation)
        if (err.code === '23505') {
            return res.status(409).json({ message: 'Username sudah digunakan. Silakan pilih username lain.' });
        }
        
        console.error('Error during registration:', err.message);
        res.status(500).json({ message: 'Server error saat registrasi.' });
    }
});


/** ------------------------------------
 * 3. GET /profile (Requires Login)
 * ------------------------------------
 * @swagger
 * /user-management/profile:
 * get:
 * tags: [User Management]
 * summary: Mengambil detail profil pengguna yang sedang login
 * security:
 * - BearerAuth: []
 * responses:
 * 200:
 * description: Profil berhasil diambil.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * message: { type: string, example: Profil berhasil diambil. }
 * profile:
 * $ref: '#/components/schemas/User'
 * 401:
 * description: Akses ditolak (Token tidak valid/kadaluarsa).
 * 404:
 * description: User profile tidak ditemukan.
 */
router.get('/profile', verifyToken, async (req, res) => {
    // PERBAIKAN KRUSIAL UNTUK KONSISTENSI ID:
    // Middleware verifyToken harus mengisi req.user dengan ID pengguna.
    // Kita gunakan || untuk mengantisipasi jika property-nya bernama 'id' atau 'id_user'.
    const userIdFromToken = req.user.id_user || req.user.id; 

    if (!userIdFromToken) {
        // Ini adalah fallback jika middleware auth gagal mengisi ID dengan benar.
        return res.status(401).json({ message: 'Token valid, namun ID pengguna tidak ditemukan dalam payload token.' });
    }
    
    try {
        const result = await pool.query(
            'SELECT id_user, username, full_name, role, is_active, created_at, updated_at FROM users WHERE id_user = $1',
            [userIdFromToken] // Menggunakan ID dari token
        );

        if (result.rows.length === 0) {
            // Walaupun token valid, user mungkin sudah terhapus/dinonaktifkan
            return res.status(404).json({ message: 'User profile tidak ditemukan di database.' });
        }

        res.status(200).json({
            message: 'Profil berhasil diambil.',
            profile: result.rows[0]
        });

    } catch (err) {
        console.error('Error fetching profile:', err.message);
        res.status(500).json({ message: 'Server error saat mengambil profil.' });
    }
});


/** ------------------------------------
 * 4. PUT /deactivate-user (Requires Admin)
 * ------------------------------------
 * @swagger
 * /user-management/deactivate-user:
 * put:
 * tags: [User Management]
 * summary: Menonaktifkan akun pengguna (Admin Only)
 * description: Mengubah status is_active menjadi FALSE untuk user tertentu. Admin tidak dapat menonaktifkan akunnya sendiri.
 * security:
 * - BearerAuth: []
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/UserDeactivateInput'
 * responses:
 * 200:
 * description: User berhasil dinonaktifkan.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * message: { type: string, example: User kasir_budi berhasil dinonaktifkan. }
 * user:
 * type: object
 * properties:
 * id_user: { type: integer, example: 5 }
 * username: { type: string, example: kasir_budi }
 * is_active: { type: boolean, example: false }
 * 400:
 * description: ID user tidak disediakan.
 * 403:
 * description: Admin mencoba menonaktifkan akunnya sendiri.
 * 404:
 * description: User tidak ditemukan.
 */
router.put('/deactivate-user', verifyToken, verifyAdmin, async (req, res) => {
    // Menggunakan id_user di body request
    const { id_user } = req.body; 
    
    // Mendapatkan ID admin yang sedang login dari token
    const adminId = req.user.id_user || req.user.id; 

    if (!id_user) {
        return res.status(400).json({ message: 'ID user harus disediakan di body request.' });
    }
    
    // Admin tidak boleh menonaktifkan dirinya sendiri
    // Penting: Menggunakan == karena adminId biasanya integer, id_user dari body bisa jadi string
    if (adminId == id_user) { 
        return res.status(403).json({ message: 'Anda tidak diizinkan menonaktifkan akun Anda sendiri.' });
    }

    try {
        // Set is_active ke FALSE
        const result = await pool.query(
            'UPDATE users SET is_active = FALSE, updated_at = NOW() WHERE id_user = $1 AND is_active = TRUE RETURNING id_user, username, is_active',
            [id_user]
        );

        if (result.rowCount === 0) {
            // User tidak ditemukan ATAU sudah nonaktif
            return res.status(404).json({ message: 'User tidak ditemukan atau sudah dalam kondisi nonaktif.' });
        }

        res.status(200).json({
            message: `User ${result.rows[0].username} berhasil dinonaktifkan.`,
            user: result.rows[0]
        });

    } catch (err) {
        console.error('Error deactivating user:', err.message);
        res.status(500).json({ message: 'Server error saat menonaktifkan user.' });
    }
});


/** ------------------------------------
 * 5. PUT /:id_user (Requires Admin) - Update User Detail
 * ------------------------------------
 * @swagger
 * /user-management/{id_user}:
 * put:
 * tags: [User Management]
 * summary: Memperbarui detail pengguna (Admin Only)
 * description: Admin dapat mengubah full_name, role, dan status is_active pengguna lain. Admin tidak dapat mengubah role atau status dirinya sendiri.
 * security:
 * - BearerAuth: []
 * parameters:
 * - in: path
 * name: id_user
 * required: true
 * schema:
 * type: integer
 * description: ID pengguna yang akan diperbarui.
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/UserUpdateInput'
 * responses:
 * 200:
 * description: Detail pengguna berhasil diperbarui.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * message: { type: string, example: Detail pengguna kasir_budi berhasil diperbarui. }
 * user:
 * $ref: '#/components/schemas/User'
 * 400:
 * description: Validasi gagal (data tidak lengkap atau role/input tidak valid).
 * 403:
 * description: Akses dilarang (Bukan Admin atau Admin mencoba mengubah role/statusnya sendiri).
 * 404:
 * description: User tidak ditemukan.
 */
router.put('/:id_user', verifyToken, verifyAdmin, async (req, res) => {
    // 1. Ambil ID user yang akan diupdate dari parameter
    const { id_user } = req.params;
    
    // 2. Ambil data yang akan diupdate dari body
    // Jika field tidak dikirim, nilainya adalah undefined
    const { full_name, role, is_active } = req.body;
    
    // 3. Ambil ID admin yang sedang login dari token
    const adminId = req.user.id_user || req.user.id; 

    // 4. Validasi Dasar: Pastikan setidaknya satu field disediakan
    if (full_name === undefined && role === undefined && is_active === undefined) {
        return res.status(400).json({ message: 'Setidaknya satu field (full_name, role, atau is_active) harus disediakan untuk update.' });
    }

    // 5. Validasi Role (Jika role dikirim)
    if (role !== undefined && role !== 'admin' && role !== 'kasir') {
        return res.status(400).json({ message: 'Role harus admin atau kasir.' });
    }

    // 6. Pencegahan Admin mengubah role atau status dirinya sendiri (Self-protection)
    if (adminId == id_user) {
        // Admin hanya boleh mengubah full_name miliknya sendiri melalui endpoint ini.
        if (role !== undefined || is_active !== undefined) {
            return res.status(403).json({ message: 'Admin tidak diizinkan mengubah role atau status aktif/nonaktif akunnya sendiri melalui endpoint ini.' });
        }
    }


    try {
        let updateFields = [];
        let updateValues = [];
        let paramIndex = 1; // Index untuk parameter di query ($1, $2, dst)

        // Membangun query secara dinamis berdasarkan field yang ada di body
        if (full_name !== undefined) {
            updateFields.push(`full_name = $${paramIndex++}`);
            updateValues.push(full_name);
        }
        if (role !== undefined) {
            updateFields.push(`role = $${paramIndex++}`);
            updateValues.push(role);
        }
        if (is_active !== undefined) {
            updateFields.push(`is_active = $${paramIndex++}`);
            updateValues.push(is_active);
        }
        
        // Tambahkan updated_at ke dalam field update
        updateFields.push(`updated_at = NOW()`);
        
        // Tambahkan ID pengguna yang diupdate sebagai parameter terakhir
        // Ini akan digunakan di klausa WHERE id_user = $N
        updateValues.push(id_user); 

        // Query Update
        const updateQuery = `
            UPDATE users 
            SET ${updateFields.join(', ')} 
            WHERE id_user = $${paramIndex} 
            RETURNING id_user, username, full_name, role, is_active, created_at, updated_at
        `;

        const result = await pool.query(updateQuery, updateValues);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'User tidak ditemukan.' });
        }

        res.status(200).json({
            message: `Detail pengguna ${result.rows[0].username} berhasil diperbarui.`,
            user: result.rows[0]
        });

    } catch (err) {
        console.error('Error updating user detail:', err.message);
        res.status(500).json({ message: 'Server error saat memperbarui detail user.' });
    }
});


module.exports = router;