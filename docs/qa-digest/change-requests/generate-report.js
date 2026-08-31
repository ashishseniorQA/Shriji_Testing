const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

const dir = __dirname;
const requests = JSON.parse(fs.readFileSync(path.join(dir, 'change-requests.json'), 'utf-8'));

const COLUMNS = [
  { header: 'CR ID', key: 'CR ID', width: 10 },
  { header: 'Client Ref #', key: 'Client Ref #', width: 11 },
  { header: 'Module/Page', key: 'Module/Page', width: 32 },
  { header: 'Change Title', key: 'Change Title', width: 34 },
  { header: 'Description', key: 'Description', width: 45 },
  { header: 'Current Behavior', key: 'Current Behavior', width: 55 },
  { header: 'Requested Behavior', key: 'Requested Behavior', width: 40 },
  { header: 'Priority', key: 'Priority', width: 10 },
  { header: 'Clarification Needed', key: 'Clarification Needed', width: 55 },
  { header: 'Status', key: 'Status', width: 18 },
  { header: 'Requested By', key: 'Requested By', width: 13 },
  { header: 'Date Logged', key: 'Date Logged', width: 13 },
];

async function main() {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Change Requests', { views: [{ state: 'frozen', ySplit: 1 }] });

  ws.columns = COLUMNS;
  ws.getRow(1).font = { bold: true };
  ws.getRow(1).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

  for (const cr of requests) {
    const row = ws.addRow(cr);
    row.alignment = { vertical: 'top', wrapText: true };
    row.height = 90;
  }

  const outPath = path.join(dir, 'Shriji-Change-Requests.xlsx');
  await wb.xlsx.writeFile(outPath);
  console.log(`Wrote ${requests.length} change requests to ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
