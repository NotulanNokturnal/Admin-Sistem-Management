import React, { useEffect, useState } from 'react'
import classNames from 'classnames'

import {
  CButton,
  CButtonGroup,
  CCard,
  CCardBody,
  CCol,
  CRow,
  CSpinner,
  CFormInput, // Import Input Tanggal
  CInputGroup,
  CInputGroupText,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilCloudDownload,
  cilArrowTop,
  cilArrowBottom,
  cilCalendar, // Icon Kalender
} from '@coreui/icons'

import MainChart from './MainChart'
import WidgetsDropdown from '../widgets/WidgetsDropdown'
import api from '../../api/axios.js'

const Dashboard = () => {
  // --- STATE ---
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeRange, setActiveRange] = useState('Month')

  // State untuk Custom Date Range
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  const [chartData, setChartData] = useState(null)
  const [salesSummary, setSalesSummary] = useState({
    total: 0,
    percentageChange: 0,
    isIncrease: true,
    periodLabel: ''
  })

  // --- FETCH DATA ---
  useEffect(() => {
    fetchTransactions()
  }, [])

  // Efek samping: Update data saat filter atau transaksi berubah
  useEffect(() => {
    if (transactions.length > 0) {
      // Jika mode Custom, tunggu sampai user isi tanggal start & end dulu
      if (activeRange === 'Custom') {
        if (customStart && customEnd) {
          processData('Custom')
        }
      } else {
        processData(activeRange)
      }
    }
  }, [transactions, activeRange, customStart, customEnd])

  const fetchTransactions = async () => {
    try {
      const response = await api.get('/transactions')
      if (response.data && response.data.data) {
        setTransactions(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  // --- LOGIC PROSES DATA ---
  const processData = (range) => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()
    const currentDate = now.getDate()
    const monthName = now.toLocaleString('id-ID', { month: 'short' })

    let labels = []
    let dataPoints = []
    let currentTotal = 0
    let previousTotal = 0
    let periodLabel = ''

    const parseAmount = (amount) => parseFloat(amount)

    // --- 1. FILTER: DAY ---
    if (range === 'Day') {
      const daysToShow = currentDate
      labels = Array.from({ length: daysToShow }, (_, i) => `${i + 1} ${monthName}`)
      dataPoints = new Array(daysToShow).fill(0)

      transactions.forEach((t) => {
        const tDate = new Date(t.created_at)
        if (tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear) {
          const day = tDate.getDate()
          const amount = parseAmount(t.total_amount)
          if (day <= daysToShow) dataPoints[day - 1] += amount
          if (day === currentDate) currentTotal += amount
          if (day === currentDate - 1) previousTotal += amount
        }
      })
      periodLabel = 'Today'
    }
    // --- 2. FILTER: WEEK ---
    else if (range === 'Week') {
      labels = []
      dataPoints = [0, 0, 0, 0, 0]

      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
      for (let i = 0; i < 5; i++) {
        let start = i * 7 + 1
        let end = start + 6
        if (start > daysInMonth) break;
        if (end > daysInMonth) end = daysInMonth;
        labels.push(`${start}-${end} ${monthName}`)
      }

      const getWeekIndex = (date) => Math.floor((date.getDate() - 1) / 7)
      const currentWeekIndex = getWeekIndex(now)

      transactions.forEach((t) => {
        const tDate = new Date(t.created_at)
        if (tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear) {
          const weekIndex = getWeekIndex(tDate)
          const amount = parseAmount(t.total_amount)
          if (weekIndex < dataPoints.length) dataPoints[weekIndex] += amount
          if (weekIndex === currentWeekIndex) currentTotal += amount
          if (weekIndex === currentWeekIndex - 1) previousTotal += amount
        }
      })
      periodLabel = 'This Week'
    }
    // --- 3. FILTER: MONTH ---
    else if (range === 'Month') {
      labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      dataPoints = new Array(12).fill(0)

      transactions.forEach((t) => {
        const tDate = new Date(t.created_at)
        if (tDate.getFullYear() === currentYear) {
          const month = tDate.getMonth()
          const amount = parseAmount(t.total_amount)
          dataPoints[month] += amount
          if (month === currentMonth) currentTotal += amount
          if (month === currentMonth - 1) previousTotal += amount
        }
      })
      periodLabel = 'This Month'
    }
    // --- 4. FILTER: CUSTOM RANGE (NEW) ---
    else if (range === 'Custom') {
      const start = new Date(customStart)
      const end = new Date(customEnd)

      // Hitung selisih hari untuk looping
      const diffTime = Math.abs(end - start)
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1 // +1 agar inklusif

      // Generate Label per Hari dalam Range
      for (let i = 0; i < diffDays; i++) {
        let d = new Date(start)
        d.setDate(d.getDate() + i)
        labels.push(`${d.getDate()} ${d.toLocaleString('id-ID', { month: 'short' })}`)
        dataPoints.push(0)
      }

      // Isi Data
      transactions.forEach((t) => {
        const tDate = new Date(t.created_at)
        // Reset jam agar perbandingan tanggal akurat
        tDate.setHours(0,0,0,0)

        // Cek apakah tanggal transaksi ada di dalam range start s/d end
        // Kita pakai getTime() untuk membandingkan angka milliseconds
        const tTime = tDate.getTime()
        const startTime = new Date(start).setHours(0,0,0,0)
        const endTime = new Date(end).setHours(0,0,0,0)

        if (tTime >= startTime && tTime <= endTime) {
          const amount = parseAmount(t.total_amount)
          currentTotal += amount

          // Cari index hari ke berapa dari start date
          const dayIndex = Math.floor((tTime - startTime) / (1000 * 60 * 60 * 24))
          if (dayIndex >= 0 && dayIndex < dataPoints.length) {
            dataPoints[dayIndex] += amount
          }
        }
      })
      periodLabel = 'Selected Range'
      // Note: Previous Total untuk custom range agak kompleks, kita set 0 dulu atau samakan agar persen 0%
      previousTotal = currentTotal
    }

    // --- HITUNG PERSENTASE ---
    let percentage = 0
    let isIncrease = true

    if (previousTotal === 0 && currentTotal === 0) {
        percentage = 0
    } else if (previousTotal === 0) {
      percentage = 100
      isIncrease = true
    } else if (range === 'Custom') {
       // Khusus Custom, karena tidak ada pembanding periode lalu yang pasti, kita hidden indikatornya
       percentage = 0
    } else {
      const diff = currentTotal - previousTotal
      percentage = Math.abs((diff / previousTotal) * 100)
      isIncrease = diff >= 0
    }

    setSalesSummary({
      total: currentTotal,
      percentageChange: percentage.toFixed(1),
      isIncrease: isIncrease,
      periodLabel: periodLabel
    })

    setChartData({
      labels: labels,
      datasets: [{
          label: 'Penjualan (Rp)',
          backgroundColor: 'rgba(50, 31, 219, 0.1)',
          borderColor: 'rgba(50, 31, 219, 1)',
          pointHoverBackgroundColor: 'rgba(50, 31, 219, 1)',
          borderWidth: 2,
          data: dataPoints,
          fill: true,
      }],
    })
  }

  const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency', currency: 'IDR', minimumFractionDigits: 0,
    }).format(angka)
  }

  return (
    <>
      <WidgetsDropdown className="mb-4" />

      <CCard className="mb-4 border-0 shadow-sm" style={{ borderRadius: '16px', overflow: 'hidden' }}>
        <CCardBody className="p-4">
          {/* --- HEADER & FILTER BUTTONS --- */}
          <CRow className="align-items-center mb-4">
            <CCol sm={5}>
              <h4 id="traffic" className="card-title mb-0 fw-bold text-dark">
                Sales Overview
              </h4>
              <div className="small text-body-secondary mt-1">
                 {/* Menampilkan status periode aktif dengan gaya lebih bersih */}
                 {activeRange === 'Custom'
                    ? <span className="text-primary fw-semibold">Mode Rentang Tanggal</span>
                    : new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                 }
              </div>
            </CCol>

            <CCol sm={7} className="d-flex justify-content-end align-items-center gap-2">
              <CButton color="light" className="text-secondary shadow-sm rounded-pill" title="Download">
                <CIcon icon={cilCloudDownload} />
              </CButton>

              <div className="bg-light p-1 rounded-pill d-inline-flex">
                {['Day', 'Week', 'Month', 'Custom'].map((value) => (
                  <CButton
                    color={activeRange === value ? 'white' : 'transparent'}
                    key={value}
                    className={`border-0 rounded-pill px-3 py-1 ${activeRange === value ? 'shadow-sm text-primary fw-semibold' : 'text-body-secondary'}`}
                    size="sm"
                    onClick={() => setActiveRange(value)}
                  >
                    {value}
                  </CButton>
                ))}
              </div>
            </CCol>
          </CRow>

          {/* --- PANEL CUSTOM DATE (Hanya muncul jika 'Custom' diklik) --- */}
          {activeRange === 'Custom' && (
            <div className="bg-body-tertiary p-3 rounded-4 mb-4 animate__animated animate__fadeIn">
                <CRow className="align-items-center justify-content-center g-3">
                    <CCol xs="auto" className="text-body-secondary small fw-bold text-uppercase">
                        Pilih Rentang:
                    </CCol>
                    <CCol md={4} lg={3}>
                        <CInputGroup className="input-group-flush shadow-sm rounded-3 overflow-hidden bg-white">
                            <CInputGroupText className="bg-white border-0 ps-3 text-primary">
                                <CIcon icon={cilCalendar} />
                            </CInputGroupText>
                            <CFormInput
                                type="date"
                                className="border-0 bg-transparent py-2"
                                style={{ fontSize: '0.9rem' }}
                                value={customStart}
                                onChange={(e) => setCustomStart(e.target.value)}
                            />
                        </CInputGroup>
                    </CCol>
                    <CCol xs="auto" className="text-body-tertiary">
                        <CIcon icon={cilArrowBottom} style={{ transform: 'rotate(-90deg)' }} />
                    </CCol>
                    <CCol md={4} lg={3}>
                        <CInputGroup className="input-group-flush shadow-sm rounded-3 overflow-hidden bg-white">
                            <CInputGroupText className="bg-white border-0 ps-3 text-primary">
                                <CIcon icon={cilCalendar} />
                            </CInputGroupText>
                            <CFormInput
                                type="date"
                                className="border-0 bg-transparent py-2"
                                style={{ fontSize: '0.9rem' }}
                                value={customEnd}
                                onChange={(e) => setCustomEnd(e.target.value)}
                            />
                        </CInputGroup>
                    </CCol>
                </CRow>
            </div>
          )}

          {/* --- STATISTIK RINGKAS --- */}
          <CRow className="mb-4">
            <CCol sm={12}>
              <div className="d-flex flex-column bg-primary bg-opacity-10 p-4 rounded-4 border border-primary border-opacity-10">
                <span className="text-primary text-uppercase fw-bold" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>
                   Total Penjualan ({salesSummary.periodLabel})
                </span>
                <div className="d-flex align-items-end gap-3 mt-2">
                    <div className="display-6 fw-bold text-dark">
                        {loading ? <CSpinner size="sm"/> : formatRupiah(salesSummary.total)}
                    </div>

                    {/* Indikator Persen */}
                    {activeRange !== 'Custom' && (
                        <div className={`badge rounded-pill py-2 px-3 mb-2 ${salesSummary.isIncrease ? 'bg-success text-white' : 'bg-danger text-white'}`}>
                            <CIcon icon={salesSummary.isIncrease ? cilArrowTop : cilArrowBottom} className="me-1" size="sm"/>
                            {salesSummary.percentageChange}%
                        </div>
                    )}
                </div>
                {activeRange !== 'Custom' && (
                    <span className="text-body-secondary small mt-1">
                        Dibandingkan dengan periode sebelumnya
                    </span>
                )}
              </div>
            </CCol>
          </CRow>

          {/* --- CHART --- */}
          <MainChart data={chartData} style={{ height: '350px' }} />
        </CCardBody>
      </CCard>
    </>
  )
}

export default Dashboard
