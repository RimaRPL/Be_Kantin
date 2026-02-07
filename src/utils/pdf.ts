import puppeteer from "puppeteer";

export async function generatePdf(html: string) {
    const browser = await puppeteer.launch({
        headless: true
    })

    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: "networkidle0" })

    const pdfBuffer = await page.pdf({
        width: "58mm",   //lebar kertas nya
        printBackground: true,
        scale: 1.2
    })

    await browser.close()
    return pdfBuffer
}