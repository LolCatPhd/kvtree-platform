const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const QUOTES_DIR = path.join(__dirname, 'uploads', 'quotes');
fs.mkdirSync(QUOTES_DIR, { recursive: true });

const currency = (n) =>
  `R ${Number(n || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * Generate a quotation PDF and write it to uploads/quotes/.
 * Returns the relative public path, e.g. "/uploads/quotes/quote-12.pdf".
 */
function generateQuotePdf({ quote, lead }) {
  return new Promise((resolve, reject) => {
    const filename = `quote-${quote.id}.pdf`;
    const filepath = path.join(QUOTES_DIR, filename);
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    // Header
    doc.fillColor('#14532d').fontSize(24).text('KV Tree', { continued: false });
    doc.fillColor('#374151').fontSize(10).text('Tree Felling & Stump Removal — Kempton Park');
    doc.moveDown(0.5);
    doc.fillColor('#111827').fontSize(18).text(`Quotation #${quote.id}`);
    doc.fillColor('#6b7280').fontSize(10).text(new Date().toLocaleDateString('en-ZA'));
    doc.moveDown();

    // Client details
    doc.fillColor('#111827').fontSize(12).text('Prepared for:');
    doc.fillColor('#374151').fontSize(11);
    doc.text(lead?.name || '—');
    if (lead?.email) doc.text(lead.email);
    if (lead?.phone) doc.text(lead.phone);
    if (lead?.address) doc.text(lead.address);
    doc.moveDown();

    // Service + details
    doc.fillColor('#111827').fontSize(12).text('Service:');
    doc.fillColor('#374151').fontSize(11).text(lead?.service || '—');
    doc.moveDown(0.5);
    doc.fillColor('#111827').fontSize(12).text('Details:');
    doc.fillColor('#374151').fontSize(11).text(quote.details || 'As discussed during site visit.');
    doc.moveDown();

    // Price box
    doc.moveDown();
    doc.rect(50, doc.y, 495, 40).fill('#14532d');
    doc.fillColor('#ffffff').fontSize(14).text(`Total: ${currency(quote.price)}`, 60, doc.y - 28);
    doc.moveDown(2);

    // Footer
    doc.fillColor('#6b7280').fontSize(9).text(
      'This quotation is valid for 30 days. Prices include labour and standard site cleanup. ' +
        'Thank you for choosing KV Tree.',
      50,
      doc.page.height - 90,
      { width: 495 }
    );

    doc.end();
    stream.on('finish', () => resolve(`/uploads/quotes/${filename}`));
    stream.on('error', reject);
  });
}

const INVOICES_DIR = path.join(__dirname, 'uploads', 'invoices');
fs.mkdirSync(INVOICES_DIR, { recursive: true });

/**
 * Generate an invoice PDF. Returns the relative public path.
 */
function generateInvoicePdf({ invoice, lead }) {
  return new Promise((resolve, reject) => {
    const filename = `invoice-${invoice.id}.pdf`;
    const filepath = path.join(INVOICES_DIR, filename);
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    doc.fillColor('#14532d').fontSize(24).text('KV Tree');
    doc.fillColor('#374151').fontSize(10).text('Tree Felling & Stump Removal — Kempton Park');
    doc.moveDown(0.5);
    doc.fillColor('#111827').fontSize(18).text(`Invoice #${invoice.id}`);
    doc.fillColor('#6b7280').fontSize(10).text(new Date().toLocaleDateString('en-ZA'));
    doc.moveDown();

    doc.fillColor('#111827').fontSize(12).text('Bill to:');
    doc.fillColor('#374151').fontSize(11);
    doc.text(lead?.name || '—');
    if (lead?.email) doc.text(lead.email);
    if (lead?.phone) doc.text(lead.phone);
    if (lead?.address) doc.text(lead.address);
    doc.moveDown();

    doc.fillColor('#111827').fontSize(12).text('Service:');
    doc.fillColor('#374151').fontSize(11).text(lead?.service || '—');
    doc.moveDown();

    doc.rect(50, doc.y, 495, 40).fill('#14532d');
    doc.fillColor('#ffffff').fontSize(14).text(`Amount due: ${currency(invoice.amount)}`, 60, doc.y - 28);
    doc.moveDown(2);

    doc.fillColor('#6b7280').fontSize(9).text(
      'Payment is due within 14 days. Banking details available on request, ' +
        'or pay securely online via the link in your account portal. Thank you for choosing KV Tree.',
      50,
      doc.page.height - 90,
      { width: 495 }
    );

    doc.end();
    stream.on('finish', () => resolve(`/uploads/invoices/${filename}`));
    stream.on('error', reject);
  });
}

module.exports = { generateQuotePdf, generateInvoicePdf, QUOTES_DIR, INVOICES_DIR };
