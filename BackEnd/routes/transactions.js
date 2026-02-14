const express = require('express');
const router = express.Router();
const db = require('../db');

router.post('/', (req, res) => {
    const { user_id, items, created_at, total_transactions } = req.body; 
    
    // 1. Logika Absensi & Target 40 Transaksi
    const isTarget = total_transactions >= 40 ? 1 : 0;
    
    const sqlAbsen = `INSERT INTO attendance (user_id, date, total_transactions, is_target_reached, status) 
                      VALUES (?, ?, ?, ?, 'hadir') 
                      ON DUPLICATE KEY UPDATE total_transactions=VALUES(total_transactions), is_target_reached=VALUES(is_target_reached)`;
    
    db.query(sqlAbsen, [user_id, created_at, total_transactions, isTarget], (err) => {
        if (err) return res.json({ status: false, message: "Error Absen: " + err.message });

        if (!items || items.length === 0) {
            return res.json({ status: true, message: "Absensi/Target dicatat (Tanpa Barang)" });
        }

        // 2. Logika Barang & Komisi
        db.query("INSERT INTO transactions (sales_id, created_at) VALUES (?, ?)", [user_id, created_at], (err2, resTrans) => {
            const transId = resTrans.insertId;
            let totalAmount = 0;

            items.forEach(item => {
    // 1. Cek stok yang tersedia di sales_stock dulu
    db.query("SELECT stock_held FROM sales_stock WHERE user_id=? AND product_id=?", [user_id, item.product_id], (errStock, stockRes) => {
        const currentStock = stockRes.length > 0 ? stockRes[0].stock_held : 0;

        // Jika stok tidak cukup, kita bisa log error atau skip (ideal menggunakan Promise/Async)
        if (currentStock < item.quantity) {
                        console.log(`Stok produk ${item.product_id} tidak cukup!`);
                        return; 
                    }

                    // 2. Ambil harga produk
                    db.query("SELECT consumer_price FROM products WHERE id=?", [item.product_id], (e, prodArr) => {
                        const p = prodArr[0];
                        const subtotal = p.consumer_price * item.quantity;

                        // 3. Masukkan ke detail transaksi
                        db.query(`INSERT INTO transaction_items (transaction_id, product_id, quantity, profit_share) VALUES (?, ?, ?, 1000)`, 
                            [transId, item.product_id, item.quantity]);
                        
                        // 4. POTONG STOK (Otomatis berkurang sesuai input)
                        db.query(`UPDATE sales_stock SET stock_held = stock_held - ? WHERE user_id=? AND product_id=?`, 
                            [item.quantity, user_id, item.product_id]);

                        // 5. Update total transaksi di table header
                        db.query("UPDATE transactions SET total_amount = total_amount + ? WHERE id=?", [subtotal, transId]);
                    });
                });
            });
            res.json({ status: true, message: "Laporan Transaksi Tersimpan!" });
        });
    });
});

router.get('/', (req, res) => {
    const sql = `
        SELECT 
            t.id AS transaction_id, 
            t.sales_id, 
            t.total_amount, 
            t.created_at,
            a.status AS attendance_status,
            a.is_target_reached
        FROM transactions t
        LEFT JOIN attendance a ON t.sales_id = a.user_id AND DATE(t.created_at) = DATE(a.date)
        ORDER BY t.created_at DESC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({ 
                status: false, 
                message: "Gagal mengambil data: " + err.message,
                data: null
            });
        }

        res.json({ 
            status: true, 
            message: "Berhasil mengambil semua data transaksi", 
            data: results 
        });
    });
});

router.get('/history/:sales_id', async (req, res) => {
    const { sales_id } = req.params;

    try {
        const sql = `
            SELECT 
                t.id AS transaction_id, 
                t.total_amount, 
                t.created_at,
                a.is_target_reached,
                a.status AS attendance_status,
                JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'product_name', p.name,
                        'quantity', ti.quantity,
                        'subtotal', (p.consumer_price * ti.quantity)
                    )
                ) AS items
            FROM transactions t
            LEFT JOIN transaction_items ti ON t.id = ti.transaction_id
            LEFT JOIN products p ON ti.product_id = p.id
            LEFT JOIN attendance a ON t.sales_id = a.user_id AND DATE(t.created_at) = DATE(a.date)
            WHERE t.sales_id = ?
            GROUP BY t.id
            ORDER BY t.created_at DESC
        `;

        const results = await query(sql, [sales_id]);

        // Parsing hasil JSON jika perlu (tergantung driver mysql2)
        const formattedData = results.map(row => ({
            ...row,
            items: typeof row.items === 'string' ? JSON.parse(row.items) : row.items
        }));

        res.json({ 
            status: true, 
            message: "Berhasil mengambil riwayat transaksi", 
            data: formattedData 
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ 
            status: false, 
            message: "Gagal mengambil riwayat: " + err.message 
        });
    }
});


router.get('/history-all', async (req, res) => {
    try {
        const sql = `
            SELECT 
                t.id AS transaction_id, 
                u.username AS sales_name,
                t.total_amount, 
                t.created_at,
                a.status AS attendance_status,
                a.is_target_reached,
                JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'product_name', p.name,
                        'quantity', ti.quantity,
                        'subtotal', (p.consumer_price * ti.quantity)
                    )
                ) AS details
            FROM transactions t
            JOIN users u ON t.sales_id = u.id
            LEFT JOIN transaction_items ti ON t.id = ti.transaction_id
            LEFT JOIN products p ON ti.product_id = p.id
            LEFT JOIN attendance a ON t.sales_id = a.user_id AND DATE(t.created_at) = DATE(a.date)
            GROUP BY t.id
            ORDER BY t.created_at DESC
        `;

        const results = await query(sql);

        // Memastikan format JSON untuk detail barang benar
        const formattedData = results.map(row => ({
            ...row,
            details: typeof row.details === 'string' ? JSON.parse(row.details) : row.details
        }));

        res.json({ 
            status: true, 
            message: "Berhasil mengambil keseluruhan history transaksi", 
            data: formattedData 
        });

    } catch (err) {
        console.error("Error History All:", err);
        res.status(500).json({ 
            status: false, 
            message: "Gagal mengambil history: " + err.message 
        });
    }
});
module.exports = router;