const express = require('express');
const cors = require('cors');
require('dotenv').config(); // Load environment variables
const pool = require('./db/pool'); 

// --- 1. Import Swagger Dependencies ---
const swaggerUi = require('swagger-ui-express');
// File konfigurasi Swagger (swagger.js) berada di root directory atau folder yang sama dengan index.js
const swaggerDocument = require('./swagger'); 


const app = express();
app.use(cors());
const PORT = process.env.PORT || 3000;

// Middleware Bawaan Express
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 


// =========================================================================
// R-1. DAFTARKAN SEMUA ROUTER
// =========================================================================

// 1. Products Router (Public/Admin Access)
const productsRouter = require('./routes/products');
app.use('/products',productsRouter); 

// 2. Categories Router (Admin Access)
const categoriesRouter = require('./routes/categories');
app.use('/categories', categoriesRouter); 

// 3. User Management Router (Admin/Kasir Access)
const usersRouter = require('./routes/users');
app.use('/user-management', usersRouter); 

// 4. Authentication Router (Public/General Access)
const authRouter = require('./routes/auth');
app.use('/auth', authRouter); 

// 5. Transactions Router (Kasir Access)
const transactionsRouter = require('./routes/transactions');
app.use('/transactions', transactionsRouter); 


// =========================================================================
// R-2. AKTIFKAN SWAGGER UI
// =========================================================================
// Endpoint untuk melihat dokumentasi: http://localhost:3000/api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));


// Middleware Sederhana untuk Test
app.get('/', (req, res) => {
    res.send('API Server is running! Check /api-docs for documentation.');
});


// Jalankan Server
app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
    // Test koneksi database saat server berjalan
    pool.query('SELECT NOW()').then(res => {
        console.log('DB Check: Waktu database berhasil diambil.');
    }).catch(err => {
        console.error('DB Check: GAGAL KONEKSI DB!', err.stack);
    });
});