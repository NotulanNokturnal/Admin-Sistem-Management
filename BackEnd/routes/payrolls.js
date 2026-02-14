const express = require('express');
const router = express.Router();
const db = require('../db');


router.post('/calculate-weekly', (req, res) => {
    const { user_id, start_date, end_date } = req.body;
    
    db.query("SELECT COUNT(*) as days FROM attendance WHERE user_id=? AND date BETWEEN ? AND ?", 
    [user_id, start_date, end_date], (err, result) => {
        const days = result[0].days || 0;
        const amount = days * 25000;
        
        const note = `Transport ${days} hari kerja.`;
        db.query("INSERT INTO payroll (user_id, type, amount, period_start, period_end, notes) VALUES (?, 'mingguan_transport', ?, ?, ?, ?)", 
            [user_id, amount, start_date, end_date, note]);

        res.json({ status: true, message: "Transport Dihitung", data: { days, amount } });
    });
});


router.post('/calculate-monthly', (req, res) => {
    const { user_id, start_date, end_date } = req.body;
    
    const sql = `SELECT SUM(ti.quantity) as total_packs 
                 FROM transaction_items ti 
                 JOIN transactions t ON ti.transaction_id = t.id 
                 WHERE t.sales_id = ? AND t.created_at BETWEEN ? AND ?`;

    db.query(sql, [user_id, start_date, end_date], (err, result) => {
        const packs = result[0].total_packs || 0;
        const amount = packs * 1000; // 1rb per bungkus

        const note = `Komisi Penjualan: ${packs} bungkus.`;
        db.query("INSERT INTO payroll (user_id, type, amount, period_start, period_end, notes) VALUES (?, 'bulanan_gaji', ?, ?, ?, ?)", 
            [user_id, amount, start_date, end_date, note]);

        res.json({ status: true, message: "Gaji Komisi Dihitung", data: { packs, amount } });
    });
});

module.exports = router;