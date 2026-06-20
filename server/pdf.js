const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const QUOTES_DIR = path.join(__dirname, 'uploads', 'quotes');
const INVOICES_DIR = path.join(__dirname, 'uploads', 'invoices');
fs.mkdirSync(QUOTES_DIR, { recursive: true });
fs.mkdirSync(INVOICES_DIR, { recursive: true });

// --- Brand palette (matches the website's "forest" theme) ---------------
const FOREST = '#14532d';
const FOREST_DARK = '#0c3a20';
const LIME = '#84cc16';
const INK = '#111827';
const SLATE = '#374151';
const MUTE = '#6b7280';
const LINE = '#e5e7eb';
const SOFT = '#f3f6f2';

const COMPANY = {
  name: 'KV Tree',
  tagline: 'Tree Felling & Stump Removal',
  phone: '+27 83 302 2877',
  email: 'info@kvtree.co.za',
  address: 'Aston Manor, Kempton Park',
  web: 'kvtree.co.za',
};

const currency = (n) =>
  `R ${Number(n || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDate = (d) =>
  new Date(d || Date.now()).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' });

const PAGE = { left: 50, right: 545, width: 495 }; // A4 with 50pt margins

// Coloured brand header band with the company identity + contact details.
function drawHeader(doc) {
  doc.rect(0, 0, doc.page.width, 130).fill(FOREST);
  doc.rect(0, 130, doc.page.width, 4).fill(LIME);

  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(28).text(COMPANY.name, PAGE.left, 38);
  doc.font('Helvetica').fontSize(11).fillColor('#d1fae5').text(COMPANY.tagline, PAGE.left, 72);

  // Right-aligned contact stack.
  const contact = [COMPANY.phone, COMPANY.email, COMPANY.address, COMPANY.web];
  doc.font('Helvetica').fontSize(9.5).fillColor('#ecfdf5');
  contact.forEach((line, i) => {
    doc.text(line, PAGE.right - 220, 40 + i * 15, { width: 220, align: 'right' });
  });
}

// Big document title + a metadata table (number, dates, status) on the right.
function drawTitleBlock(doc, { title, number, issued, secondLabel, secondValue, status }) {
  const top = 160;
  doc.fillColor(INK).font('Helvetica-Bold').fontSize(22).text(title, PAGE.left, top);
  doc.font('Helvetica').fontSize(10).fillColor(MUTE).text(`#${number}`, PAGE.left, top + 30);

  const rows = [
    ['Issued', fmtDate(issued)],
    [secondLabel, secondValue],
    ['Status', status],
  ];
  const boxX = 360;
  const boxW = PAGE.right - boxX;
  let y = top;
  rows.forEach(([label, value]) => {
    doc.font('Helvetica').fontSize(9.5).fillColor(MUTE).text(label.toUpperCase(), boxX, y, { width: 110 });
    doc.font('Helvetica-Bold').fontSize(10).fillColor(INK).text(value || '—', boxX + 70, y - 1, {
      width: boxW - 70,
      align: 'right',
    });
    y += 18;
  });
  return Math.max(top + 48, y) + 18;
}

// "Bill to" / "Prepared for" recipient card.
function drawParty(doc, y, label, lead) {
  doc.fillColor(MUTE).font('Helvetica-Bold').fontSize(9).text(label.toUpperCase(), PAGE.left, y);
  let yy = y + 15;
  doc.font('Helvetica-Bold').fontSize(12).fillColor(INK).text(lead?.name || '—', PAGE.left, yy);
  yy += 17;
  doc.font('Helvetica').fontSize(10).fillColor(SLATE);
  [lead?.address, lead?.email, lead?.phone].filter(Boolean).forEach((line) => {
    doc.text(line, PAGE.left, yy, { width: 300 });
    yy += 14;
  });
  return yy + 10;
}

// Single line-item table: Description | Amount, with a header strip.
function drawLineItems(doc, y, { service, details, amount }) {
  const headerH = 24;
  const amountX = 410;
  const amountW = PAGE.right - amountX;

  // Header strip.
  doc.rect(PAGE.left, y, PAGE.width, headerH).fill(FOREST);
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9.5);
  doc.text('DESCRIPTION', PAGE.left + 12, y + 8);
  doc.text('AMOUNT', amountX, y + 8, { width: amountW - 12, align: 'right' });

  // Row body — height grows with the wrapped description.
  let rowY = y + headerH + 12;
  doc.fillColor(INK).font('Helvetica-Bold').fontSize(11).text(service || 'Tree service', PAGE.left + 12, rowY, {
    width: amountX - PAGE.left - 24,
  });
  const detailText = details || 'As discussed during site visit.';
  doc.font('Helvetica').fontSize(9.5).fillColor(MUTE).text(detailText, PAGE.left + 12, doc.y + 2, {
    width: amountX - PAGE.left - 24,
  });
  const rowEnd = doc.y;

  // Amount, vertically aligned to the row top.
  doc.font('Helvetica-Bold').fontSize(11).fillColor(INK).text(currency(amount), amountX, rowY, {
    width: amountW - 12,
    align: 'right',
  });

  const bottom = Math.max(rowEnd, rowY + 14) + 12;
  doc.moveTo(PAGE.left, bottom).lineTo(PAGE.right, bottom).strokeColor(LINE).lineWidth(1).stroke();
  return bottom + 14;
}

