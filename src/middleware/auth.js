// src/middleware/auth.js

const jwt = require('jsonwebtoken');
require('dotenv').config();

// Fungsi middleware untuk verifikasi token JWT
const verifyToken = (req, res, next) => {
  // 1. Ambil Token dari Header
  // Token biasanya dikirim dalam format: Authorization: Bearer <token>
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // Jika header tidak ada atau formatnya salah
    return res.status(401).json({ message: 'Akses ditolak. Token tidak disediakan atau format salah.' });
  }

  // Pisahkan "Bearer " untuk mengambil token saja
  const token = authHeader.split(' ')[1];

  try {
    // 2. Verifikasi Token menggunakan Secret Key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

  req.user = { 
    id_user: decoded.id_user, // <--- Ini harus SESUAI dengan payload token
    role: decoded.role 
};
next();

  } catch (err) {
    // Jika token tidak valid (expired, diubah, dll.)
    console.error('JWT Verification Error:', err.message);
    return res.status(401).json({ message: 'Token tidak valid atau sudah kadaluwarsa.' });
  }
};

module.exports = verifyToken;