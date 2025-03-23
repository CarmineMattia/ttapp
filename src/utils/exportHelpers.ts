/* eslint-disable @typescript-eslint/no-explicit-any */
import * as XLSX from 'xlsx-js-style';

interface Shift {
  id: number;
  start_time: string;
  end_time: string;
  duration: string;
  user_id: string;
  project?: string;
}

interface Expense {
  date: string;
  destination: string;
  km: number;
  kmCost: number;
  toll: number;
  parking: number;
  publicTransport: number;
  food: number;
  accommodation: number;
  other: number;
  notes?: string;
}

interface FerrariniExportOptions {
  month?: number;
  year: number;
  userName: string;
  shifts: Shift[];
  expenses?: Expense[];
  format?: 'xlsx' | 'csv';
}

// Define styles globally
const borderStyleThin = {
  top: { style: "thin", color: { rgb: "000000" } },
  bottom: { style: "thin", color: { rgb: "000000" } },
  left: { style: "thin", color: { rgb: "000000" } },
  right: { style: "thin", color: { rgb: "000000" } }
};

const borderStyleMedium = {
  top: { style: "medium", color: { rgb: "000000" } },
  bottom: { style: "medium", color: { rgb: "000000" } },
  left: { style: "medium", color: { rgb: "000000" } },
  right: { style: "medium", color: { rgb: "000000" } }
};

const headerStyle = {
  font: { bold: true, color: { rgb: "000000" }, name: "Calibri", sz: 11 },
  alignment: { horizontal: "center", vertical: "center", wrapText: true }
};

const checkboxStyle = {
  font: { bold: true, color: { rgb: "000000" }, name: "Calibri", sz: 11 },
  border: borderStyleThin,
  alignment: { horizontal: "center", vertical: "center" }
};

const totalStyle = {
  font: { bold: true, color: { rgb: "000000" }, name: "Calibri", sz: 11 },
  fill: { patternType: "solid", fgColor: { rgb: "FFFF00" } },
  border: borderStyleThin,
  alignment: { horizontal: "center", vertical: "center" }
};

const dataStyle = {
  font: { name: "Calibri", sz: 11 },
  border: borderStyleThin,
  alignment: { horizontal: "center", vertical: "center" }
};

const holidayStyle = {
  font: { name: "Calibri", sz: 11 },
  fill: { patternType: "solid", fgColor: { rgb: "C6EFCE" } },
  border: borderStyleThin,
  alignment: { horizontal: "center", vertical: "center" }
};

const expenseHeaderStyle = {
  font: { bold: true, color: { rgb: "000000" }, name: "Calibri", sz: 11 },
  fill: { patternType: "solid", fgColor: { rgb: "E9E9E9" } },
  border: borderStyleThin,
  alignment: { horizontal: "center", vertical: "center" }
};

// Function to determine Italian holidays and weekends for a given month and year
function getHolidaysAndWeekends(month: number, year: number): number[] {
  const holidays: number[] = [];
  
  // Fixed Italian holidays
  const fixedHolidays = [
    { month: 0, day: 1 },  // New Year's Day (Capodanno)
    { month: 0, day: 6 },  // Epiphany (Epifania)
    { month: 3, day: 25 }, // Liberation Day (Anniversario della Liberazione)
    { month: 4, day: 1 },  // Labor Day (Festa del Lavoro)
    { month: 5, day: 2 },  // Republic Day (Festa della Repubblica)
    { month: 7, day: 15 }, // Assumption of Mary (Ferragosto)
    { month: 10, day: 1 }, // All Saints' Day (Ognissanti)
    { month: 11, day: 8 }, // Immaculate Conception (Immacolata Concezione)
    { month: 11, day: 25 }, // Christmas Day (Natale)
    { month: 11, day: 26 } // St. Stephen's Day (Santo Stefano)
  ];

  // Add fixed holidays for the given month
  fixedHolidays.forEach(h => {
    if (h.month === month - 1) {
      holidays.push(h.day);
    }
  });

  // Calculate Easter Sunday and Easter Monday
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const easterMonth = Math.floor((h + l - 7 * m + 114) / 31) - 1;
  const easterDay = ((h + l - 7 * m + 114) % 31) + 1;
  const easterSunday = new Date(year, easterMonth, easterDay);
  
  if (easterMonth === month - 1) {
    holidays.push(easterSunday.getDate()); // Easter Sunday
    holidays.push(easterSunday.getDate() + 1); // Easter Monday (Pasquetta)
  }

  // Add Saturdays and Sundays
  const daysInMonth = new Date(year, month, 0).getDate();
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday (0) or Saturday (6)
      holidays.push(day);
    }
  }

  return [...new Set(holidays)].sort((a, b) => a - b); // Remove duplicates and sort
}

