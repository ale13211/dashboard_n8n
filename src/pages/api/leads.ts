import type { NextApiRequest, NextApiResponse } from 'next'

let leads: any[] = [
  { id: '1', from: '595981111111', nombre: 'María González', telefono: '0981111111', ciudad: 'Asunción', zona: 'Central', paso: 'pedido_confirmado', cantidad: 1, monto: 139000, fecha: '2025-05-20', canal: 'WhatsApp', estado: 'cerrado', nota: '' },
  { id: '2', from: '595991222222', nombre: 'Carlos López', telefono: '0991222222', ciudad: 'Encarnación', zona: 'Interior', paso: 'espera_comprobante', cantidad: 2, monto: 278000, fecha: '2025-05-21', canal: 'WhatsApp', estado: 'por_cerrar', nota: 'Esperando pago' },
  { id: '3', from: '595971333333', nombre: 'Ana Martínez', telefono: '0971333333', ciudad: 'San Lorenzo', zona: 'Central', paso: 'pedido_confirmado', cantidad: 1, monto: 139000, fecha: '2025-05-21', canal: 'WhatsApp', estado: 'cerrado', nota: '' },
  { id: '4', from: '595981444444', nombre: 'Luis Benítez', telefono: '0981444444', ciudad: 'Ciudad del Este', zona: 'Interior', paso: 'espera_datos_interior', cantidad: 1, monto: 139000, fecha: '2025-05-22', canal: 'WhatsApp', estado: 'en_proceso', nota: '' },
  { id: '5', from: '595991555555', nombre: 'Sofía Rodríguez', telefono: '0991555555', ciudad: 'Luque', zona: 'Central', paso: 'pedido_confirmado', cantidad: 3, monto: 417000, fecha: '2025-05-22', canal: 'Oferta Flash', estado: 'cerrado', nota: '' },
  { id: '6', from: '595971666666', nombre: 'Diego Fernández', telefono: '0971666666', ciudad: 'Coronel Oviedo', zona: 'Interior', paso: 'espera_comprobante', cantidad: 1, monto: 139000, fecha: '2025-05-23', canal: 'WhatsApp', estado: 'por_cerrar', nota: 'Cliente dudoso' },
  { id: '7', from: '595981777777', nombre: 'Valentina Torres', telefono: '0981777777', ciudad: 'Asunción', zona: 'Central', paso: 'espera_ciudad_cantidad', cantidad: 0, monto: 0, fecha: '2025-05-23', canal: 'WhatsApp', estado: 'lead', nota: '' },
  { id: '8', from: '595991888888', nombre: 'Roberto Núñez', telefono: '0991888888', ciudad: 'Villarrica', zona: 'Interior', paso: 'pedido_confirmado', cantidad: 2, monto: 278000, fecha: '2025-05-24', canal: 'Oferta Flash', estado: 'cerrado', nota: '' },
  { id: '9', from: '595971999999', nombre: 'Camila Acosta', telefono: '0971999999', ciudad: 'Fernando de la Mora', zona: 'Central', paso: 'espera_datos_central', cantidad: 1, monto: 139000, fecha: '2025-05-24', canal: 'WhatsApp', estado: 'en_proceso', nota: '' },
  { id: '10', from: '595981000001', nombre: 'Javier Ramírez', telefono: '0981000001', ciudad: 'Pedro Juan Caballero', zona: 'Interior', paso: 'pedido_confirmado', cantidad: 1, monto: 139000, fecha: '2025-05-25', canal: 'WhatsApp', estado: 'cerrado', nota: '' },
]

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  if (req.method === 'POST') {
    const { from, nombre, telefono, ciudad, zona, paso, cantidad, canal, nota } = req.body
    if (!from) return res.status(400).json({ error: 'from requerido' })
    const estado =
      paso === 'pedido_confirmado' ? 'cerrado' :
      (paso === 'espera_comprobante' || paso === 'espera_comprobante_flash') ? 'por_cerrar' :
      (paso === 'espera_datos_central' || paso === 'espera_datos_interior') ? 'en_proceso' : 'lead'
    const cant = Number(cantidad) || 0
    const existing = leads.findIndex(l => l.from === from)
    const lead = {
      id: existing >= 0 ? leads[existing].id : String(Date.now()),
      from, nombre: nombre || 'Sin nombre', telefono: telefono || '',
      ciudad: ciudad || 'Sin ciudad', zona: zona || 'Interior',
      paso, cantidad: cant, monto: cant * 139000,
      fecha: new Date().toISOString().split('T')[0],
      canal: canal || 'WhatsApp', estado,
      nota: nota || (existing >= 0 ? leads[existing].nota : ''),
    }
    if (existing >= 0) leads[existing] = lead
    else leads.push(lead)
    return res.status(200).json({ ok: true, lead })
  }

  if (req.method === 'PATCH') {
    const { id, nota, estado } = req.body
    const idx = leads.findIndex(l => l.id === id)
    if (idx < 0) return res.status(404).json({ error: 'No encontrado' })
    if (nota !== undefined) leads[idx].nota = nota
    if (estado !== undefined) leads[idx].estado = estado
    return res.status(200).json({ ok: true, lead: leads[idx] })
  }

  if (req.method === 'GET') {
    const cerrados = leads.filter(l => l.estado === 'cerrado')
    const porCerrar = leads.filter(l => l.estado === 'por_cerrar')
    const enProceso = leads.filter(l => l.estado === 'en_proceso')
    const leadsNuevos = leads.filter(l => l.estado === 'lead')
    const totalMonto = cerrados.reduce((s, l) => s + l.monto, 0)
    const totalUnidades = cerrados.reduce((s, l) => s + l.cantidad, 0)
    const conversionRate = leads.length > 0 ? Math.round((cerrados.length / leads.length) * 100) : 0
    const porZona = [
      { zona: 'Central', value: leads.filter(l => l.zona === 'Central').length },
      { zona: 'Interior', value: leads.filter(l => l.zona === 'Interior').length },
    ]
    const porCanal = Object.entries(
      leads.reduce((acc: any, l) => { acc[l.canal] = (acc[l.canal] || 0) + 1; return acc }, {})
    ).map(([canal, value]) => ({ canal, value }))
    const ciudadMap = leads.reduce((acc: any, l) => {
      if (l.ciudad && l.ciudad !== 'Sin ciudad') acc[l.ciudad] = (acc[l.ciudad] || 0) + 1
      return acc
    }, {})
    const topCiudades = Object.entries(ciudadMap)
      .sort((a: any, b: any) => b[1] - a[1]).slice(0, 6)
      .map(([ciudad, count]) => ({ ciudad, count }))
    const ventasPorDia = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i))
      const dateStr = d.toISOString().split('T')[0]
      const dia = d.toLocaleDateString('es-PY', { weekday: 'short' })
      const v = cerrados.filter(l => l.fecha === dateStr)
      return { dia, ventas: v.length, monto: v.reduce((s, l) => s + l.monto, 0) }
    })
    return res.status(200).json({
      stats: { totalLeads: leads.length, cerrados: cerrados.length, porCerrar: porCerrar.length, enProceso: enProceso.length, leadsNuevos: leadsNuevos.length, totalMonto, totalUnidades, conversionRate, porZona, porCanal, topCiudades, ventasPorDia },
      leads: leads.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()),
    })
  }

  return res.status(405).json({ error: 'Método no permitido' })
}
