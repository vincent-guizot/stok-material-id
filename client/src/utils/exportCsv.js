/**
 * Utility untuk mengekspor data tabel ke format CSV (dapat dibuka langsung di Microsoft Excel)
 * Menggunakan UTF-8 BOM agar karakter khusus dan mata uang tampil rapi di Excel.
 */
export function exportToCsv(filename, headers, rows) {
  const cleanFilename = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
  
  const csvRows = [
    headers.map((h) => `"${String(h).replace(/"/g, '""')}"`).join(','),
    ...rows.map((row) =>
      row.map((cell) => {
        if (cell === null || cell === undefined) return '""';
        return `"${String(cell).replace(/"/g, '""')}"`;
      }).join(',')
    ),
  ];

  const blob = new Blob(['\uFEFF' + csvRows.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', cleanFilename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
