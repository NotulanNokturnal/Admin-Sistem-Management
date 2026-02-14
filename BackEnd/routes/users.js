const express = require('express');
const router = express.Router();
const db = require('../db');

router.post('/',(req, res) => {
    const{ username, password, role} = req.body;
    const sql = "INSERT INTO users (username, password, role) VALUES(?, ?, ?)";
    db.query(sql,[username,password,role],(err, result)=>{
        if(err)return res.json({status: false, message: err.message});
        res.json({status:true, message:"User berhasil dibuat", data: result.insertId});
    })
})

// 1. Get Semua User
router.get('/', (req, res) => {
    const sql = "SELECT id, username, role FROM users";
    
    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({ 
                status: false, 
                message: "Gagal mengambil data user: " + err.message,
                data: null 
            });
        }
        
        res.json({ 
            status: true, 
            message: "Berhasil mengambil semua data user", 
            data: results 
        });
    });
});

// 2. Get User Berdasarkan ID
router.get('/:id', (req, res) => {
    const { id } = req.params;
    const sql = "SELECT id, username, role FROM users WHERE id = ?";
    
    db.query(sql, [id], (err, result) => {
        if (err) {
            return res.status(500).json({ 
                status: false, 
                message: "Gagal mengambil detail user: " + err.message,
                data: null 
            });
        }
        
        if (result.length === 0) {
            return res.status(404).json({ 
                status: false, 
                message: "User tidak ditemukan", 
                data: null 
            });
        }
        
        res.json({ 
            status: true, 
            message: "Berhasil mengambil detail user", 
            data: result[0] 
        });
    });
});

module.exports = router;