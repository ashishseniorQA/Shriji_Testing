const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

const dir = __dirname;
const screenshotsDir = path.join(dir, '..', '..', '..', 'screenshots', '2026-07-09');
const bugs = JSON.parse(fs.readFileSync(path.join(dir, 'bugs.json'), 'utf-8'));

const TEXT_COLUMNS = [
  { header: 'Bug ID', key: 'Bug ID', width: 10 },
  { header: 'Module/Page', key: 'Module/Page', width: 22 },
  { header: 'Feature', key: 'Feature', width: 24 },
  { header: 'Severity', key: 'Severity', width: 10 },
  { header: 'Priority', key: 'Priority', width: 9 },
  { header: 'Environment', key: 'Environment', width: 32 },
  { header: 'Preconditions', key: 'Preconditions', width: 32 },
  { header: 'Steps to Reproduce', key: 'Steps to Reproduce', width: 55 },
  { header: 'Expected Result', key: 'Expected Result', width: 40 },
  { header: 'Actual Result', key: 'Actual Result', width: 50 },
];
const EVIDENCE_COL_INDEX = TEXT_COLUMNS.length + 1; // 1-based, after all text columns
const TAIL_COLUMNS = [
  { header: 'Status', key: 'Status', width: 9 },
  { header: 'Reported By', key: 'Reported By', width: 13 },
  { header: 'Timestamp', key: 'Timestamp', width: 19 },
];

// Target display width for embedded screenshots (px) - large enough to read comfortably.
const IMAGE_DISPLAY_WIDTH = 640;
const PX_TO_PT = 0.75; // Excel row height is in points; 96dpi px -> 72dpi pt

function readPngSize(filePath) {
  const buf = fs.readFileSync(filePath);
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

async function main() {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Bug Report', { views: [{ state: 'frozen', ySplit: 1 }] });

  const columns = [...TEXT_COLUMNS, { header: 'Evidence', key: 'Evidence', width: 90 }, ...TAIL_COLUMNS];
  ws.columns = columns.map((c) => ({ header: c.header, key: c.key, width: c.width }));

  ws.getRow(1).font = { bold: true };
  ws.getRow(1).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

  for (const bug of bugs) {
    const rowValues = {};
    for (const c of TEXT_COLUMNS) rowValues[c.key] = bug[c.key] ?? '';
    for (const c of TAIL_COLUMNS) rowValues[c.key] = bug[c.key] ?? '';
    rowValues['Evidence'] = ''; // filled with embedded image below
    const row = ws.addRow(rowValues);
    row.alignment = { vertical: 'top', wrapText: true };

    const evidenceFile = bug['Evidence'];
    const imagePath = evidenceFile ? path.join(screenshotsDir, evidenceFile) : null;

    let rowHeightPt = 60;
    if (imagePath && fs.existsSync(imagePath)) {
      const { width, height } = readPngSize(imagePath);
      const displayWidth = IMAGE_DISPLAY_WIDTH;
      const displayHeight = Math.round((height / width) * displayWidth);

      const imageId = wb.addImage({ filename: imagePath, extension: 'png' });
      ws.addImage(imageId, {
        tl: { col: EVIDENCE_COL_INDEX - 1, row: row.number - 1 },
        ext: { width: displayWidth, height: displayHeight },
        editAs: 'oneCell',
      });
      rowHeightPt = Math.max(60, Math.round(displayHeight * PX_TO_PT) + 6);
    }
    row.height = rowHeightPt;
  }

  const outPath = path.join(dir, 'Shriji-E2E-Bug-Report.xlsx');
  await wb.xlsx.writeFile(outPath);
  console.log(`Wrote ${bugs.length} bugs (with embedded screenshots) to ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
