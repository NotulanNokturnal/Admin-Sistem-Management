const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) =>{
    db.query('SELECT * FROM products ORDER BY id DESC',(err, result) => {
        if(err)return res.json({status: false, message: err.message});
        res.json({status: true, message: "Data produk berhasil diambil", data: result});
    });
});

router.post('/', async (req, res) =>{
    const {name, base_price, consumer_price,stock_warehouse} = req.body;
    const sql ="INSERT INTO products(name , base_price, consumer_price, stock_warehouse) values (?,?,?,?)";
    db.query(sql,[name , base_price, consumer_price, stock_warehouse], (err, result) => {
        if(err) return res.json({status:false , message: err.message});
        res.json({status:true, message: "Produk berhasil ditambahkan", data: result.insertId});
    });
});


module.exports = router;

