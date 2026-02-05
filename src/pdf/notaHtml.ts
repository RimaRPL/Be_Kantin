export const notaHtml = (data: {
  namaStan: string
  namaSiswa: string
  orderId: number
  tanggal: string
  jam: string
  items: {
    namaMenu: string
    harga_awal: number
    persentase_diskon: number
    harga_beli: number
    qty: number
    subtotal: number
  }[]
}) => {
  const formatRp = (n: number) =>
    "Rp" + n.toLocaleString("id-ID")

  const rows = data.items.map(item => `
    <tr>
      <td class="menu">
        <div class="menu-name">${item.namaMenu}</div>
        ${
          item.persentase_diskon > 0
            ? `<div class="price-note">
                <span class="old">${formatRp(item.harga_awal)}</span>
                → <strong>${formatRp(item.harga_beli)}</strong>
                (Diskon ${item.persentase_diskon}%)
              </div>`
            : `<div class="price-note">
                ${formatRp(item.harga_beli)}
              </div>`
        }
      </td>
      <td class="qty">${item.qty}x</td>
      <td class="price">${formatRp(item.subtotal)}</td>
    </tr>
  `).join("")

  const total = data.items.reduce((sum, i) => sum + i.subtotal, 0)

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<style>
  body {
    width: 58mm;
    margin: 0;
    padding: 6px;
    font-family: monospace;
    font-size: 11px;
    color: #000;
  }

  .center { text-align: center; }

  .title {
    font-size: 13px;
    font-weight: bold;
    letter-spacing: 0.5px;
  }

  .subtitle {
    font-size: 10px;
    margin-top: 2px;
  }

  hr {
    border: none;
    border-top: 1px dashed #000;
    margin: 6px 0;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th {
    font-size: 10px;
    text-align: left;
    border-bottom: 1px solid #000;
    padding-bottom: 3px;
  }

  td {
    padding: 4px 0;
    vertical-align: top;
  }

  .menu { width: 60%; }
  .qty {
    width: 10%;
    text-align: center;
  }
  .price {
    width: 30%;
    text-align: right;
  }

  .menu-name {
    font-weight: bold;
  }

  .price-note {
    font-size: 9px;
    color: #444;
  }

  .old {
    text-decoration: line-through;
    opacity: 0.7;
  }

  .summary {
    font-size: 12px;
    font-weight: bold;
    text-align: right;
  }

  .footer {
    margin-top: 8px;
    font-size: 9px;
    text-align: center;
    letter-spacing: 0.3px;
  }
</style>
</head>

<body>

  <div class="center">
    <div class="title">${data.namaStan}</div>
    <div class="subtitle">Pelanggan: ${data.namaSiswa}</div>
  </div>

  <hr/>

  ID: #${data.orderId}<br/>
  tanggal: ${data.tanggal} - jam: ${data.jam}

  <hr/>

  <table>
    <thead>
      <tr>
        <th>Menu</th>
        <th class="qty">Qty</th>
        <th class="price">Total</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>

  <hr/>

  <div class="summary">
    TOTAL ${formatRp(total)}
  </div>

  <div class="footer">
    Terima kasih
  </div>

</body>
</html>
`
}
