import type { NextApiRequest, NextApiResponse } from 'next'

const REDIS_URL   = process.env.UPSTASH_REDIS_REST_URL!
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN!
const LEADS_KEY   = 'domra:leads'

async function redisCmd(args: any[]): Promise<any> {
  const r = await fetch(REDIS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${REDIS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(args),
  })
  const json = await r.json()
  return json
}

async function getLeads(): Promise<any[]> {
  const json = await redisCmd(['GET', LEADS_KEY])
  if (!json.result) return []
  try { return JSON.parse(json.result) } catch { return [] }
}

async function saveLeads(leads: any[]): Promise<any> {
  return await redisCmd(['SET', LEADS_KEY, JSON.stringify(leads)])
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  if (req.query.debug === '1') {
    return res.status(200).json({
      url: process.env.UPSTASH_REDIS_REST_URL || 'NO_URL',
      token: process.env.UPSTASH_REDIS_REST_TOKEN ? 'TOKEN_OK' : 'NO_TOKEN'
    })
  }

  if (req.query.debug === '2') {
    const setResult = await redisCmd(['SET', 'debug:test', 'funciona'])
    const getResult = await redisCmd(['GET', 'debug:test'])
    return res.status(200).json({ setResult, getResult })
  }

  if (req.method === 'POST') {
    const { from, nombre, telefono, ciudad, zona, paso, cantidad, canal, nota } = req.body
    if (!from) return res.status(400).json({ error: 'from requerido' })
    const estado =
      paso === 'pedido_confirmado' ? 'cerrado' :
      (paso === 'espera_comprobante' || paso === 'espera_comprobante_flash') ? 'por_cerrar' :
      (paso === 'espera_datos_central' || paso === 'espera_datos_interior') ? 'en_proceso' :
      paso === 'recontacto_enviado' ? 'por_cerrar' : 'lead'
    const cant = Number(cantidad) || 0
    const leads = await getLeads()
    const existing = leads.findIndex((l: any) => l.from === from)
    const lead = {
      id:       existing >= 0 ? leads[existing].id : String(Date.now()),
      from, nombre: nombre || 'Sin nombre', telefono: telefono || '',
      ciudad: ciudad || 'Sin ciudad', zona: zona || 'Interior',
      paso, cantidad: cant, monto: cant * 139000,
      fecha: new Date().toISOString().split('T')[0],
      canal: canal || 'WhatsApp', estado,
      nota: nota || (existing >= 0 ? leads[existing].nota : ''),
    }
    if (existing >= 0) leads[existing] = lead
    else leads.push(lead)
    const saveResult = await saveLeads(leads)
    return res.status(200).json({ ok: true, lead, saveResult })
  }

  if (req.method === 'PATCH') {
    const { id, nota, estado } = req.body
    const leads = await getLeads()
    const idx = leads.findIndex((l: any) => l.id === id)
    if (idx < 0) return res.status(404).json({ error: 'No encontrado' })
    if (nota   !== undefined) leads[idx].nota   = nota
    if (estado !== undefined) leads[idx].estado = estado
    await saveLeads(leads)
    return res.status(200).json({ ok: true, lead: leads[idx] })
  }

  if (req.method === 'GET') {
    const leads = await getLeads()
    const cerrados    = leads.filter((l: any) => l.estado === 'cerrado')
    const porCerrar   = leads.filter((l: any) => l.estado === 'por_cerrar')
    const enProceso   = leads.filter((l: any) => l.estado === 'en_proceso')
    const leadsNuevos = leads.filter((l: any) => l.estado === 'lead')
    const totalMonto    = cerrados.reduce((s: number, l: any) => s + l.monto, 0)
    const totalUnidades = cerrados.reduce((s: number, l: any) => s + l.cantidad, 0)
    const conversionRate = leads.length > 0 ? Math.round((cerrados.length / leads.length) * 100) : 0
    const porZona = [
      { zona: 'Central',  value: leads.filter((l: any) => l.zona === 'Central').length },
      { zona: 'Interior', value: leads.filter((l: any) => l.zona === 'Interior').length },
    ]
    const porCanal = Object.entries(
      leads.reduce((acc: any, l: any) => { acc[l.canal] = (acc[l.canal] || 0) + 1; return acc }, {})
    ).map(([canal, value]) => ({ canal, value }))
    const ciudadMap = leads.reduce((acc: any, l: any) => {
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
      const v = cerrados.filter((l: any) => l.fecha === dateStr)
      return { dia, ventas: v.length, monto: v.reduce((s: number, l: any) => s + l.monto, 0) }
    })
    return res.status(200).json({
      stats: { totalLeads: leads.length, cerrados: cerrados.length, porCerrar: porCerrar.length, enProceso: enProceso.length, leadsNuevos: leadsNuevos.length, totalMonto, totalUnidades, conversionRate, porZona, porCanal, topCiudades, ventasPorDia },
      leads: [...leads].sort((a: any, b: any) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()),
    })
  }

  return res.status(405).json({ error: 'Método no permitido' })
}
