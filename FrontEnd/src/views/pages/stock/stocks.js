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
  CBadge,
  CButton,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CFormSelect,
  CFormInput,
  CFormLabel,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus, cilTrash, cilSave } from '@coreui/icons'

import api from '../../../api/axios.js'

const Stok = () => {
  const [dataStok, setDataStok] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [visible, setVisible] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)

  const [listSales, setListSales] = useState([])
  const [listProduk, setListProduk] = useState([])

  const [selectedSales, setSelectedSales] = useState('')
  const [transferItems, setTransferItems] = useState([
    { product_id: '', quantity: 1 }
  ])

  const customStyles = `
    .table-minimalist th {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #8a93a2;
      font-weight: 700;
      border-bottom: 1px solid #edf2f9;
      padding: 1rem;
    }
    .table-minimalist td {
      padding: 1rem;
      border-bottom: 1px solid #edf2f9;
      vertical-align: middle;
    }
    .card-clean {
      border: none;
      box-shadow: 0 0.8rem 2rem rgba(69, 65, 78, 0.05);
      border-radius: 12px;
    }
    .product-row:not(:last-child) {
      border-bottom: 1px dashed #ebedef;
      padding-bottom: 8px;
      margin-bottom: 8px;
    }
  `;

  useEffect(() => {
    fetchDataStok()
    fetchDropdownData()
  }, [])

  const fetchDataStok = async () => {
    setLoading(true)
    try {
      const response = await api.get('/stocks')
      const rawData = response.data.data

      // LOGIKA GROUPING: Menyatukan Sales & Tanggal, tapi merinci Produk & Stok
      const grouped = rawData.reduce((acc, curr) => {
        const dateKey = curr.created_at ? curr.created_at.split('T')[0] : 'Tanpa Tanggal'
        const groupKey = `${curr.user_id}-${dateKey}`

        if (!acc[groupKey]) {
          acc[groupKey] = {
            sales_name: curr.sales_name,
            display_date: dateKey,
            details: [] // Array untuk menampung rincian produk
          }
        }

        // Tambahkan rincian produk ke dalam grup yang sama
        acc[groupKey].details.push({
          product_name: curr.product_name,
          stock_held: curr.stock_held
        })

        return acc
      }, {})

      setDataStok(Object.values(grouped))
    } catch (err) {
      setError('Gagal mengambil data stok sales.')
    } finally {
      setLoading(false)
    }
  }

  const fetchDropdownData = async () => {
    try {
      const [resUsers, resProducts] = await Promise.all([
        api.get('/users'),
        api.get('/products')
      ])
      const salesOnly = resUsers.data.data.filter(user => user.role === 'sales')
      setListSales(salesOnly)
      setListProduk(resProducts.data.data)
    } catch (err) {}
  }

  const addRow = () => setTransferItems([...transferItems, { product_id: '', quantity: 1 }])
  const removeRow = (index) => {
    if (transferItems.length > 1) {
      const values = [...transferItems]; values.splice(index, 1); setTransferItems(values);
    }
  }

  const handleItemChange = (index, event) => {
    const values = [...transferItems]
    const { name, value } = event.target
    values[index][name] = name === 'quantity' ? (parseInt(value) || 1) : value
    setTransferItems(values)
  }

  const handleTransfer = async () => {
    if (!selectedSales || transferItems.some(item => !item.product_id)) {
      alert("Mohon lengkapi data!"); return;
    }
    setSubmitLoading(true)
    try {
      await Promise.all(transferItems.map(item => api.post('/stocks', {
        sales_id: parseInt(selectedSales),
        product_id: parseInt(item.product_id),
        quantity: parseInt(item.quantity)
      })))
      setVisible(false); setSelectedSales(''); setTransferItems([{ product_id: '', quantity: 1 }]);
      fetchDataStok(); alert('Transfer stok berhasil!');
    } catch (err) { alert('Gagal transfer stok.'); } finally { setSubmitLoading(false); }
  }

  const getStockBadge = (stock) => {
    if (stock <= 10) return 'danger'
    if (stock <= 30) return 'warning'
    return 'success'
  }

  return (
    <CRow>
      <style>{customStyles}</style>
      <CCol xs={12}>
        <CCard className="mb-4 card-clean">
          <CCardHeader className="bg-white border-0 py-3 d-flex justify-content-between align-items-center">
            <div>
              <h5 className="mb-0 fw-bold text-dark">Monitoring Stok Sales</h5>
              <small className="text-body-secondary">Rincian produk per sales dan tanggal</small>
            </div>
            <CButton color="primary" className="px-4 text-white fw-semibold shadow-sm" style={{ borderRadius: '50px' }} onClick={() => setVisible(true)}>
              <CIcon icon={cilPlus} className="me-2" /> Transfer Stok
            </CButton>
          </CCardHeader>

          <CCardBody className="p-0">
            {loading ? <div className="text-center py-5"><CSpinner color="primary" /></div> : error ? <div className="p-4"><CAlert color="danger">{error}</CAlert></div> : (
              <CTable align="middle" hover responsive className="table-minimalist mb-0">
                <CTableHead color="light">
                  <CTableRow>
                    <CTableHeaderCell className="text-center" style={{ width: '5%' }}>NO</CTableHeaderCell>
                    <CTableHeaderCell style={{ width: '25%' }}>SALES & TANGGAL</CTableHeaderCell>
                    <CTableHeaderCell>RINCIAN PRODUK & JUMLAH</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {dataStok.length > 0 ? dataStok.map((item, index) => (
                    <CTableRow key={index}>
                      <CTableDataCell className="text-center text-body-secondary fw-semibold">{index + 1}</CTableDataCell>
                      <CTableDataCell>
                        <div className="d-flex flex-column">
                          <span className="fw-bold text-dark">{item.sales_name}</span>
                          <span className="text-muted small">📅 {item.display_date}</span>
                        </div>
                      </CTableDataCell>
                      <CTableDataCell>
                        {/* ITERASI RINCIAN PRODUK DI DALAM SEL */}
                        {item.details.map((detail, idx) => (
                          <div key={idx} className="product-row d-flex justify-content-between align-items-center">
                            <span className="text-dark">{detail.product_name}</span>
                            <CBadge color={getStockBadge(detail.stock_held)} shape="rounded-pill" className="px-3">
                              {detail.stock_held} pcs
                            </CBadge>
                          </div>
                        ))}
                      </CTableDataCell>
                    </CTableRow>
                  )) : (
                    <CTableRow><CTableDataCell colSpan="3" className="text-center py-5">Tidak ada data.</CTableDataCell></CTableRow>
                  )}
                </CTableBody>
              </CTable>
            )}
          </CCardBody>
        </CCard>
      </CCol>

      {/* MODAL TRANSFER */}
      <CModal visible={visible} onClose={() => setVisible(false)} size="lg" backdrop="static">
        <CModalHeader onClose={() => setVisible(false)}><CModalTitle className="fw-bold">Transfer Stok</CModalTitle></CModalHeader>
        <CModalBody>
          <div className="mb-4">
            <CFormLabel className="fw-bold">Sales Tujuan</CFormLabel>
            <CFormSelect value={selectedSales} onChange={(e) => setSelectedSales(e.target.value)}>
              <option value="">-- Pilih Sales --</option>
              {listSales.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
            </CFormSelect>
          </div>
          <hr />
          <div className="d-flex justify-content-between mb-2">
            <CFormLabel className="fw-bold">Daftar Produk</CFormLabel>
            <CButton color="info" size="sm" variant="outline" onClick={addRow}><CIcon icon={cilPlus} /> Tambah</CButton>
          </div>
          {transferItems.map((item, index) => (
            <CRow key={index} className="mb-2 g-2 align-items-end border-bottom pb-2">
              <CCol md={6}><CFormSelect name="product_id" value={item.product_id} onChange={(e) => handleItemChange(index, e)}>
                <option value="">-- Pilih Produk --</option>
                {listProduk.map(p => <option key={p.id} value={p.id}>{p.name} (Gudang: {p.stock_warehouse})</option>)}
              </CFormSelect></CCol>
              <CCol md={4}><CFormInput type="number" name="quantity" value={item.quantity} onChange={(e) => handleItemChange(index, e)} /></CCol>
              <CCol md={2} className="text-end"><CButton color="danger" variant="ghost" onClick={() => removeRow(index)} disabled={transferItems.length === 1}><CIcon icon={cilTrash} /></CButton></CCol>
            </CRow>
          ))}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setVisible(false)}>Batal</CButton>
          <CButton color="primary" onClick={handleTransfer} disabled={submitLoading}>
            {submitLoading ? <CSpinner size="sm"/> : <><CIcon icon={cilSave} className="me-2"/>Simpan</>}
          </CButton>
        </CModalFooter>
      </CModal>
    </CRow>
  )
}

export default Stok
