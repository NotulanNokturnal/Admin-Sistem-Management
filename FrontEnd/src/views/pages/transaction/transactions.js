import React, { useEffect, useState } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CSpinner,
  CAlert,
  CButton,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CFormSelect,
  CFormInput,
  CFormLabel,
  CBadge,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus, cilCart, cilTrash, cilSave, cilMoney } from '@coreui/icons'

// Pastikan path axios benar
import api from '../../../api/axios.js'

const Transactions = () => {
  // --- STATE DATA ---
  const [transactions, setTransactions] = useState([]) // History Data
  const [products, setProducts] = useState([])         // Data Barang untuk Dropdown
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // --- STATE TRANSAKSI BARU (CART SYSTEM) ---
  const [visible, setVisible] = useState(false) // Modal Visibility
  const [cart, setCart] = useState([])          // Barang yang dipilih
  const [selectedProduct, setSelectedProduct] = useState('') // ID barang yang sedang dipilih di dropdown
  const [qtyInput, setQtyInput] = useState(1)   // Input jumlah barang
  const [submitLoading, setSubmitLoading] = useState(false)

  // --- FORMAT CURRENCY ---
  const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency', currency: 'IDR', minimumFractionDigits: 0
    }).format(angka)
  }

  // --- 1. FETCH DATA (History & Products) ---
  useEffect(() => {
    fetchTransactions()
    fetchProducts()
  }, [])

  const fetchTransactions = async () => {
    setLoading(true)
    try {
      // GET Data Transaksi (Sesuai Gambar GET)
      const response = await api.get('/transactions')
      if (response.data && response.data.data) {
        setTransactions(response.data.data)
      }
    } catch (err) {
      console.error('Error fetching transactions:', err)
      setError('Gagal mengambil data transaksi.')
    } finally {
      setLoading(false)
    }
  }

  const fetchProducts = async () => {
    try {
      // Perlu ambil data produk untuk dropdown pilihan barang
      const response = await api.get('/products')
      setProducts(response.data.data)
    } catch (err) {
      console.error('Error fetching products:', err)
    }
  }

  // --- 2. LOGIKA KERANJANG (CART) ---

  // Mencari detail produk berdasarkan ID yang dipilih
  const currentProductDetail = products.find(p => p.id.toString() === selectedProduct)

  const addToCart = () => {
    if (!currentProductDetail) return
    if (qtyInput <= 0) return alert("Jumlah harus lebih dari 0")
    if (qtyInput > currentProductDetail.stock_warehouse) return alert("Stok tidak mencukupi!")

    // Cek apakah barang sudah ada di cart
    const existingItem = cart.find(item => item.product_id === currentProductDetail.id)

    if (existingItem) {
      // Jika ada, update qty
      setCart(cart.map(item =>
        item.product_id === currentProductDetail.id
          ? { ...item, quantity: item.quantity + parseInt(qtyInput) }
          : item
      ))
    } else {
      // Jika belum, tambah baru
      setCart([...cart, {
        product_id: currentProductDetail.id,
        name: currentProductDetail.name,
        price: parseFloat(currentProductDetail.consumer_price), // Pastikan harga float
        quantity: parseInt(qtyInput)
      }])
    }

    // Reset input
    setQtyInput(1)
    setSelectedProduct('')
  }

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.product_id !== productId))
  }

  // Hitung Total Belanja (Grand Total)
  const grandTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0)

  // --- 3. POST TRANSAKSI (SIMPAN) ---
  const saveTransaction = async () => {
    if (cart.length === 0) return alert("Keranjang masih kosong!")

    setSubmitLoading(true)
    try {
      // Struktur Data sesuai Gambar POST Postman
      const payload = {
        user_id: 1, // Hardcode 1 (Atau ambil dari login session jika ada)
        created_at: new Date().toISOString().split('T')[0], // Format YYYY-MM-DD
        total_transactions: grandTotal, // Total harga
        items: cart.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity
        }))
      }

      console.log("Payload dikirim:", payload) // Debugging

      await api.post('/transactions', payload)

      setVisible(false) // Tutup Modal
      setCart([]) // Kosongkan Keranjang
      fetchTransactions() // Refresh Data Table
      alert('Transaksi berhasil disimpan!')
    } catch (err) {
      console.error('Gagal simpan:', err)
      alert('Gagal menyimpan transaksi.')
    } finally {
      setSubmitLoading(false)
    }
  }

  // --- CSS CUSTOM ---
  const customStyles = `
    .table-minimalist th {
      font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; color: #8a93a2;
      font-weight: 700; border-bottom: 1px solid #edf2f9; padding: 1rem;
    }
    .table-minimalist td { padding: 1rem; border-bottom: 1px solid #edf2f9; }
    .card-clean { border: none; box-shadow: 0 0.8rem 2rem rgba(69, 65, 78, 0.05); border-radius: 12px; }
    .product-info-box { background: #f8f9fa; border-radius: 8px; padding: 15px; margin-top: 10px; border: 1px dashed #ced4da; }
  `

  return (
    <CRow>
      <style>{customStyles}</style>

      <CCol xs={12}>
        <CCard className="mb-4 card-clean">
          <CCardHeader className="bg-white border-0 py-3 d-flex justify-content-between align-items-center">
            <div>
              <h5 className="mb-0 fw-bold text-dark">Riwayat Transaksi</h5>
              <small className="text-body-secondary">Data penjualan masuk</small>
            </div>
            {/* Tombol Transaksi Baru */}
            <CButton
              color="primary"
              className="px-4 text-white fw-semibold shadow-sm"
              style={{ borderRadius: '50px' }}
              onClick={() => setVisible(true)}
            >
              <CIcon icon={cilPlus} className="me-2" />
              Transaksi Baru
            </CButton>
          </CCardHeader>

          <CCardBody className="p-0">
            {loading && <div className="text-center py-5"><CSpinner color="primary" /></div>}
            {error && <div className="p-4"><CAlert color="danger">{error}</CAlert></div>}

            {!loading && !error && (
              <CTable align="middle" hover responsive className="table-minimalist mb-0">
                <CTableHead color="light">
                  <CTableRow>
                    <CTableHeaderCell className="text-center">ID</CTableHeaderCell>
                    <CTableHeaderCell>TANGGAL</CTableHeaderCell>
                    <CTableHeaderCell>TOTAL</CTableHeaderCell>
                    <CTableHeaderCell className="text-center">STATUS</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {transactions.map((item, index) => (
                    <CTableRow key={index}>
                      <CTableDataCell className="text-center fw-bold">#{item.transaction_id}</CTableDataCell>
                      <CTableDataCell>
                        {new Date(item.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </CTableDataCell>
                      <CTableDataCell className="fw-bold text-primary">
                        {formatRupiah(item.total_amount)}
                      </CTableDataCell>
                      <CTableDataCell className="text-center">
                        <CBadge color="success" shape="rounded-pill">Selesai</CBadge>
                      </CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            )}
          </CCardBody>
        </CCard>
      </CCol>

      {/* --- MODAL TRANSAKSI BARU (FLOATING MENU) --- */}
      <CModal
        visible={visible}
        onClose={() => setVisible(false)}
        size="lg" // Modal lebih besar untuk kasir
        backdrop="static"
      >
        <CModalHeader onClose={() => setVisible(false)}>
          <CModalTitle className="fw-bold">Buat Transaksi Baru</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CRow>
            {/* BAGIAN KIRI: Form Input Barang */}
            <CCol md={5} className="border-end">
                <div className="mb-3">
                    <CFormLabel className="fw-bold small">Pilih Produk</CFormLabel>
                    <CFormSelect
                        value={selectedProduct}
                        onChange={(e) => setSelectedProduct(e.target.value)}
                    >
                        <option value="">-- Cari Barang --</option>
                        {products.map(p => (
                            <option key={p.id} value={p.id}>
                                {p.name}
                            </option>
                        ))}
                    </CFormSelect>
                </div>

                {/* Info Produk Terpilih (Stok & Harga) */}
                {currentProductDetail && (
                    <div className="product-info-box mb-3">
                        <h6 className="fw-bold mb-1">{currentProductDetail.name}</h6>
                        <div className="d-flex justify-content-between small text-secondary mb-2">
                            <span>Stok: {currentProductDetail.stock_warehouse}</span>
                            <span>Harga: {formatRupiah(currentProductDetail.consumer_price)}</span>
                        </div>

                        <div className="d-flex align-items-end gap-2">
                            <div className="w-50">
                                <label className="small fw-bold">Jumlah</label>
                                <CFormInput
                                    type="number"
                                    min="1"
                                    value={qtyInput}
                                    onChange={(e) => setQtyInput(e.target.value)}
                                />
                            </div>
                            <CButton color="dark" className="w-50 text-white" onClick={addToCart}>
                                <CIcon icon={cilCart} className="me-1"/> Tambah
                            </CButton>
                        </div>
                    </div>
                )}
            </CCol>

            {/* BAGIAN KANAN: List Keranjang (Cart) */}
            <CCol md={7}>
                <h6 className="fw-bold mb-3">Keranjang Belanja</h6>
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    <CTable small hover bordered>
                        <CTableHead color="light">
                            <CTableRow>
                                <CTableHeaderCell>Produk</CTableHeaderCell>
                                <CTableHeaderCell className="text-center" width="15%">Qty</CTableHeaderCell>
                                <CTableHeaderCell className="text-end">Subtotal</CTableHeaderCell>
                                <CTableHeaderCell width="5%"></CTableHeaderCell>
                            </CTableRow>
                        </CTableHead>
                        <CTableBody>
                            {cart.length > 0 ? (
                                cart.map((item, idx) => (
                                    <CTableRow key={idx}>
                                        <CTableDataCell className="small">{item.name}</CTableDataCell>
                                        <CTableDataCell className="text-center">{item.quantity}</CTableDataCell>
                                        <CTableDataCell className="text-end">{formatRupiah(item.price * item.quantity)}</CTableDataCell>
                                        <CTableDataCell>
                                            <CButton size="sm" color="link" className="text-danger p-0" onClick={() => removeFromCart(item.product_id)}>
                                                <CIcon icon={cilTrash} />
                                            </CButton>
                                        </CTableDataCell>
                                    </CTableRow>
                                ))
                            ) : (
                                <CTableRow>
                                    <CTableDataCell colSpan="4" className="text-center text-secondary py-4 small">
                                        Belum ada barang dipilih.
                                    </CTableDataCell>
                                </CTableRow>
                            )}
                        </CTableBody>
                    </CTable>
                </div>

                {/* Grand Total Display */}
                <div className="d-flex justify-content-between align-items-center bg-light p-3 rounded mt-3">
                    <span className="fw-bold text-secondary">Total Bayar:</span>
                    <h4 className="fw-bold text-primary mb-0">{formatRupiah(grandTotal)}</h4>
                </div>
            </CCol>
          </CRow>
        </CModalBody>
        <CModalFooter>
          <CButton color="light" onClick={() => setVisible(false)}>Tutup</CButton>
          <CButton color="success" className="text-white fw-bold px-4" onClick={saveTransaction} disabled={submitLoading || cart.length === 0}>
            {submitLoading ? <CSpinner size="sm" /> : (
                <>
                    <CIcon icon={cilSave} className="me-2" />
                    Simpan Transaksi
                </>
            )}
          </CButton>
        </CModalFooter>
      </CModal>
    </CRow>
  )
}

export default Transactions
