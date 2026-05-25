# 🦷 Domra Dashboard

Dashboard de métricas y CRM para Domrapy.

## Deploy en Vercel (paso a paso)

### 1. Subir a GitHub
```bash
git init
git add .
git commit -m "Domra Dashboard v1"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/domra-dashboard.git
git push -u origin main
```

### 2. Deploy en Vercel
1. Entrá a vercel.com
2. "Add New Project"
3. Importá el repo `domra-dashboard`
4. Framework: **Next.js** (auto detectado)
5. Deploy → listo

### 3. Conectar n8n al Dashboard
En tu flujo n8n, después de cada confirmación de pedido, agregá un nodo **HTTP Request**:
- Method: POST
- URL: `https://TU-DOMINIO.vercel.app/api/leads`
- Body (JSON):
```json
{
  "from": "{{ $json.from }}",
  "nombre": "{{ $json.estado.datos.nombre }}",
  "telefono": "{{ $json.estado.datos.telefono }}",
  "ciudad": "{{ $json.estado.datos.ciudad_exacta }}",
  "zona": "{{ $json.estado.datos.esCentral ? 'Central' : 'Interior' }}",
  "paso": "{{ $json.estado.paso }}",
  "cantidad": "{{ $json.estado.datos.cantidad }}",
  "canal": "WhatsApp"
}
```

## Desarrollo local
```bash
npm install
npm run dev
# Abre http://localhost:3000
```