export function exportFerrariniFormat({
  month,
  year,
  userName,
  shifts,
  expenses = [],
  format = 'xlsx'
}: FerrariniExportOptions) {
  if (year < 1970 || year > 9999) {
    throw new Error('Invalid year');
  }

  const wb = XLSX.utils.book_new();
  const monthsToExport = month
    ? [month]
    : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  if (!month && format === 'xlsx') {
    const datiSheet = generateDatiSheet(year, userName);
    XLSX.utils.book_append_sheet(wb, datiSheet, 'dati');
  }

  monthsToExport.forEach((m) => {
    try {
      if (m < 1 || m > 12) {
        console.error(`Invalid month: ${m}`);
        return;
      }

      const monthDate = new Date(Date.UTC(year, m - 1, 1, 12));
      if (isNaN(monthDate.getTime())) {
        console.error(`Invalid date for month ${m}, year ${year}`);
        return;
      }

      const monthName = monthDate.toLocaleString('it', { month: 'long' });
      const daysInMonth = new Date(year, m, 0).getDate();
      const wsData = generateMonthSheet(m, year, userName, shifts, expenses);
      const ws = XLSX.utils.aoa_to_sheet(wsData);

      // Apply borders and styles
      applyBorders(ws, m, year, expenses);

      // Set column widths
      ws['!cols'] = [
        { wch: 20 }, // COMMESSA
        { wch: 40 }, // SOTTO COMMESSA/CLIENTE
        ...Array(daysInMonth).fill({ wch: 6 }), // Days
        { wch: 15 }, // NOTE VARIE
        { wch: 10 } // TOTALI
      ];

      // Merge cells for userName and Compilazione completata
      ws['!merges'] = [
        { s: { r: 0, c: 5 }, e: { r: 0, c: 18 } }, // F1:S1 for userName
        { s: { r: 0, c: 19 }, e: { r: 0, c: 33 } } // T1:AH1 for Compilazione completata
      ];

      XLSX.utils.book_append_sheet(wb, ws, monthName);
    } catch (error) {
      console.error(`Error generating sheet for month ${m}:`, error);
    }
  });

  if (format === 'xlsx') {
    const filename = month
      ? `Foglio Presenze ${userName}_${year}(${monthsToExport[0]})`
      : `Foglio Presenze ${userName}_${year}_Full`;
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  } else if (format === 'csv') {
    const ws = wb.Sheets[wb.SheetNames[0]];
    const csv = XLSX.utils.sheet_to_csv(ws);
    downloadCSV(csv, `Foglio Presenze ${userName}_${year}(${monthsToExport[0]})`);
  }
}

