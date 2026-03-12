const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const verifyToken = require('../middleware/auth'); // Middleware Autentikasi

// Pastikan Anda memiliki Secret Key yang kuat di file .env atau langsung di sini
const JWT_SECRET = process.env.JWT_SECRET || 'mjgdwkj98623d65i76n37d698a635hsd';
const saltRounds = 10; 

/** ------------------------------------
 * 0. POST /register
 * Path: /auth/register
 * ------------------------------------
 * Untuk mendaftarkan user baru. Password di-hash sebelum disimpan.
 */
router.post('/register', async (req, res) => {
 const { username, password, full_name, role } = req.body;

 try {
 // 1. Melakukan HASHING pada password sebelum menyimpan
       const hashedPassword = await bcrypt.hash(password, saltRounds);

 // 2. Query untuk menyimpan user ke database
 // Asumsi kolom default: id_user, username, password, full_name, role, is_active
       const result = await pool.query(
       'INSERT INTO users (username, password, full_name, role, is_active) VALUES ($1, $2, $3, $4, TRUE) RETURNING id_user, username, full_name, role',
       [username, hashedPassword, full_name, role] // Gunakan hashedPassword!
 );

       res.status(201).json({
       message: 'User Berhasil didaftarkan.',
       user: result.rows[0]
 });

 } catch (error) {
 console.error('Error saat register:', error);
// Penanganan error jika username sudah ada
       if (error.code === '23505') { 
        return res.status(409).json({ message: 'Username sudah digunakan.' });
 }
       res.status(500).json({ message: 'Error saat mendaftarkan user.' });
 }
});


// ------------------------------------
// 1. POST /login (SUDAH DITAMBAHKAN LOG)
// ------------------------------------
router.post('/login', async (req, res) => {
const { username, password } = req.body;

 try {
        // ==> DEBUGGING LOG 1: Input yang Diterima
        console.log("==> 1. Input Diterima:", { username, password }); 

 // 1. Cari user berdasarkan username
       const result = await pool.query(
       'SELECT * FROM users WHERE username = $1 AND is_active = TRUE',
       [username]
 );

 const user = result.rows[0];
if (!user) {
 return res.status(401).json({ message: 'Username atau password salah.' });
 }
        
        // ==> DEBUGGING LOG 2: Hash yang Diambil dari DB
        console.log("==> 2. Hash dari DB:", user.password); 

 // 2. Bandingkan password (KUNCI UTAMA)
       const passwordMatch = await bcrypt.compare(password, user.password);
        
        // ==> DEBUGGING LOG 3: Hasil Perbandingan
        console.log("==> 3. Hasil Perbandingan (Match):", passwordMatch); 

 if (!passwordMatch) {
 return res.status(401).json({ message: 'Username atau password salah.' });
 }

// 3. Buat Access Token
       const accessToken = jwt.sign(
       { id_user: user.id_user, role: user.role },
       JWT_SECRET,
       { expiresIn: '1h' }
 );

 // 4. Buat Refresh Token
       const refreshToken = jwt.sign(
       { id_user: user.id_user },
       JWT_SECRET,
        { expiresIn: '7d' }
 );

     // 5. Kirim respon
       res.status(200).json({
        message: 'Login berhasil',
       token: accessToken,
       refreshToken: refreshToken, 
       user: {
       id: user.id_user,
       username: user.username,
       role: user.role
 }
 });

 } catch (err) {
 console.error('Error during login:', err.message);
 res.status(500).json({ message: 'Server error saat login.' });
 }
});


/** ------------------------------------
 * 2. POST /refresh-token
 * Path: /auth/refresh-token
 * ------------------------------------
 * Menggunakan Refresh Token yang valid untuk mendapatkan Access Token baru.
 */
       router.post('/refresh-token', async (req, res) => {
 const { refreshToken } = req.body;

       if (!refreshToken) {
       return res.status(400).json({ message: 'Refresh Token harus disediakan.' });
 }

 try {
 // 1. Verifikasi Refresh Token
 const decoded = jwt.verify(refreshToken, JWT_SECRET);
const { id_user } = decoded;

// 2. Cari user untuk memastikan masih aktif
 const result = await pool.query(
 'SELECT id_user, username, role FROM users WHERE id_user = $1 AND is_active = TRUE',
 [id_user]
 );

 const user = result.rows[0];
 if (!user) {
 return res.status(401).json({ message: 'User tidak valid atau tidak aktif.' });
 }

 // 3. Buat Access Token baru
 const newAccessToken = jwt.sign(
 { id_user: user.id_user, role: user.role },
 JWT_SECRET,
 { expiresIn: '1h' }
 );

// 4. Kirim respon dengan Access Token baru
 res.status(200).json({
 message: 'Access Token berhasil diperbarui.',
 token: newAccessToken,
 user: { id: user.id_user, username: user.username, role: user.role }
 });

 } catch (err) {
 // Jika Refresh Token kadaluarsa atau tidak valid
 console.error('Refresh token error:', err.message);
 res.status(401).json({ message: 'Refresh Token tidak valid atau sudah kadaluarsa.' });
 }
});


/** ------------------------------------
 * 3. POST /logout
 * Path: /auth/logout
 * ------------------------------------
 * Memberi sinyal kepada klien untuk menghapus token.
 */
router.post('/logout', verifyToken, (req, res) => {
// Middleware verifyToken memastikan token yang digunakan valid dan belum kadaluarsa.
 res.status(200).json({ message: 'Logout berhasil. Token telah diabaikan.' });
});


module.exports = router;