// Prominent totals box (white text on forest — correctly positioned & visible).
function drawTotal(doc, y, { label, amount }) {
  const boxW = 250;
  const boxX = PAGE.right - boxW;
  const boxH = 46;
  doc.rect(boxX, y, boxW, boxH).fill(FOREST_DARK);
  doc.rect(boxX, y, 4, boxH).fill(LIME);
  doc.fillColor('#a7f3d0').font('Helvetica-Bold').fontSize(9.5).text(label.toUpperCase(), boxX + 16, y + 9);
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(18).text(currency(amount), boxX + 16, y + 21, {
    width: boxW - 32,
    align: 'right',
  });
  return y + boxH + 20;
}

// Notes paragraph + a thin footer line pinned near the page bottom.
function drawFooter(doc, notes) {
  const y = doc.page.height - 110;
  doc.rect(PAGE.left, y, PAGE.width, 0.5).fill(LINE);
  doc.fillColor(MUTE).font('Helvetica').fontSize(9).text(notes, PAGE.left, y + 12, { width: PAGE.width });
  doc.fillColor(SLATE).font('Helvetica-Bold').fontSize(9).text(
    `${COMPANY.name}  ·  ${COMPANY.phone}  ·  ${COMPANY.email}`,
    PAGE.left,
    doc.page.height - 40,
    { width: PAGE.width, align: 'center' }
  );
}

function buildDoc(filepath, render) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);
    render(doc);
    doc.end();
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

/**
 * Generate a quotation PDF. Resolves to { localPath, key }.
 */
async function generateQuotePdf({ quote, lead }) {
  const filename = `quote-${quote.id}.pdf`;
  const filepath = path.join(QUOTES_DIR, filename);
  const validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await buildDoc(filepath, (doc) => {
    drawHeader(doc);
    let y = drawTitleBlock(doc, {
      title: 'Quotation',
      number: quote.id,
      issued: quote.created_at,
      secondLabel: 'Valid until',
      secondValue: fmtDate(validUntil),
      status: quote.status || 'Sent',
    });
    y = drawParty(doc, y, 'Prepared for', lead);
    y = drawLineItems(doc, y, { service: lead?.service, details: quote.details, amount: quote.price });
    drawTotal(doc, y, { label: 'Total', amount: quote.price });
    drawFooter(
      doc,
      'This quotation is valid for 30 days from the issue date. Prices include labour and standard ' +
        'site cleanup. Tree removal is subject to a site assessment. Thank you for choosing KV Tree.'
    );
  });

  return { localPath: filepath, key: `quotes/${filename}` };
}

/**
 * Generate an invoice PDF. Resolves to { localPath, key }.
 */
async function generateInvoicePdf({ invoice, lead }) {
  const filename = `invoice-${invoice.id}.pdf`;
  const filepath = path.join(INVOICES_DIR, filename);
  const dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  await buildDoc(filepath, (doc) => {
    drawHeader(doc);
    let y = drawTitleBlock(doc, {
      title: 'Invoice',
      number: invoice.id,
      issued: invoice.created_at,
      secondLabel: 'Due date',
      secondValue: fmtDate(dueDate),
      status: invoice.status || 'Unpaid',
    });
    y = drawParty(doc, y, 'Bill to', lead);
    y = drawLineItems(doc, y, { service: lead?.service, details: invoice.details, amount: invoice.amount });
    drawTotal(doc, y, { label: 'Amount due', amount: invoice.amount });
    drawFooter(
      doc,
      'Payment is due within 14 days. Pay securely online via the link in your account portal, or ' +
        'request EFT banking details by reply. Thank you for choosing KV Tree.'
    );
  });

  return { localPath: filepath, key: `invoices/${filename}` };
}

module.exports = { generateQuotePdf, generateInvoicePdf, QUOTES_DIR, INVOICES_DIR };
