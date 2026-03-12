// File: src/middleware/verifyRole.js

// Middleware untuk memastikan user adalah Admin
const verifyAdmin = (req, res, next) => {
    // Tambahkan .toLowerCase() agar lebih fleksibel (mengizinkan 'Admin' atau 'admin')
    if (req.user && req.user.role.toLowerCase() === 'admin') {
        next(); // User adalah Admin, lanjutkan
    } else {
        // User bukan Admin
        res.status(403).json({ message: 'Akses terlarang. Diperlukan hak akses Admin.' });
    }
};

// Middleware untuk memastikan user adalah Kasir MURNI (Hanya Cashier/Kasir)
const verifyCashier = (req, res, next) => {
    // CATATAN: logika menggunakan || (OR) dan .toLowerCase()
    const userRole = req.user ? req.user.role.toLowerCase() : null;

    if (userRole && (userRole === 'cashier' || userRole === 'kasir')) {
        next(); 
    } else {
        res.status(403).json({ message: 'Akses terlarang. Diperlukan hak akses Cashier.' });
    }
};

// Middleware untuk hak akses ganda (Admin DAN Cashier)
const verifyRoles = (allowedRoles) => {
    return (req, res, next) => {
        // 1. Cek apakah data user tersedia dari middleware verifyToken
        if (!req.user || !req.user.role) {
            return res.status(401).json({ 
                message: "Akses ditolak. Token tidak valid atau user role tidak ditemukan." 
            });
        }

        const userRole = req.user.role.toLowerCase();

        // 2. Cek apakah role pengguna termasuk dalam daftar yang diizinkan
        if (allowedRoles.includes(userRole)) {
            next(); // Lanjut ke handler route
        } else {
            // 3. Jika role tidak diizinkan, kembalikan 403 Forbidden
            return res.status(403).json({ 
                message: "Akses terlarang. Diperlukan hak akses yang sesuai." 
            });
        }
    };
};

// Ekspor semua fungsi
module.exports = {
    verifyAdmin,
    verifyCashier,
    verifyRoles 
};