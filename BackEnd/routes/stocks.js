const express = require('express');
const router = express.Router();
const db = require('../db');

router.post('/', (req, res) => {
    const { product_id, sales_id, quantity } = req.body;

    // 1. Cek Stok Gudang
    db.query("SELECT stock_warehouse FROM products WHERE id = ?", [product_id], (err, resProd) => {
        if (err) return res.json({ status: false, message: err.message });
        if (resProd.length === 0) return res.json({ status: false, message: "Produk tidak ditemukan!" });
        
        if (resProd[0].stock_warehouse < quantity) {
            return res.json({ status: false, message: "Stok Gudang Kurang!" });
        }

        // 2. Potong Stok Gudang
        db.query("UPDATE products SET stock_warehouse = stock_warehouse - ? WHERE id = ?", [quantity, product_id], () => {
            
            // 3. Tambah Stok Sales (Upsert)
            const check = "SELECT * FROM sales_stock WHERE user_id=? AND product_id=?";
            db.query(check, [sales_id, product_id], (err2, resCheck) => {
                if (resCheck.length > 0) {
                    // Update stok yang sudah ada
                    db.query(
                        "UPDATE sales_stock SET stock_held = stock_held + ? WHERE user_id=? AND product_id=?", 
                        [quantity, sales_id, product_id]
                    );
                } else {
                    // Insert data baru (created_at akan terisi otomatis oleh database)
                    db.query(
                        "INSERT INTO sales_stock (user_id, product_id, stock_held) VALUES (?, ?, ?)", 
                        [sales_id, product_id, quantity]
                    );
                }
                res.json({ 
                    status: true, 
                    message: "Transfer Berhasil",
                    timestamp: new Date() // Memberikan info waktu balik ke Postman
                });
            });
        });
    });
});

// Tambahkan di atas module.exports = router;

// 1. Get Semua Stok yang dipegang Sales
router.get('/', (req, res) => {
    const sql = `
        SELECT 
            ss.user_id, 
            u.username AS sales_name, 
            ss.product_id, 
            p.name AS product_name, 
            ss.stock_held,
            ss.created_at 
        FROM sales_stock ss
        JOIN users u ON ss.user_id = u.id
        JOIN products p ON ss.product_id = p.id
        ORDER BY ss.created_at DESC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({ 
                status: false, 
                message: "Gagal mengambil data stok sales: " + err.message,
                data: null 
            });
        }

        res.json({ 
            status: true, 
            message: "Berhasil mengambil data stok sales", 
            data: results 
        });
    });
});

// 2. Get Stok spesifik untuk satu Sales tertentu
router.get('/:sales_id', (req, res) => {
    const { sales_id } = req.params;
    const sql = `
        SELECT 
            p.name AS product_name, 
            ss.stock_held 
        FROM sales_stock ss
        JOIN products p ON ss.product_id = p.id
        WHERE ss.user_id = ?
    `;

    db.query(sql, [sales_id], (err, results) => {
        if (err) {
            return res.status(500).json({ 
                status: false, 
                message: "Gagal mengambil detail stok: " + err.message,
                data: null 
            });
        }

        res.json({ 
            status: true, 
            message: "Data stok sales ditemukan", 
            data: results 
        });
    });
});

module.exports = router;