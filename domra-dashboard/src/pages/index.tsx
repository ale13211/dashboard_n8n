import { useState, useEffect, useCallback } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from 'recharts'

const COLORS = ['#22c55e', '#16a34a', '#4ade80', '#86efac', '#bbf7d0', '#dcfce7']

const ESTADO_CONFIG: any = {
  cerrado:    { label: 'Cerrado', color: '#22c55e', bg: '#052e16' },
  por_cerrar: { label: 'Por cerrar', color: '#facc15', bg: '#1c1400' },
  en_proceso: { label: 'En proceso', color: '#60a5fa', bg: '#0c1a2e' },
  lead:       { label: 'Lead nuevo', color: '#a78bfa', bg: '#1a0c2e' },
}

function formatGs(n: number) {
  return new Intl.NumberFormat('es-PY').format(n) + ' Gs.'
}

export default function Dashboard() {
  const [data, setData] = useState<any>(null)
  const [tab, setTab] = useState<'dashboard' | 'crm'>('dashboard')
  const [filtro, setFiltro] = useState('todos')
  const [busqueda, setBusqueda] = useState('')
  const [editando, setEditando] = useState<any>(null)
  const [notaTemp, setNotaTemp] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    const res = await fetch('/api/leads')
    const json = await res.json()
    setData(json)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [fetchData])

  const guardarNota = async (id: string, nota: string, estado?: string) => {
    await fetch('/api/leads', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, nota, estado }),
    })
    fetchData()
    setEditando(null)
  }

  const leadsFiltrados = data?.leads?.filter((l: any) => {
    const matchFiltro = filtro === 'todos' || l.estado === filtro
    const matchBusqueda = !busqueda ||
      l.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      l.ciudad.toLowerCase().includes(busqueda.toLowerCase()) ||
      l.telefono.includes(busqueda)
    return matchFiltro && matchBusqueda
  }) || []

  if (loading) return (
    <div style={{ background: '#0a0f0a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🦷</div>
        <div style={{ fontFamily: 'Syne, sans-serif', color: '#22c55e', fontSize: 18 }}>Cargando Domra Dashboard...</div>
      </div>
    </div>
  )

  const { stats, leads } = data

  return (
    <div style={{ background: '#0a0f0a', minHeight: '100vh', fontFamily: 'DM Sans, sans-serif', color: '#e8f5e9' }}>

      {/* HEADER */}
      <div style={{ borderBottom: '1px solid #1a2e1a', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0d150d' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 28 }}>🦷</span>
          <div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 20, color: '#22c55e', letterSpacing: '-0.5px' }}>DOMRA</div>
            <div style={{ fontSize: 11, color: '#4ade80', letterSpacing: '3px', marginTop: -2 }}>DASHBOARD</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['dashboard', 'crm'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: 13, letterSpacing: '1px', textTransform: 'uppercase',
              background: tab === t ? '#22c55e' : '#1a2e1a',
              color: tab === t ? '#0a0f0a' : '#4ade80',
              transition: 'all 0.2s',
            }}>{t === 'dashboard' ? '📊 Métricas' : '👥 CRM'}</button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e' }}></div>
          <span style={{ fontSize: 13, color: '#4ade80' }}>Live · actualiza cada 30s</span>
        </div>
      </div>

      <div style={{ padding: '24px 32px', maxWidth: 1400, margin: '0 auto' }}>

        {/* ============ DASHBOARD ============ */}
        {tab === 'dashboard' && (
          <>
            {/* KPI CARDS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
              {[
                { label: 'Ventas Cerradas', value: stats.cerrados, sub: `${stats.conversionRate}% conversión`, icon: '✅', color: '#22c55e', bg: '#052e16' },
                { label: 'Monto Total', value: formatGs(stats.totalMonto), sub: `${stats.totalUnidades} cajas vendidas`, icon: '💰', color: '#4ade80', bg: '#0a1f0a' },
                { label: 'Por Cerrar', value: stats.porCerrar, sub: 'Esperando comprobante', icon: '⏳', color: '#facc15', bg: '#1c1400' },
                { label: 'Total Leads', value: stats.totalLeads, sub: `${stats.enProceso} en proceso`, icon: '📲', color: '#60a5fa', bg: '#0c1a2e' },
              ].map((card, i) => (
                <div key={i} style={{ background: card.bg, border: `1px solid ${card.color}22`, borderRadius: 16, padding: '20px 24px', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 16, right: 20, fontSize: 28, opacity: 0.3 }}>{card.icon}</div>
                  <div style={{ fontSize: 12, color: card.color, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 8 }}>{card.label}</div>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800, color: card.color, lineHeight: 1 }}>{card.value}</div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 6 }}>{card.sub}</div>
                </div>
              ))}
            </div>

            {/* FUNNEL */}
            <div style={{ background: '#0d150d', border: '1px solid #1a2e1a', borderRadius: 16, padding: '20px 24px', marginBottom: 24 }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14, color: '#4ade80', letterSpacing: '1px', marginBottom: 16 }}>FUNNEL DE VENTAS</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {[
                  { label: 'Leads', value: stats.totalLeads, color: '#a78bfa' },
                  { label: 'En proceso', value: stats.enProceso, color: '#60a5fa' },
                  { label: 'Por cerrar', value: stats.porCerrar, color: '#facc15' },
                  { label: 'Cerrados', value: stats.cerrados, color: '#22c55e' },
                ].map((f, i, arr) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', flex: 1, gap: 8 }}>
                    <div style={{ flex: 1, background: f.color + '22', border: `1px solid ${f.color}44`, borderRadius: 10, padding: '12px 16px', textAlign: 'center' }}>
                      <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 24, fontWeight: 800, color: f.color }}>{f.value}</div>
                      <div style={{ fontSize: 11, color: f.color + 'aa', marginTop: 4 }}>{f.label}</div>
                    </div>
                    {i < arr.length - 1 && <div style={{ color: '#374151', fontSize: 20 }}>→</div>}
                  </div>
                ))}
              </div>
            </div>

            {/* CHARTS */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 16, marginBottom: 24 }}>

              {/* Ventas por día */}
              <div style={{ background: '#0d150d', border: '1px solid #1a2e1a', borderRadius: 16, padding: '20px 24px' }}>
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14, color: '#4ade80', letterSpacing: '1px', marginBottom: 16 }}>VENTAS POR DÍA</div>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={stats.ventasPorDia}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1a2e1a" />
                    <XAxis dataKey="dia" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#0d150d', border: '1px solid #1a2e1a', borderRadius: 8, color: '#e8f5e9' }} formatter={(v: any) => [v, 'Ventas']} />
                    <Bar dataKey="ventas" fill="#22c55e" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Zona */}
              <div style={{ background: '#0d150d', border: '1px solid #1a2e1a', borderRadius: 16, padding: '20px 24px' }}>
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14, color: '#4ade80', letterSpacing: '1px', marginBottom: 16 }}>POR ZONA</div>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={stats.porZona} dataKey="value" nameKey="zona" cx="50%" cy="50%" outerRadius={70} label={({ zona, percent }: any) => `${zona} ${(percent * 100).toFixed(0)}%`} labelLine={false} style={{ fontSize: 10, fill: '#e8f5e9' }}>
                      {stats.porZona.map((_: any, i: number) => <Cell key={i} fill={COLORS[i]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#0d150d', border: '1px solid #1a2e1a', borderRadius: 8, color: '#e8f5e9' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Canal */}
              <div style={{ background: '#0d150d', border: '1px solid #1a2e1a', borderRadius: 16, padding: '20px 24px' }}>
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14, color: '#4ade80', letterSpacing: '1px', marginBottom: 16 }}>POR CANAL</div>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={stats.porCanal} dataKey="value" nameKey="canal" cx="50%" cy="50%" outerRadius={70} label={({ canal, percent }: any) => `${canal} ${(percent * 100).toFixed(0)}%`} labelLine={false} style={{ fontSize: 10, fill: '#e8f5e9' }}>
                      {stats.porCanal.map((_: any, i: number) => <Cell key={i} fill={COLORS[i + 1]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#0d150d', border: '1px solid #1a2e1a', borderRadius: 8, color: '#e8f5e9' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top ciudades */}
            <div style={{ background: '#0d150d', border: '1px solid #1a2e1a', borderRadius: 16, padding: '20px 24px' }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14, color: '#4ade80', letterSpacing: '1px', marginBottom: 16 }}>TOP CIUDADES</div>
              <div style={{ display: 'flex', gap: 12 }}>
                {stats.topCiudades.map((c: any, i: number) => (
                  <div key={i} style={{ flex: 1, background: '#052e16', border: '1px solid #1a2e1a', borderRadius: 12, padding: '12px 16px', textAlign: 'center' }}>
                    <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, color: COLORS[i] }}>{c.count}</div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{c.ciudad}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ============ CRM ============ */}
        {tab === 'crm' && (
          <>
            {/* Filtros */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                placeholder="🔍 Buscar por nombre, ciudad o teléfono..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                style={{ flex: 1, minWidth: 240, padding: '10px 16px', background: '#0d150d', border: '1px solid #1a2e1a', borderRadius: 10, color: '#e8f5e9', fontSize: 14, outline: 'none', fontFamily: 'DM Sans, sans-serif' }}
              />
              {['todos', 'cerrado', 'por_cerrar', 'en_proceso', 'lead'].map(f => (
                <button key={f} onClick={() => setFiltro(f)} style={{
                  padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontFamily: 'DM Sans, sans-serif', fontWeight: 500,
                  background: filtro === f ? (ESTADO_CONFIG[f]?.color || '#22c55e') : '#1a2e1a',
                  color: filtro === f ? '#0a0f0a' : '#4ade80',
                  transition: 'all 0.2s',
                }}>
                  {f === 'todos' ? `Todos (${leads.length})` : `${ESTADO_CONFIG[f]?.label} (${leads.filter((l: any) => l.estado === f).length})`}
                </button>
              ))}
            </div>

            {/* Tabla */}
            <div style={{ background: '#0d150d', border: '1px solid #1a2e1a', borderRadius: 16, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #1a2e1a' }}>
                    {['Cliente', 'Teléfono', 'Ciudad / Zona', 'Canal', 'Monto', 'Estado', 'Nota', 'Acciones'].map(h => (
                      <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: 11, color: '#4ade80', fontFamily: 'Syne, sans-serif', letterSpacing: '1px', fontWeight: 700 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {leadsFiltrados.map((lead: any, i: number) => {
                    const cfg = ESTADO_CONFIG[lead.estado] || ESTADO_CONFIG.lead
                    const isEditing = editando?.id === lead.id
                    return (
                      <tr key={lead.id} style={{ borderBottom: '1px solid #0f1f0f', background: i % 2 === 0 ? '#0a0f0a' : '#0d150d', transition: 'background 0.15s' }}>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{lead.nombre}</div>
                          <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{lead.fecha}</div>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <a href={`https://wa.me/${lead.telefono.replace(/\D/g,'')}`} target="_blank" rel="noreferrer"
                            style={{ color: '#22c55e', textDecoration: 'none', fontSize: 13, fontFamily: 'JetBrains Mono, monospace' }}>
                            📱 {lead.telefono}
                          </a>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontSize: 13 }}>{lead.ciudad}</div>
                          <div style={{ fontSize: 11, color: lead.zona === 'Central' ? '#4ade80' : '#60a5fa', marginTop: 2 }}>{lead.zona}</div>
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: 13, color: '#9ca3af' }}>{lead.canal}</td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: lead.monto > 0 ? '#22c55e' : '#6b7280' }}>
                            {lead.monto > 0 ? formatGs(lead.monto) : '—'}
                          </div>
                          {lead.cantidad > 0 && <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{lead.cantidad} {lead.cantidad === 1 ? 'caja' : 'cajas'}</div>}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <select
                            value={lead.estado}
                            onChange={e => guardarNota(lead.id, lead.nota, e.target.value)}
                            style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}44`, borderRadius: 6, padding: '4px 8px', fontSize: 12, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', outline: 'none' }}
                          >
                            {Object.entries(ESTADO_CONFIG).map(([k, v]: any) => (
                              <option key={k} value={k}>{v.label}</option>
                            ))}
                          </select>
                        </td>
                        <td style={{ padding: '14px 16px', maxWidth: 200 }}>
                          {isEditing ? (
                            <div style={{ display: 'flex', gap: 6 }}>
                              <input
                                value={notaTemp}
                                onChange={e => setNotaTemp(e.target.value)}
                                style={{ flex: 1, padding: '4px 8px', background: '#1a2e1a', border: '1px solid #22c55e', borderRadius: 6, color: '#e8f5e9', fontSize: 12, outline: 'none' }}
                                onKeyDown={e => e.key === 'Enter' && guardarNota(lead.id, notaTemp)}
                                autoFocus
                              />
                              <button onClick={() => guardarNota(lead.id, notaTemp)} style={{ background: '#22c55e', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 12, color: '#0a0f0a', fontWeight: 700 }}>✓</button>
                              <button onClick={() => setEditando(null)} style={{ background: '#1a2e1a', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 12, color: '#6b7280' }}>✕</button>
                            </div>
                          ) : (
                            <div onClick={() => { setEditando(lead); setNotaTemp(lead.nota || '') }}
                              style={{ fontSize: 12, color: lead.nota ? '#9ca3af' : '#374151', cursor: 'pointer', minHeight: 20, padding: '2px 0' }}>
                              {lead.nota || <span style={{ color: '#374151', fontStyle: 'italic' }}>+ agregar nota</span>}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <a href={`https://wa.me/595${lead.telefono.replace(/^0/, '').replace(/\D/g,'')}`}
                            target="_blank" rel="noreferrer"
                            style={{ background: '#052e16', border: '1px solid #1a2e1a', borderRadius: 8, padding: '6px 12px', color: '#22c55e', textDecoration: 'none', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
                            💬 Escribir
                          </a>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {leadsFiltrados.length === 0 && (
                <div style={{ textAlign: 'center', padding: 40, color: '#374151' }}>
                  No hay leads con ese filtro
                </div>
              )}
            </div>

            {/* Resumen CRM */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 16 }}>
              {Object.entries(ESTADO_CONFIG).map(([key, cfg]: any) => {
                const count = leads.filter((l: any) => l.estado === key).length
                const monto = leads.filter((l: any) => l.estado === key).reduce((s: number, l: any) => s + l.monto, 0)
                return (
                  <div key={key} style={{ background: cfg.bg, border: `1px solid ${cfg.color}22`, borderRadius: 12, padding: '14px 18px' }}>
                    <div style={{ fontSize: 11, color: cfg.color, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>{cfg.label}</div>
                    <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 24, fontWeight: 800, color: cfg.color, marginTop: 4 }}>{count}</div>
                    {monto > 0 && <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>{formatGs(monto)}</div>}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