function generateMonthSheet(month: number, year: number, userName: string, shifts: Shift[], expenses: Expense[]) {
  const wsData: (string | { v?: string | number; f?: string; s: any } | number)[][] = [];

  try {
    if (month < 1 || month > 12 || !Number.isInteger(month)) {
      console.error(`Invalid month: ${month}`);
      month = 1;
    }

    if (!Number.isInteger(year)) {
      console.error(`Invalid year: ${year}`);
      year = new Date().getFullYear();
    }

    const monthDate = new Date(Date.UTC(year, month - 1, 1, 12));
    if (isNaN(monthDate.getTime())) {
      throw new Error(`Invalid date for year: ${year}, month: ${month}`);
    }

    const monthName = monthDate.toLocaleString('it', { month: 'long' });
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getDate();
    const holidays = getHolidaysAndWeekends(month, year);

    // Header row
    const headerRow = [
      { v: `Ellysse Srl  - ore mese`, s: headerStyle },
      { v: monthName, s: headerStyle },
      { v: year, s: headerStyle },
      { v: '', s: headerStyle },
      { v: '', s: headerStyle },
      { v: userName, s: headerStyle }, // F1 (will be merged to S1)
      ...Array(13).fill({ v: '', s: headerStyle }), // G1:S1 (merged)
      { v: 'Compilazione completata', s: headerStyle }, // T1 (will be merged to AH1)
      ...Array(14).fill({ v: '', s: headerStyle }), // U1:AH1 (merged)
      { v: '☐', s: checkboxStyle } // AI1 (checkbox)
    ];
    wsData.push(headerRow);

    wsData.push(Array(35).fill({ v: '', s: dataStyle }));
    wsData.push(Array(35).fill({ v: '', s: dataStyle }));

    const weekDays = ['lun', 'mar', 'mer', 'gio', 'ven', 'sab', 'dom'];
    const daysHeader = [{ v: 'COMMESSA', s: headerStyle }, { v: 'SOTTO COMMESSA/CLIENTE', s: headerStyle }];
    const weekDayHeader = [{ v: '', s: headerStyle }, { v: '', s: headerStyle }];

    for (let i = 1; i <= daysInMonth; i++) {
      const style = holidays.includes(i) ? holidayStyle : headerStyle;
      daysHeader.push({ 
        v: i.toString().padStart(2, '0'), 
        s: {
          font: { bold: true, color: { rgb: "000000" }, name: "Calibri", sz: 11 },
          alignment: { horizontal: "center", vertical: "center", wrapText: true },
          ...(style.hasOwnProperty('fill') && { fill: (style as any).fill }),
          ...(style.hasOwnProperty('border') && { border: (style as any).border })
        }
      });
      const date = new Date(year, month - 1, i);
      weekDayHeader.push({ 
        v: weekDays[date.getDay() === 0 ? 6 : date.getDay() - 1], 
        s: {
          font: { bold: true, color: { rgb: "000000" }, name: "Calibri", sz: 11 },
          alignment: { horizontal: "center", vertical: "center", wrapText: true },
          ...(style.hasOwnProperty('fill') && { fill: (style as any).fill }),
          ...(style.hasOwnProperty('border') && { border: (style as any).border })
        }
      });
    }
    daysHeader.push({ v: 'NOTE VARIE', s: headerStyle }, { v: 'TOTALI', s: headerStyle });
    weekDayHeader.push({ v: '', s: headerStyle }, { v: '', s: headerStyle });

    wsData.push(weekDayHeader);
    wsData.push(daysHeader);

    const validShifts = shifts.filter(s => {
      try {
        const shiftDate = new Date(Date.parse(s.start_time));
        const endDate = new Date(Date.parse(s.end_time));
        if (isNaN(shiftDate.getTime()) || isNaN(endDate.getTime())) {
          console.error(`Invalid shift dates: start=${s.start_time}, end=${s.end_time}`);
          return false;
        }
        return shiftDate.getUTCFullYear() === year && shiftDate.getUTCMonth() === month - 1;
      } catch (e) {
        console.error(`Error processing shift date: ${s.start_time}`, e);
        return false;
      }
    });

    const groupedShifts = groupShiftsByProject(validShifts);

    if (Object.keys(groupedShifts).length === 0) {
      const row = [
        { v: 'sviluppo', s: dataStyle },
        { v: 'No Data', s: dataStyle },
        ...Array(daysInMonth).map((_, idx) => ({
          v: '',
          s: holidays.includes(idx + 1) ? holidayStyle : dataStyle
        })),
        { v: '', s: dataStyle },
        { v: '', s: dataStyle }
      ];
      wsData.push(row);
    } else {
      Object.entries(groupedShifts).forEach(([project, projectShifts]) => {
        const row = Array(daysInMonth + 4).fill({ v: '', s: dataStyle });
        row[0] = { v: 'sviluppo', s: dataStyle };
        row[1] = { v: project, s: dataStyle };

        projectShifts.forEach((shift: Shift) => {
          try {
            const day = new Date(Date.parse(shift.start_time)).getUTCDate();
            const hours = calculateShiftHours(shift);
            if (!isNaN(hours) && !isNaN(day)) {
              row[day + 1] = { v: hours.toFixed(1), s: holidays.includes(day) ? holidayStyle : dataStyle };
            }
          } catch (error) {
            console.error(`Error processing shift: ${shift.id}`, error);
          }
        });

        row[row.length - 1] = { v: '', f: `SUM(C${wsData.length + 1}:${XLSX.utils.encode_col(daysInMonth + 1)}${wsData.length + 1})`, s: dataStyle };
        for (let i = 2; i < row.length - 2; i++) {
          if (holidays.includes(i - 1)) {
            row[i].s = holidayStyle;
          }
        }
        wsData.push(row);
      });
    }

    const totalOreLavorateRow = [
      { v: 'TOTALE  ORE LAVORATE', s: totalStyle },
      { v: '', s: totalStyle },
      ...Array(daysInMonth).map((_, idx) => ({
        v: '0.0',
        s: holidays.includes(idx + 1) ? { ...totalStyle, fill: { patternType: "solid", fgColor: { rgb: "C6EFCE" } } } : totalStyle
      })),
      { v: '', s: totalStyle },
      { v: '0.0', s: totalStyle }
    ];
    wsData.push(totalOreLavorateRow);

    ['FERIE', 'PERMESSI', 'MALATTIA'].forEach(type => {
      const row = Array(daysInMonth + 4).fill({ v: '', s: dataStyle });
      row[0] = { v: type, s: dataStyle };
      row[row.length - 1] = { v: '', f: `SUM(C${wsData.length + 1}:${XLSX.utils.encode_col(daysInMonth + 1)}${wsData.length + 1})`, s: dataStyle };
      for (let i = 2; i < row.length - 2; i++) {
        if (holidays.includes(i - 1)) {
          row[i].s = holidayStyle;
        }
      }
      wsData.push(row);
    });

    const totalOreRow = [
      { v: 'TOTALE  ORE', s: totalStyle },
      { v: '', s: totalStyle },
      ...Array(daysInMonth).map((_, idx) => ({
        v: '',
        s: holidays.includes(idx + 1) ? { ...totalStyle, fill: { patternType: "solid", fgColor: { rgb: "C6EFCE" } } } : totalStyle
      })),
      { v: '', s: totalStyle },
      { v: '', s: totalStyle }
    ];
    wsData.push(totalOreRow);

    if (expenses.length > 0) {
      addExpensesSection(wsData, expenses.filter(e => {
        try {
          const date = new Date(e.date);
          return !isNaN(date.getTime()) && date.getMonth() + 1 === month && date.getFullYear() === year;
        } catch (e) {
          console.error(`Invalid expense date: ${e}`);
          return false;
        }
      }), month, year, userName);
    }

    return wsData;
  } catch (error) {
    console.error(`Error generating sheet for ${month}/${year}:`, error);
    return [
      [`Ellysse Srl  - ore mese`, `Error: ${error}`, year, '', '', userName],
      Array(35).fill(''),
      ['Error generating sheet. Please check the data and try again.']
    ];
  }
}

