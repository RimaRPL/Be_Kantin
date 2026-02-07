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
  //mengubah format
  const formatRp = (n: number) =>
    "Rp" + n.toLocaleString("id-ID")

  const rows = data.items.map(item => `
    <tr class="item-row">
      <td colspan="3" class="menu-name">${item.namaMenu}</td>
    </tr>
    <tr class="detail-row">
      <td class="price-col">
        ${item.persentase_diskon > 0 
          ? `<span class="old-price">${formatRp(item.harga_awal)}</span> <span class="disc-tag">OFF${item.persentase_diskon}%</span><br>` 
          : ''
        }
        <span class="actual-price">${formatRp(item.harga_beli)}</span>
      </td>
      <td class="qty-col">x${item.qty}</td>
      <td class="subtotal-col">${formatRp(item.subtotal)}</td>
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
    padding: 2mm;
    font-family: 'Courier New', Courier, monospace;
    font-size: 12px;
    line-height: 1.4;
    color: #000;
  }

  .center { text-align: center; }
  .bold { font-weight: bold; }

  .title {
    font-size: 18px;
    font-weight: bold;
    text-transform: uppercase;
    margin-bottom: 2px;
  }

  hr {
    border: none;
    border-top: 1px dashed #000;
    margin: 8px 0;
  }

  /* Layout Header Kiri-Kanan */
  .info-row {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    margin-bottom: 3px;
  }

  /* Tabel Item */
  table { width: 100%; border-collapse: collapse; }

  .menu-name {
    font-weight: bold;
    padding-top: 10px;
    font-size: 13px;
  }

  .price-col { width: 45%; vertical-align: bottom; }
  .qty-col { width: 15%; text-align: center; vertical-align: bottom; }
  .subtotal-col { width: 40%; text-align: right; vertical-align: bottom; font-weight: bold; }

  /* Style Diskon */
  .old-price {
    font-size: 10px;
    text-decoration: line-through;
    color: #686868;
  }
  .disc-tag {
    font-size: 10px;
  }
  .actual-price {
    font-size: 12px;
  }

  /* Bagian Total */
  .total-section {
    margin-top: 12px;
    display: flex;
    justify-content: space-between;
    font-size: 16px;
    border-top: 1px solid #000;
    padding-top: 5px;
  }

  .footer {
    margin-top: 25px;
    text-align: center;
    font-size: 11px;
    padding-bottom: 10mm;
  }
</style>
</head>
<body>

  <div class="center">
    <div class="title">${data.namaStan}</div>
    <div style="font-size: 12px;">Pelanggan: ${data.namaSiswa}</div>
  </div>

  <hr/>

  <div class="info-row">
    <span>Order ID</span>
    <span class="bold">#${data.orderId}</span>
  </div>
  <div class="info-row">
    <span>Tanggal</span>
    <span>${data.tanggal}</span>
  </div>
  <div class="info-row">
    <span>Jam</span>
    <span>${data.jam}</span>
  </div>

  <hr/>

  <table>
    <thead>
      <tr style="border-bottom: 1px solid #000; font-size: 10px;">
        <th align="left">MENU</th>
        <th align="center">QTY</th>
        <th align="right">SUBTOTAL</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>

  <div class="total-section bold">
    <span>TOTAL</span>
    <span>${formatRp(total)}</span>
  </div>

  <div class="footer">
    *** TERIMA KASIH ***<br>
    Silahkan Tunggu Pesanan Anda
  </div>

</body>
</html>
`
}