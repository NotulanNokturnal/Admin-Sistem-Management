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
  CForm,
  CFormLabel,
  CFormInput,
  CBadge,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus, cilPencil, cilTrash } from '@coreui/icons' // Menambah icon edit/hapus (opsional)

// Sesuaikan path import axios Anda
import api from '../../../api/axios.js'

const Produk = () => {
  // --- STATE DATA UTAMA ---
  const [dataProduk, setDataProduk] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // --- STATE UNTUK MODAL & FORM ---
  const [visible, setVisible] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    base_price: '',
    consumer_price: '',
    stock_warehouse: ''
  })

  // --- STYLE CSS UNTUK HILANGKAN SPINNER & CUSTOM SCROLLBAR ---
  const customStyles = `
    input[type=number]::-webkit-inner-spin-button,
    input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
    input[type=number] { -moz-appearance: textfield; }

    .table-minimalist th {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #8a93a2;
      font-weight: 700;
      border-bottom: 1px solid #edf2f9;
      padding-top: 1rem;
      padding-bottom: 1rem;
    }
    .table-minimalist td {
      padding-top: 1rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #edf2f9;
    }
    .card-clean {
      border: none;
      box-shadow: 0 0.8rem 2rem rgba(69, 65, 78, 0.05);
      border-radius: 12px;
    }
  `;

  // --- LOAD DATA ---
  useEffect(() => {
    fetchDataProduk()
  }, [])

  const fetchDataProduk = async () => {
    setLoading(true)
    try {
      const response = await api.get('/products')
      setDataProduk(response.data.data)
    } catch (err) {
      console.error('Error fetching data:', err)
      setError('Gagal mengambil data produk.')
    } finally {
      setLoading(false)
    }
  }

  // --- HELPER FORMATTING ---
  const formatRupiahInput = (value, prefix = 'Rp ') => {
    const numberString = value.replace(/[^,\d]/g, '').toString()
    const split = numberString.split(',')
    const sisa = split[0].length % 3
    let rupiah = split[0].substr(0, sisa)
    const ribuan = split[0].substr(sisa).match(/\d{3}/gi)

    if (ribuan) {
      const separator = sisa ? '.' : ''
      rupiah += separator + ribuan.join('.')
    }
    rupiah = split[1] !== undefined ? rupiah + ',' + split[1] : rupiah
    return prefix + rupiah
  }

  const handleNameChange = (e) => setFormData({ ...formData, name: e.target.value })

  const handlePriceChange = (e) => {
    const { name, value } = e.target
    if (value === '') { setFormData({ ...formData, [name]: '' }); return }
    const formatted = formatRupiahInput(value)
    setFormData({ ...formData, [name]: formatted })
  }

  const handleStockChange = (e) => {
    const { value } = e.target
    const cleanValue = value.replace(/[^0-9]/g, '')
    setFormData({ ...formData, stock_warehouse: cleanValue })
  }

  // --- HANDLE SIMPAN ---
  const saveProduct = async () => {
    const rawBasePrice = formData.base_price ? parseInt(formData.base_price.replace(/[^0-9]/g, '')) : 0
    const rawConsumerPrice = formData.consumer_price ? parseInt(formData.consumer_price.replace(/[^0-9]/g, '')) : 0
    const rawStock = formData.stock_warehouse ? parseInt(formData.stock_warehouse) : 0

    if (!formData.name || !rawBasePrice || !rawConsumerPrice) {
      alert("Mohon lengkapi nama dan harga produk!")
      return
    }

    setSubmitLoading(true)
    try {
      await api.post('/products', {
        name: formData.name,
        base_price: rawBasePrice,
        consumer_price: rawConsumerPrice,
        stock_warehouse: rawStock
      })

      setVisible(false)
      setFormData({ name: '', base_price: '', consumer_price: '', stock_warehouse: '' })
      fetchDataProduk()
      // alert('Produk berhasil ditambahkan!') -> Opsional, bisa dihapus agar lebih clean
    } catch (err) {
      console.error('Gagal simpan:', err)
      alert('Gagal menyimpan produk.')
    } finally {
      setSubmitLoading(false)
    }
  }

  const formatRupiahDisplay = (angka) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency', currency: 'IDR', minimumFractionDigits: 0
    }).format(angka)
  }

  // Helper untuk warna badge stok
  const getStockBadge = (stock) => {
    if (stock <= 10) return 'danger' // Merah jika stok kritis
    if (stock <= 50) return 'warning' // Kuning jika stok menipis
    return 'success' // Hijau jika aman
  }

  return (
    <CRow>
      <style>{customStyles}</style>

      <CCol xs={12}>
        <CCard className="mb-4 card-clean">
          {/* Header yang lebih bersih tanpa background abu-abu */}
          <CCardHeader className="bg-white border-0 py-3 d-flex justify-content-between align-items-center">
            <div>
              <h5 className="mb-0 fw-bold text-dark">Daftar Produk</h5>
              <small className="text-body-secondary">Kelola inventory rokok Anda di sini</small>
            </div>
            <CButton
              color="primary"
              className="px-4 text-white fw-semibold shadow-sm"
              style={{ borderRadius: '50px' }} // Tombol rounded (pill shape)
              onClick={() => setVisible(true)}
            >
              <CIcon icon={cilPlus} className="me-2" />
              Tambah
            </CButton>
          </CCardHeader>

          <CCardBody className="p-0"> {/* Padding 0 agar tabel mepet tepi */}
            {loading && <div className="text-center py-5"><CSpinner color="primary" /></div>}
            {error && <div className="p-4"><CAlert color="danger">{error}</CAlert></div>}

            {!loading && !error && (
              <CTable align="middle" hover responsive className="table-minimalist mb-0">
                <CTableHead color="light">
                  <CTableRow>
                    <CTableHeaderCell className="text-center ps-4" style={{ width: '5%' }}>NO</CTableHeaderCell>
                    <CTableHeaderCell style={{ width: '35%' }}>PRODUK</CTableHeaderCell>
                    <CTableHeaderCell style={{ width: '20%' }}>HARGA DASAR</CTableHeaderCell>
                    <CTableHeaderCell style={{ width: '20%' }}>HARGA JUAL</CTableHeaderCell>
                    <CTableHeaderCell className="text-center" style={{ width: '15%' }}>STOK</CTableHeaderCell>
                    <CTableHeaderCell className="text-end pe-4" style={{ width: '5%' }}></CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {dataProduk.length > 0 ? (
                    dataProduk.map((item, index) => (
                      <CTableRow key={item.id || index}>
                        <CTableDataCell className="text-center ps-4 text-body-secondary fw-semibold">
                          {index + 1}
                        </CTableDataCell>
                        <CTableDataCell>
                          <div className="d-flex flex-column">
                            <span className="fw-bold text-dark">{item.name}</span>
                            <span className="small text-body-secondary" style={{ fontSize: '0.75rem' }}>
                              SKU-ID: #{item.id}
                            </span>
                          </div>
                        </CTableDataCell>
                        <CTableDataCell className="text-body-secondary">
                          {formatRupiahDisplay(item.base_price)}
                        </CTableDataCell>
                        <CTableDataCell>
                          <span className="fw-bold text-primary">
                            {formatRupiahDisplay(item.consumer_price)}
                          </span>
                        </CTableDataCell>
                        <CTableDataCell className="text-center">
                          {/* Menggunakan Badge agar lebih visual */}
                          <CBadge color={getStockBadge(item.stock_warehouse)} shape="rounded-pill" className="px-3">
                            {item.stock_warehouse} pcs
                          </CBadge>
                        </CTableDataCell>
                        <CTableDataCell className="text-end pe-4">
                            {/* Tombol aksi dummy (opsional) agar tabel seimbang */}
                            <CButton color="light" size="sm" className="text-secondary shadow-sm">
                                <CIcon icon={cilPencil} size="sm"/>
                            </CButton>
                        </CTableDataCell>
                      </CTableRow>
                    ))
                  ) : (
                    <CTableRow>
                      <CTableDataCell colSpan="6" className="text-center py-5 text-body-secondary">
                        <div className="mb-2">Data produk masih kosong.</div>
                        <CButton color="link" onClick={() => setVisible(true)}>Tambah sekarang</CButton>
                      </CTableDataCell>
                    </CTableRow>
                  )}
                </CTableBody>
              </CTable>
            )}
          </CCardBody>
        </CCard>
      </CCol>

      {/* --- MODAL (POPUP) --- */}
      <CModal
        visible={visible}
        onClose={() => setVisible(false)}
        alignment="center" // Modal muncul di tengah layar
        backdrop="static" // Klik luar tidak menutup modal (mencegah close tidak sengaja)
      >
        <CModalHeader onClose={() => setVisible(false)} className="border-0 pb-0">
          <CModalTitle className="fw-bold">Tambah Produk</CModalTitle>
        </CModalHeader>
        <CModalBody className="pt-4">
          <CForm>
            <div className="mb-3">
              <CFormLabel className="text-body-secondary small text-uppercase fw-bold">Nama Produk</CFormLabel>
              <CFormInput
                type="text"
                placeholder="Misal: Sampoerna Mild 16"
                name="name"
                value={formData.name}
                onChange={handleNameChange}
                className="py-2"
              />
            </div>

            <CRow>
              <CCol md={6}>
                 <div className="mb-3">
                  <CFormLabel className="text-body-secondary small text-uppercase fw-bold">Harga Beli</CFormLabel>
                  <CFormInput
                    type="text"
                    placeholder="Rp 0"
                    name="base_price"
                    value={formData.base_price}
                    onChange={handlePriceChange}
                    className="py-2"
                  />
                </div>
              </CCol>
              <CCol md={6}>
                <div className="mb-3">
                  <CFormLabel className="text-body-secondary small text-uppercase fw-bold">Harga Jual</CFormLabel>
                  <CFormInput
                    type="text"
                    placeholder="Rp 0"
                    name="consumer_price"
                    value={formData.consumer_price}
                    onChange={handlePriceChange}
                    className="py-2 fw-bold text-primary" // Highlight harga jual
                  />
                </div>
              </CCol>
            </CRow>

            <div className="mb-3">
              <CFormLabel className="text-body-secondary small text-uppercase fw-bold">Stok Awal</CFormLabel>
              <CFormInput
                type="text"
                placeholder="0"
                name="stock_warehouse"
                value={formData.stock_warehouse}
                onChange={handleStockChange}
                inputMode="numeric"
                className="py-2"
              />
            </div>
          </CForm>
        </CModalBody>
        <CModalFooter className="border-0 pt-0 pb-4">
          <CButton color="light" className="text-secondary fw-semibold px-4" onClick={() => setVisible(false)}>
            Batal
          </CButton>
          <CButton color="primary" className="fw-semibold px-4 text-white" onClick={saveProduct} disabled={submitLoading} style={{borderRadius: '50px'}}>
            {submitLoading ? <CSpinner size="sm" /> : 'Simpan Produk'}
          </CButton>
        </CModalFooter>
      </CModal>
    </CRow>
  )
}

export default Produk
