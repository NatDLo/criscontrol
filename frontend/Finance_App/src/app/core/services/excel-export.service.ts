import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import { Transaction } from '../models';

/**
 * Client-side Excel export service using SheetJS (xlsx).
 * Used as a fallback when the backend export is unavailable,
 * or for instant export without a round-trip.
 */
@Injectable({ providedIn: 'root' })
export class ExcelExportService {

  exportTransactions(transactions: Transaction[], fileName = 'transacciones'): void {
    const rows = transactions.map((t) => ({
      'Fecha':        t.date,
      'Tipo':         t.type === 'income' ? 'Ingreso' : 'Gasto',
      'Categoría':    t.categoryName ?? '',
      'Descripción':  t.description,
      'Monto':        t.amount,
      'Notas':        t.notes ?? '',
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [
      { wch: 12 }, // Fecha
      { wch: 10 }, // Tipo
      { wch: 22 }, // Categoría
      { wch: 35 }, // Descripción
      { wch: 14 }, // Monto
      { wch: 35 }, // Notas
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Transacciones');
    XLSX.writeFile(wb, `${fileName}_${this.today()}.xlsx`);
  }

  exportSummary(
    summaryRows: { label: string; value: number | string }[],
    fileName = 'resumen'
  ): void {
    const ws = XLSX.utils.json_to_sheet(
      summaryRows.map((r) => ({ Concepto: r.label, Valor: r.value }))
    );
    ws['!cols'] = [{ wch: 28 }, { wch: 18 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Resumen');
    XLSX.writeFile(wb, `${fileName}_${this.today()}.xlsx`);
  }

  /** Saves a Blob received from the backend as an .xlsx file. */
  saveBlob(blob: Blob, fileName = 'reporte'): void {
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href     = url;
    a.download = `${fileName}_${this.today()}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  }

  private today(): string {
    return new Date().toISOString().split('T')[0];
  }
}
