/**
 * Ini adalah file konfigurasi Swagger (OpenAPI 3.0) untuk mendokumentasikan API.
 * File ini diekspor dan diimpor oleh index.js.
 */
module.exports = {
  // Metadata API
  openapi: '3.0.0',
  info: {
    title: 'Api Swagger Toko Elektronik',
    version: '1.0.0',
    description: 'Dokumentasi API untuk Sistem Toko Elektronik.',
  },
  // Server Configuration
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Local Development Server',
    },
  ],
  // Security definitions (JWT Bearer Token) dan Skema
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Masukkan token JWT yang didapatkan setelah login.',
      },
    },
    // ====================================================================
    // Schemas - Mendefinisikan model data untuk konsistensi
    // ====================================================================
    schemas: {
        User: {
            type: 'object',
            properties: {
                id: { type: 'integer', example: 1 }, 
                username: { type: 'string', example: 'admintoko' },
                role: { type: 'string', enum: ['admin', 'kasir'], example: 'admin' },
                is_active: { type: 'boolean', example: true, description: 'Status user, untuk di endpoint nonaktifkan' },
            },
        },
        Category: {
            type: 'object',
            properties: {
                id: { type: 'integer', example: 7 }, 
                name: { type: 'string', example: 'Peralatan Dapur' },
            },
        },
        Product: {
            type: 'object',
            properties: {
                id: { type: 'integer', example: 12 }, 
                category_id: { type: 'integer', example: 7 }, 
                name: { type: 'string', example: 'Blender Philips' },
                price: { type: 'integer', example: 150000 },
                stock: { type: 'integer', example: 100 },
                category_name: { type: 'string', example: 'Peralatan Dapur', description: 'Nama kategori, biasanya didapatkan melalui join' }
            },
        },
        TransactionDetail: {
            type: 'object',
            properties: {
                product_id: { type: 'integer', example: 12 }, 
                quantity: { type: 'integer', example: 2 },
                product_name: { type: 'string', example: 'Blender Philips', description: 'Nama produk saat transaksi' },
                price_at_sale: { type: 'integer', example: 150000, description: 'Harga produk saat dijual' }
            }
        },
        Transaction: {
            type: 'object',
            properties: {
                id: { type: 'integer', example: 101 }, 
                user_id: { type: 'integer', example: 3, description: 'ID Kasir yang melakukan transaksi' }, 
                username: { type: 'string', example: 'kasir_dinda', description: 'Username Kasir' },
                transaction_date: { type: 'string', format: 'date-time', example: '2023-10-27T10:00:00Z' },
                total_amount: { type: 'integer', example: 250000 },
                products: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/TransactionDetail' }
                }
            }
        }
    }
  },
  // Semua Endpoint (Paths)
  paths: {
    // ====================================================================
    // 1. AUTHENTICATION (Public)
    // ====================================================================
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Mendaftar Admin baru (hanya untuk setup awal).',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['username', 'password', 'role'],
                properties: {
                  username: { type: 'string', example: 'adminutama' },
                  password: { type: 'string', example: 'passwordkuat123' },
                  role: { type: 'string', enum: ['admin'], example: 'admin' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'User berhasil didaftarkan' },
          '400': { description: 'Input tidak valid' },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login untuk mendapatkan token JWT.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['username', 'password'],
                properties: {
                  username: { type: 'string', example: 'admin_toko' },
                  password: { type: 'string', example: 'sandi_12345' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Login berhasil, kembalikan token',
            content: {
                'application/json': {
                    schema: {
                        type: 'object',
                        properties: {
                            token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                        }
                    }
                }
            }
          },
          '401': { description: 'Kredensial tidak valid' },
        },
      },
    },
    '/auth/refresh-token': {
  post: {
    tags: ['Auth'],
    summary: 'Refresh token yang sudah kadaluarsa.',
    
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              'refresh-token': { 
                type: 'string',
                description: 'Refresh token yang didapat saat login pertama kali.',
              },
            },
            required: ['refresh-token'], 
          },
        },
      },
    },
    responses: {
      '200': { description: 'Token berhasil di-refresh' },
      '401': { description: 'Token tidak valid/kadaluarsa' },
      '500': { description: 'Internal Server Error' }, 
    },
  },
},
    '/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Logout pengguna (invalidasi token).',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': { description: 'Logout berhasil' },
          '401': { description: 'Unauthorized' },
        },
      },
    },

    // ====================================================================
    // 2. USER MANAGEMENT (Admin Only)
    // ====================================================================
    '/user-management/register': {
      post: {
        tags: ['User Management (Admin)'],
        summary: 'Mendaftar user Kasir baru (Admin Only).',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['username', 'password', 'role'],
                properties: {
                  username: { type: 'string', example: 'kasir_dinda' },
                  password: { type: 'string', example: 'kasirsakti' },
                  role: { type: 'string', enum: ['kasir'], example: 'kasir' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'User Kasir berhasil didaftarkan' },
          '401': { description: 'Unauthorized (Token tidak valid)' },
          '403': { description: 'Forbidden (Bukan Admin)' },
        },
      },
    },
    '/user-management/profile': {
        get: {
            tags: ['User Management (Admin/Kasir)'],
            summary: 'Mengambil profil user yang sedang login.',
            security: [{ BearerAuth: [] }],
            responses: {
                '200': {
                    description: 'Profil user ditemukan.',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/User'
                            }
                        }
                    }
                },
                '401': { description: 'Unauthorized' },
            }
        },
    },
    '/user-management/deactivate-user': {
      put: {
        tags: ['User Management (Admin)'],
        summary: 'Menonaktifkan user berdasarkan ID (Admin Only).',
        security: [{ BearerAuth: [] }],
        requestBody: {
            required: true,
            content: {
                'application/json': {
                    schema: {
                        type: 'object',
                        required: ['id'],
                        properties: {
                            id: { type: 'integer', example: 2 }, 
                        }
                    }
                }
            }
        },
        responses: {
          '200': { description: 'User berhasil dinonaktifkan' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden (Bukan Admin)' },
          '404': { description: 'User tidak ditemukan' },
        },
      },
    },
    '/user-management/{id}': {
        parameters: [
            {
                name: 'id',
                in: 'path',
                required: true,
                schema: { type: 'integer', example: 2 }, 
                description: 'ID pengguna yang akan diaktifkan atau diupdate.',
            }
        ],
        put: {
            tags: ['User Management (Admin)'],
            summary: 'Mengaktifkan kembali user non-aktif (Admin Only).',
            description: 'Mengubah status `is_active` pengguna menjadi `true`. Juga dapat digunakan untuk pembaruan detail umum user (full_name, role).',
            operationId: 'activateAndUpdateUser',
            security: [{ BearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                full_name: { type: 'string', description: 'Nama lengkap baru user (opsional).' },
                                role: { type: 'string', enum: ['admin', 'kasir'], description: 'Peran baru user (opsional).' },
                                is_active: { type: 'boolean', example: true, description: 'Status aktif baru user (Gunakan `true` untuk mengaktifkan).' },
                            },
                            // Membuat semua properti opsional (Admin hanya perlu mengirim 'is_active: true' untuk aktivasi)
                        },
                        examples: {
                            activateUser: {
                                summary: 'Hanya Mengaktifkan User',
                                value: { is_active: true }
                            },
                            updateAll: {
                                summary: 'Mengaktifkan dan Update Detail',
                                value: {
                                    full_name: 'Budi Santoso (Aktif)',
                                    role: 'kasir',
                                    is_active: true
                                }
                            }
                        }
                    }
                }
            },
            responses: {
                '200': {
                    description: 'Pengguna berhasil diaktifkan/diperbarui.',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/User'
                            }
                        }
                    }
                },
                '400': { description: 'Input tidak valid (misalnya, role salah).' },
                '403': { description: 'Akses dilarang (Bukan Admin atau Admin mencoba mengubah role/statusnya sendiri).' },
                '404': { description: 'User tidak ditemukan.' },
            },
        },
        
    },

    // ====================================================================
    // 3. CATEGORIES (Admin Only)
    // ====================================================================
    '/categories': {
        get: {
            tags: ['Categories (Admin)'],
            summary: 'Mengambil semua kategori.',
            security: [{ BearerAuth: [] }],
            responses: {
                '200': {
                    description: 'Daftar kategori',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'array',
                                items: { $ref: '#/components/schemas/Category' }
                            }
                        }
                    }
                },
                '401': { description: 'Unauthorized' },
            }
        },
        post: {
            tags: ['Categories (Admin)'],
            summary: 'Menyimpan kategori baru (Admin Only).',
            security: [{ BearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            required: ['name'],
                            properties: {
                                name: { type: 'string', example: 'Peralatan Dapur' },
                            }
                        }
                    }
                }
            },
            responses: {
                '201': {
                    description: 'Kategori berhasil disimpan',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/Category' }
                        }
                    }
                },
                '401': { description: 'Unauthorized' },
                '403': { description: 'Forbidden (Bukan Admin)' },
            }
        }
    },
    '/categories/{id}': {
        parameters: [
            {
                name: 'id',
                in: 'path',
                required: true,
                schema: { type: 'integer', example: 7 }, 
            }
        ],
        get: {
            tags: ['Categories (Admin)'],
            summary: 'Mengambil kategori berdasarkan ID.',
            security: [{ BearerAuth: [] }],
            responses: {
                '200': {
                    description: 'Detail kategori',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/Category' }
                        }
                    }
                },
                '404': { description: 'Kategori tidak ditemukan' },
            }
        },
        put: {
            tags: ['Categories (Admin)'],
            summary: 'Memodifikasi kategori berdasarkan ID (Admin Only).',
            security: [{ BearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            required: ['name'],
                            properties: {
                                name: { type: 'string', example: 'Peralatan Dapur Modern' },
                            }
                        }
                    }
                }
            },
            responses: {
                '200': {
                    description: 'Kategori berhasil dimodifikasi',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/Category' }
                        }
                    }
                },
                '404': { description: 'Kategori tidak ditemukan' },
            }
        },
        delete: {
            tags: ['Categories (Admin)'],
            summary: 'Menghapus kategori berdasarkan ID (Admin Only).',
            security: [{ BearerAuth: [] }],
            responses: {
                '200': { description: 'Kategori berhasil dihapus' },
                '404': { description: 'Kategori tidak ditemukan' },
            }
        }
    },

    // ====================================================================
    // 4. PRODUCTS (Admin Only)
    // ====================================================================
    '/products': {
        get: {
            tags: ['Products (Admin)'],
            summary: 'Mengambil semua produk.',
            security: [{ BearerAuth: [] }],
            responses: {
                '200': {
                    description: 'Daftar produk',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'array',
                                items: { $ref: '#/components/schemas/Product' }
                            }
                        }
                    }
                },
                '401': { description: 'Unauthorized' },
            }
        },
        post: {
            tags: ['Products (Admin)'],
            summary: 'Menyimpan produk baru (Admin Only).',
            security: [{ BearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            required: ['category_id', 'name', 'price', 'stock'],
                            properties: {
                                category_id: { type: 'integer', example: 7 }, 
                                name: { type: 'string', example: 'Blender Philips' },
                                price: { type: 'integer', example: 150000 },
                                stock: { type: 'integer', example: 100 },
                            }
                        }
                    }
                }
            },
            responses: {
                '201': {
                    description: 'Produk berhasil disimpan',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/Product' }
                        }
                    }
                },
                '401': { description: 'Unauthorized' },
            }
        }
    },
    '/products/{id}': {
        parameters: [
            {
                name: 'id',
                in: 'path',
                required: true,
                schema: { type: 'integer', example: 12 }, 
            }
        ],
        get: {
            tags: ['Products (Admin)'],
            summary: 'Mengambil produk berdasarkan ID.',
            security: [{ BearerAuth: [] }],
            responses: {
                '200': {
                    description: 'Detail produk',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/Product' }
                        }
                    }
                },
                '404': { description: 'Produk tidak ditemukan' },
            }
        },
        put: {
            tags: ['Products (Admin)'],
            summary: 'Memodifikasi produk berdasarkan ID (Admin Only).',
            security: [{ BearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                category_id: { type: 'integer', example: 7 }, 
                                name: { type: 'string', example: 'Blender Philips Smart' },
                                price: { type: 'integer', example: 180000 },
                                stock: { type: 'integer', example: 50 },
                            }
                        }
                    }
                }
            },
            responses: {
                '200': {
                    description: 'Produk berhasil dimodifikasi',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/Product' }
                        }
                    }
                },
                '404': { description: 'Produk tidak ditemukan' },
            }
        },
        delete: {
            tags: ['Products (Admin)'],
            summary: 'Menghapus produk berdasarkan ID (Admin Only).',
            security: [{ BearerAuth: [] }],
            responses: {
                '200': { description: 'Produk berhasil dihapus' },
                '404': { description: 'Produk tidak ditemukan' },
            }
        }
    },

    // ====================================================================
    // 5. TRANSACTIONS (Kasir Only)
    // ====================================================================
    '/transactions': {
        get: {
            tags: ['Transactions (Kasir)'],
            summary: 'Mengambil semua transaksi.',
            security: [{ BearerAuth: [] }],
            responses: {
                '200': {
                    description: 'Daftar transaksi',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'array',
                                items: { $ref: '#/components/schemas/Transaction' }
                            }
                        }
                    }
                },
                '401': { description: 'Unauthorized' },
                '403': { description: 'Forbidden (Bukan Kasir)' },
            }
        },
        post: {
            tags: ['Transactions (Kasir)'],
            summary: 'Menyimpan transaksi baru (penjualan) (Kasir Only).',
            security: [{ BearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            required: ['products'],
                            properties: {
                    
                                products: {
                                    type: 'array',
                                    items: {
                                        type: 'object',
                                        required: ['product_id', 'quantity'],
                                        properties: {
                                            product_id: { type: 'integer', example: 12 }, 
                                            quantity: { type: 'integer', example: 2 },
                                        }
                                    },
                                    example: [ 
                                        { product_id: 12, quantity: 2 },
                                        { product_id: 13, quantity: 1 }
                                    ]
                                }
                            }
                        }
                    }
                }
            },
            responses: {
                '201': {
                    description: 'Transaksi berhasil disimpan',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/Transaction' }
                        }
                    }
                },
                '400': { description: 'Stok tidak mencukupi atau input tidak valid' },
                '401': { description: 'Unauthorized' },
            }
        }
    },
    '/transactions/{id}': {
        parameters: [
            {
                name: 'id',
                in: 'path',
                required: true,
                schema: { type: 'integer', example: 10 }, 
            }
        ],
        get: {
            tags: ['Transactions (Kasir)'],
            summary: 'Mengambil detail transaksi berdasarkan ID.',
            security: [{ BearerAuth: [] }],
            responses: {
                '200': {
                    description: 'Detail transaksi ditemukan',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/Transaction' }
                        }
                    }
                },
                '404': { description: 'Transaksi tidak ditemukan' },
            }
        },
        put: {
            tags: ['Transactions (Kasir)'],
            summary: 'Memodifikasi transaksi berdasarkan ID (Kasir Only).',
            security: [{ BearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            
                            properties: {
                                total_amount: { type: 'integer', example: 30000, description: 'Total jumlah transaksi yang diperbarui (opsional)' },
                                status: { type: 'string', enum: ['pending', 'completed', 'cancelled'], example: 'completed', description: 'Status pembayaran/transaksi' }
                            }
                        }
                    }
                }
            },
            responses: {
                '200': { description: 'Transaksi berhasil dimodifikasi' },
                '404': { description: 'Transaksi tidak ditemukan' },
            }
        }
    },
  },
};