function applyBorders(ws: XLSX.WorkSheet, month: number, year: number, expenses: Expense[]) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const holidays = getHolidaysAndWeekends(month, year);

  // Calculate the last row of the main data section (before expenses)
  let lastRow = 5;
  while (ws[XLSX.utils.encode_cell({ r: lastRow, c: 0 })]) {
    if (ws[XLSX.utils.encode_cell({ r: lastRow, c: 0 })].v === 'Ellysse Srl   -   Rimborsi spese') break;
    lastRow++;
  }
  lastRow--;

  // Apply borders to specific rows: weekday (row 4), days (row 5), data rows, and total rows
  const dataRange = XLSX.utils.decode_range(`A4:${XLSX.utils.encode_col(daysInMonth + 3)}${lastRow}`);
  for (let R = dataRange.s.r; R <= dataRange.e.r; ++R) {
    for (let C = dataRange.s.c; C <= dataRange.e.c; ++C) {
      const cell = XLSX.utils.encode_cell({ r: R, c: C });
      if (!ws[cell]) ws[cell] = { v: '' };

      // Determine the style based on row and column
      let cellStyle = dataStyle;
      if (ws[XLSX.utils.encode_cell({ r: R, c: 0 })].v === 'TOTALE  ORE LAVORATE' || 
          ws[XLSX.utils.encode_cell({ r: R, c: 0 })].v === 'TOTALE  ORE') {
        cellStyle = totalStyle;
      } else if (R === 3 || R === 4) {
        cellStyle = { ...headerStyle, border: borderStyleThin };
      }

      // Apply holiday style to specific columns
      if (C >= 2 && C < daysInMonth + 2 && holidays.includes(C - 1)) {
        const holidayStyle = {
          font: cellStyle.font,
          border: cellStyle.border,
          alignment: cellStyle.alignment,
          fill: { patternType: "solid", fgColor: { rgb: "C6EFCE" } }
        };
        cellStyle = holidayStyle;
      }

      // Apply borders only to specific rows
      if (R === 3 || R === 4 || // Weekday and days rows
          (R >= 5 && R <= lastRow && 
           (ws[XLSX.utils.encode_cell({ r: R, c: 0 })].v === 'sviluppo' || 
            ws[XLSX.utils.encode_cell({ r: R, c: 0 })].v === 'TOTALE  ORE LAVORATE' || 
            ws[XLSX.utils.encode_cell({ r: R, c: 0 })].v === 'TOTALE  ORE'))) {
        ws[cell].s = cellStyle;

        // Apply medium borders to the outer edges of the table
        if (R === dataRange.s.r) {
          ws[cell].s.border.top = borderStyleMedium.top;
        }
        if (R === lastRow) {
          ws[cell].s.border.bottom = borderStyleMedium.bottom;
        }
        if (C === dataRange.s.c) {
          ws[cell].s.border.left = borderStyleMedium.left;
        }
        if (C === dataRange.e.c) {
          ws[cell].s.border.right = borderStyleMedium.right;
        }
      } else {
        // Remove borders for non-relevant rows (FERIE, PERMESSI, MALATTIA)
        ws[cell].s = { ...cellStyle, border: {} };
      }
    }
  }

  // Apply borders to expense section if it exists
  if (expenses.length > 0) {
    const expenseStartRow = lastRow + 2;
    const expenseEndRow = expenseStartRow + 2 + expenses.length;
    const expenseRange = XLSX.utils.decode_range(`A${expenseStartRow}:M${expenseEndRow}`);
    for (let R = expenseRange.s.r; R <= expenseRange.e.r; ++R) {
      for (let C = expenseRange.s.c; C <= expenseRange.e.c; ++C) {
        const cell = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[cell]) ws[cell] = { v: '' };
        if (R === expenseStartRow || R === expenseStartRow + 1) {
          ws[cell].s = expenseHeaderStyle;
        } else {
          ws[cell].s = dataStyle;
        }
      }
    }
  }
}

