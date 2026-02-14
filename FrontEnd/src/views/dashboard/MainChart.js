import React, { useEffect, useRef } from 'react'
import { CChartLine } from '@coreui/react-chartjs'
import { getStyle } from '@coreui/utils'

// 1. TERIMA PROPS 'data' DARI DASHBOARD
const MainChart = ({ data }) => {
  const chartRef = useRef(null)

  useEffect(() => {
    const handleColorSchemeChange = () => {
      if (chartRef.current) {
        setTimeout(() => {
          chartRef.current.options.scales.x.grid.borderColor = getStyle('--cui-border-color-translucent')
          chartRef.current.options.scales.x.grid.color = getStyle('--cui-border-color-translucent')
          chartRef.current.options.scales.x.ticks.color = getStyle('--cui-body-color')
          chartRef.current.options.scales.y.grid.borderColor = getStyle('--cui-border-color-translucent')
          chartRef.current.options.scales.y.grid.color = getStyle('--cui-border-color-translucent')
          chartRef.current.options.scales.y.ticks.color = getStyle('--cui-body-color')
          chartRef.current.update()
        })
      }
    }

    document.documentElement.addEventListener('ColorSchemeChange', handleColorSchemeChange)
    return () =>
      document.documentElement.removeEventListener('ColorSchemeChange', handleColorSchemeChange)
  }, [chartRef])

  // --- DATA DEFAULT (Hanya dipakai jika API belum siap/loading) ---
  const defaultData = {
    labels: ['Loading...'],
    datasets: [
      {
        label: 'Data',
        backgroundColor: 'transparent',
        borderColor: getStyle('--cui-success'),
        pointHoverBackgroundColor: getStyle('--cui-success'),
        borderWidth: 2,
        data: [0],
      },
    ],
  }

  // 2. LOGIKA PENTING: Gunakan 'data' dari Dashboard jika ada.
  // Inilah yang membuat label berubah jadi tanggal/minggu.
  const chartData = data || defaultData

  return (
    <CChartLine
      ref={chartRef}
      style={{ height: '300px', marginTop: '40px' }}
      data={chartData}
      options={{
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
             callbacks: {
                label: function(context) {
                   let label = context.dataset.label || '';
                   if (label) { label += ': '; }
                   if (context.parsed.y !== null) {
                      label += new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(context.parsed.y);
                   }
                   return label;
                }
             }
          }
        },
        scales: {
          x: {
            grid: { color: getStyle('--cui-border-color-translucent'), drawOnChartArea: false },
            ticks: { color: getStyle('--cui-body-color') },
          },
          y: {
            beginAtZero: true,
            border: { color: getStyle('--cui-border-color-translucent') },
            grid: { color: getStyle('--cui-border-color-translucent') },
            ticks: {
                color: getStyle('--cui-body-color'),
                maxTicksLimit: 5
            },
          },
        },
        elements: {
          line: { tension: 0.4 },
          point: { radius: 4, hitRadius: 10, hoverRadius: 4, hoverBorderWidth: 3 },
        },
      }}
    />
  )
}

export default MainChart
