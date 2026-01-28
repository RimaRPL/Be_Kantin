import express from "express";
import SiswaRouter from "./Router/siswaRouter"
import AuthRouter from "./Router/authRouter"
import AdminRouter from "./Router/adminStanRouter"
import MenuRouter from "./Router/menuRouter"
import OrderRouter from "./Router/orderRouter"
import DiskonRouter from "./Router/diskonRouter"
import ReportRouter from"./Router/reportRouter"
import NotaRouter from "./Router/cetakNotaRouter"

const app = express();
app.use(express.json());

app.use(`/login`, AuthRouter)
app.use(`/siswa`, SiswaRouter)
app.use(`/admin`, AdminRouter)
app.use(`/menu`, MenuRouter )
app.use(`/diskon`, DiskonRouter)
app.use(`/order`, OrderRouter)
app.use(`/rekap`, ReportRouter)
app.use(`/nota`, NotaRouter)

const PORT = 2025;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