function groupShiftsByProject(shifts: Shift[]): Record<string, Shift[]> {
  return shifts.reduce((acc: Record<string, Shift[]>, shift) => {
    const project = shift.project || 'Default';
    if (!acc[project]) acc[project] = [];
    acc[project].push(shift);
    return acc;
  }, {});
}

function calculateShiftHours(shift: Shift): number {
  const start = new Date(shift.start_time);
  const end = new Date(shift.end_time);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    console.error(`Invalid date in shift ${shift.id}: start=${shift.start_time}, end=${shift.end_time}`);
    return 0;
  }

  return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
}

function addExpensesSection(wsData: any[][], expenses: Expense[], month: number, year: number, userName: string): void {
  wsData.push([]);
  wsData.push([
    { v: `Ellysse Srl   -   Rimborsi spese`, s: expenseHeaderStyle },
    { v: '', s: expenseHeaderStyle },
    { v: '', s: expenseHeaderStyle },
    { v: month, s: expenseHeaderStyle },
    { v: year, s: expenseHeaderStyle },
    { v: '', s: expenseHeaderStyle },
    { v: '', s: expenseHeaderStyle },
    { v: userName, s: expenseHeaderStyle },
    ...Array(5).fill({ v: '', s: expenseHeaderStyle })
  ]);
  wsData.push([
    { v: 'Data', s: expenseHeaderStyle },
    { v: 'A', s: expenseHeaderStyle },
    { v: 'Destinazione', s: expenseHeaderStyle },
    { v: 'Km.', s: expenseHeaderStyle },
    { v: 'Spesa Km', s: expenseHeaderStyle },
    { v: 'Autostrada', s: expenseHeaderStyle },
    { v: 'Parcheggio', s: expenseHeaderStyle },
    { v: 'Mezzi Pubblici', s: expenseHeaderStyle },
    { v: 'Vitto', s: expenseHeaderStyle },
    { v: 'Alloggio', s: expenseHeaderStyle },
    { v: 'Varie', s: expenseHeaderStyle },
    { v: 'Totale', s: expenseHeaderStyle },
    { v: 'NOTE', s: expenseHeaderStyle }
  ]);

  const validExpenses = expenses.filter(expense => {
    const date = new Date(expense.date);
    const isValid = !isNaN(date.getTime()) && date.getMonth() + 1 === month && date.getFullYear() === year;
    if (!isValid) {
      console.error(`Invalid expense date: ${expense.date}`);
    }
    return isValid;
  });

  validExpenses.forEach(expense => {
    wsData.push([
      { v: expense.date, s: dataStyle },
      { v: '', s: dataStyle },
      { v: expense.destination, s: dataStyle },
      { v: expense.km, s: dataStyle },
      { v: expense.kmCost, s: dataStyle },
      { v: expense.toll, s: dataStyle },
      { v: expense.parking, s: dataStyle },
      { v: expense.publicTransport, s: dataStyle },
      { v: expense.food, s: dataStyle },
      { v: expense.accommodation, s: dataStyle },
      { v: expense.other, s: dataStyle },
      { v: '', f: `SUM(D${wsData.length + 1}:K${wsData.length + 1})`, s: dataStyle },
      { v: expense.notes || '', s: dataStyle }
    ]);
  });
}

function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function generateDatiSheet(year: number, userName: string) {
  return XLSX.utils.aoa_to_sheet([
    [{ v: 'DATI GENERALI', s: headerStyle }],
    [{ v: 'Anno', s: dataStyle }, { v: year, s: dataStyle }],
    [{ v: 'Nome Collaboratore', s: dataStyle }, { v: userName, s: dataStyle }],
    [{ v: 'Data Creazione', s: dataStyle }, { v: new Date().toISOString().split('T')[0], s: dataStyle }],
    [{ v: 'Firma Collaboratore', s: dataStyle }, { v: '', s: dataStyle }],
    [{ v: 'Firma Responsabile', s: dataStyle }, { v: '', s: dataStyle }],
    [{ v: 'Data Approvazione', s: dataStyle }, { v: '', s: dataStyle }]
  ]);
}