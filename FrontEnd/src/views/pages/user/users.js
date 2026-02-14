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
  CFormSelect,
  CBadge,
  CInputGroup,
  CInputGroupText,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus, cilPencil, cilUser, cilLockLocked, cilPeople } from '@coreui/icons'

// Pastikan path axios benar
import api from '../../../api/axios.js'

const Users = () => {
  // --- STATE ---
  const [dataUsers, setDataUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // --- MODAL STATE ---
  const [visible, setVisible] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)

  // State Form User (Sesuai Postman POST)
  const [formData, setFormData] = useState({
    username: '',
    password: '', // Menambahkan field password
    role: 'sales'
  })

  // --- CSS CUSTOM ---
  const customStyles = `
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

  // --- 1. GET DATA USERS ---
  useEffect(() => {
    fetchDataUsers()
  }, [])

  const fetchDataUsers = async () => {
    setLoading(true)
    try {
      // GET /users
      const response = await api.get('/users')
      setDataUsers(response.data.data)
    } catch (err) {
      console.error('Error fetching users:', err)
      setError('Gagal mengambil data user.')
    } finally {
      setLoading(false)
    }
  }

  // --- HANDLE INPUT CHANGE ---
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  // --- 2. POST DATA USER (SIMPAN) ---
  const saveUser = async () => {
    // Validasi input
    if (!formData.username || !formData.password) {
      alert("Mohon lengkapi username dan password!")
      return
    }

    setSubmitLoading(true)
    try {
      // Payload sesuai gambar Postman
      await api.post('/users', {
        username: formData.username,
        password: formData.password, // Kirim password
        role: formData.role
      })

      setVisible(false) // Tutup Modal
      setFormData({ username: '', password: '', role: 'sales' }) // Reset Form
      fetchDataUsers() // Refresh Tabel
      // alert('User berhasil ditambahkan!')
    } catch (err) {
      console.error('Gagal simpan:', err)
      alert('Gagal menyimpan user.')
    } finally {
      setSubmitLoading(false)
    }
  }

  // Helper Warna Badge Role
  const getRoleBadge = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin': return 'primary'
      case 'sales': return 'success'
      case 'gudang': return 'warning'
      default: return 'secondary'
    }
  }

  return (
    <CRow>
      <style>{customStyles}</style>

      <CCol xs={12}>
        <CCard className="mb-4 card-clean">
          <CCardHeader className="bg-white border-0 py-3 d-flex justify-content-between align-items-center">
            <div>
              <h5 className="mb-0 fw-bold text-dark">Data Pengguna</h5>
              <small className="text-body-secondary">Kelola akses user aplikasi di sini</small>
            </div>
            <CButton
              color="primary"
              className="px-4 text-white fw-semibold shadow-sm"
              style={{ borderRadius: '50px' }}
              onClick={() => setVisible(true)}
            >
              <CIcon icon={cilPlus} className="me-2" />
              Tambah User
            </CButton>
          </CCardHeader>

          <CCardBody className="p-0">
            {loading && <div className="text-center py-5"><CSpinner color="primary" /></div>}
            {error && <div className="p-4"><CAlert color="danger">{error}</CAlert></div>}

            {!loading && !error && (
              <CTable align="middle" hover responsive className="table-minimalist mb-0">
                <CTableHead color="light">
                  <CTableRow>
                    <CTableHeaderCell className="text-center ps-4" style={{ width: '5%' }}>NO</CTableHeaderCell>
                    <CTableHeaderCell style={{ width: '40%' }}>USERNAME</CTableHeaderCell>
                    <CTableHeaderCell style={{ width: '20%' }}>ROLE</CTableHeaderCell>
                    <CTableHeaderCell className="text-end pe-4" style={{ width: '10%' }}>AKSI</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {dataUsers.length > 0 ? (
                    dataUsers.map((item, index) => (
                      <CTableRow key={item.id || index}>
                        <CTableDataCell className="text-center ps-4 text-body-secondary fw-semibold">
                          {index + 1}
                        </CTableDataCell>
                        <CTableDataCell>
                          <div className="d-flex align-items-center">
                            <div className="bg-light rounded-circle p-2 me-3 text-primary d-flex justify-content-center align-items-center" style={{width: '40px', height: '40px'}}>
                                <CIcon icon={cilUser} />
                            </div>
                            <div className="d-flex flex-column">
                                <span className="fw-bold text-dark">{item.username}</span>
                                <span className="small text-body-secondary" style={{ fontSize: '0.75rem' }}>
                                ID: #{item.id}
                                </span>
                            </div>
                          </div>
                        </CTableDataCell>
                        <CTableDataCell>
                          <CBadge color={getRoleBadge(item.role)} shape="rounded-pill" className="px-3 text-uppercase">
                            {item.role}
                          </CBadge>
                        </CTableDataCell>
                        <CTableDataCell className="text-end pe-4">
                            <CButton color="light" size="sm" className="text-secondary shadow-sm">
                                <CIcon icon={cilPencil} size="sm"/>
                            </CButton>
                        </CTableDataCell>
                      </CTableRow>
                    ))
                  ) : (
                    <CTableRow>
                      <CTableDataCell colSpan="4" className="text-center py-5 text-body-secondary">
                        <div className="mb-2">Data user masih kosong.</div>
                        <CButton color="link" onClick={() => setVisible(true)}>Tambah User Baru</CButton>
                      </CTableDataCell>
                    </CTableRow>
                  )}
                </CTableBody>
              </CTable>
            )}
          </CCardBody>
        </CCard>
      </CCol>

      {/* --- MODAL INPUT USER --- */}
      <CModal
        visible={visible}
        onClose={() => setVisible(false)}
        alignment="center"
        backdrop="static"
      >
        <CModalHeader onClose={() => setVisible(false)} className="border-0 pb-0">
          <CModalTitle className="fw-bold">Tambah User Baru</CModalTitle>
        </CModalHeader>
        <CModalBody className="pt-4">
          <CForm>
            {/* Input Username */}
            <div className="mb-3">
              <CFormLabel className="text-body-secondary small text-uppercase fw-bold">Username</CFormLabel>
              <CInputGroup>
                <CInputGroupText className="bg-light border-end-0">
                    <CIcon icon={cilUser} />
                </CInputGroupText>
                <CFormInput
                    type="text"
                    placeholder="Misal: budi_sales"
                    name="username"
                    className="border-start-0 ps-1"
                    value={formData.username}
                    onChange={handleInputChange}
                />
              </CInputGroup>
            </div>

            {/* Input Password (BARU) */}
            <div className="mb-3">
              <CFormLabel className="text-body-secondary small text-uppercase fw-bold">Password</CFormLabel>
              <CInputGroup>
                <CInputGroupText className="bg-light border-end-0">
                    <CIcon icon={cilLockLocked} />
                </CInputGroupText>
                <CFormInput
                    type="password"
                    placeholder="Masukkan password..."
                    name="password"
                    className="border-start-0 ps-1"
                    value={formData.password}
                    onChange={handleInputChange}
                />
              </CInputGroup>
            </div>

            {/* Select Role */}
            <div className="mb-3">
              <CFormLabel className="text-body-secondary small text-uppercase fw-bold">Role / Jabatan</CFormLabel>
              <CInputGroup>
                <CInputGroupText className="bg-light border-end-0">
                    <CIcon icon={cilPeople} />
                </CInputGroupText>
                <CFormSelect
                    name="role"
                    className="border-start-0 ps-1"
                    value={formData.role}
                    onChange={handleInputChange}
                >
                    <option value="sales">Sales</option>
                    <option value="admin">Admin</option>
                    <option value="gudang">Gudang</option>
                </CFormSelect>
              </CInputGroup>
            </div>
          </CForm>
        </CModalBody>
        <CModalFooter className="border-0 pt-0 pb-4">
          <CButton color="light" className="text-secondary fw-semibold px-4" onClick={() => setVisible(false)}>
            Batal
          </CButton>
          <CButton color="primary" className="fw-semibold px-4 text-white" onClick={saveUser} disabled={submitLoading} style={{borderRadius: '50px'}}>
            {submitLoading ? <CSpinner size="sm" /> : 'Simpan User'}
          </CButton>
        </CModalFooter>
      </CModal>
    </CRow>
  )
}

export default Users
