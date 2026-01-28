export const notaHtml = (data: {
  namaStan: string
  namaSiswa: string
  orderId: number
  tanggal: string
  jam: string
  items: {
    namaMenu: string
    harga: number
    qty: number
    subtotal: number
  }[]
}) => {
  const formatRp = (n: number) =>
    "Rp" + n.toLocaleString("id-ID")

  const rows = data.items
    .map(item => `
      <tr>
        <td class="col-menu">${item.namaMenu}</td>
        <td class="col-number">${formatRp(item.harga)}</td>
        <td class="col-qty">${item.qty}</td>
        <td class="col-number">${formatRp(item.subtotal)}</td>
      </tr>
    `)
    .join("")

  const total = data.items.reduce(
    (sum, item) => sum + item.subtotal,
    0
  )

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<style>
  body {
    width: 58mm;
    margin: 0 auto;
    padding: 6px;
    font-family: monospace;
    font-size: 11px;
    line-height: 1.4;
    color: #000;
  }

  .center {
    text-align: center;
  }

  .stan-name {
    font-size: 15px;
    font-weight: bold;
    letter-spacing: 1px;
    margin-bottom: 2px;
  }

  .sub {
    font-size: 10px;
    margin-bottom: 6px;
  }

  .info {
    font-size: 10px;
    margin-bottom: 4px;
  }

  .info-row {
    display: flex;
    justify-content: space-between;
  }

  .separator {
    margin: 6px 0;
    border-top: 1px dashed #000;
    text-align: center;
    font-size: 10px;
    font-weight: bold;
    padding-top: 3px;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 10px;
  }

  th {
    text-align: left;
    border-bottom: 1px solid #000;
    padding-bottom: 3px;
  }

  td {
    padding: 3px 0;
  }

  .col-menu {
    width: 40%;
  }

  .col-number {
    width: 30%;
    text-align: right;
  }

  .col-qty {
    width: 10%;
    text-align: center;
  }

  .total-section {
    margin-top: 6px;
    padding-top: 4px;
    border-top: 1px solid #000;
  }

  .total-row {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    font-weight: bold;
  }

  .footer {
    margin-top: 8px;
    text-align: center;
    font-size: 9px;
  }
</style>

</head>

<body>
  <div class="center">
    <div class="stan-name">${data.namaStan}</div>
    <div class="sub">Pelanggan: ${data.namaSiswa}</div>
  </div>

  <div class="info-row">
    <div>ID pesanan</div>
    <div>#${data.orderId}</div>
  </div>

  <div class="info-row">
    <div>Tanggal</div>
    <div>${data.tanggal}</div>
  </div>

  <div class="info-row">
    <div>Waktu</div>
    <div>${data.jam}</div>
  </div>

  <div class="separator">DETAIL PESANAN</div>

  <table>
    <thead>
      <tr>
        <th class="col-menu">Menu</th>
        <th class="col-number">Harga</th>
        <th class="col-qty">Qty</th>
        <th class="col-number">Subtotal</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>

  <div class="total-section">
    <div class="total-row">
      <div>TOTAL</div>
      <div>${formatRp(total)}</div>
    </div>
  </div>

  <div class="footer">
    <div><strong>TERIMA KASIH</strong></div>
    <div>Pesanan telah selesai</div>
    <div>${new Date().getFullYear()} © ${data.namaStan}</div>
  </div>
</body>
</html>
`
}
