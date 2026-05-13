import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import { Transaction } from '../models';

type ReportWorkbookInput = {
  summary: {
    totalIncome: number;
    totalExpenses: number;
    balance: number;
    transactionCount: number;
    avgTransactionAmount: number;
  };
  categories: Array<{
    categoryName: string;
    total: number;
    percentage: number;
    transactionCount: number;
  }>;
  monthly: Array<{
    period: string;
    income: number;
    expenses: number;
    balance: number;
  }>;
  transactions: Array<{
    date: string;
    type: 'income' | 'expense';
    categoryName?: string;
    description: string;
    currencyDisplay?: string;
    currency: string;
    amount: number;
  }>;
  filters: {
    startDate: string;
    endDate: string;
    type?: string;
  };
};

@Injectable({ providedIn: 'root' })
export class ExcelExportService {
  exportTransactions(transactions: Transaction[], fileName = 'transacciones'): void {
    const rows = transactions.map((t) => ({
      Fecha: t.date,
      Tipo: t.type === 'income' ? 'Ingreso' : 'Gasto',
      Categoria: t.categoryName ?? '',
      Descripcion: t.description,
      Moneda: t.currencyDisplay ?? t.currency,
      Monto: t.amount,
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [
      { wch: 12 },
      { wch: 10 },
      { wch: 24 },
      { wch: 34 },
      { wch: 14 },
      { wch: 14 },
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
    ws['!cols'] = [{ wch: 30 }, { wch: 22 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Resumen');
    XLSX.writeFile(wb, `${fileName}_${this.today()}.xlsx`);
  }

  exportReportWorkbook(input: ReportWorkbookInput, fileName = 'reporte_financiero'): void {
    const wb = XLSX.utils.book_new();

    const summaryRows = [
      { Concepto: 'Fecha desde', Valor: input.filters.startDate },
      { Concepto: 'Fecha hasta', Valor: input.filters.endDate },
      { Concepto: 'Tipo', Valor: input.filters.type ?? 'all' },
      { Concepto: 'Total ingresos', Valor: input.summary.totalIncome },
      { Concepto: 'Total gastos', Valor: input.summary.totalExpenses },
      { Concepto: 'Balance neto', Valor: input.summary.balance },
      { Concepto: 'N transacciones', Valor: input.summary.transactionCount },
      { Concepto: 'Promedio por movimiento', Valor: input.summary.avgTransactionAmount },
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
    wsSummary['!cols'] = [{ wch: 30 }, { wch: 22 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen');

    const categoryRows = input.categories.map((c) => ({
      Categoria: c.categoryName,
      Total: c.total,
      Porcentaje: c.percentage / 100,
      Movimientos: c.transactionCount,
    }));
    const wsCategories = XLSX.utils.json_to_sheet(categoryRows);
    wsCategories['!cols'] = [{ wch: 26 }, { wch: 16 }, { wch: 14 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, wsCategories, 'Categorias');

    const monthlyRows = input.monthly.map((m) => ({
      Periodo: m.period,
      Ingresos: m.income,
      Gastos: m.expenses,
      Balance: m.balance,
    }));

    monthlyRows.push({
      Periodo: 'TOTAL',
      Ingresos: input.monthly.reduce((a, b) => a + b.income, 0),
      Gastos: input.monthly.reduce((a, b) => a + b.expenses, 0),
      Balance: input.monthly.reduce((a, b) => a + b.balance, 0),
    });

    const wsMonthly = XLSX.utils.json_to_sheet(monthlyRows);
    wsMonthly['!cols'] = [{ wch: 14 }, { wch: 16 }, { wch: 16 }, { wch: 16 }];
    XLSX.utils.book_append_sheet(wb, wsMonthly, 'Mensual');

    const txRows = input.transactions.map((t) => ({
      Fecha: t.date,
      Tipo: t.type === 'income' ? 'Ingreso' : 'Gasto',
      Categoria: t.categoryName ?? 'Sin categoria',
      Descripcion: t.description ?? '',
      Moneda: t.currencyDisplay ?? t.currency,
      Monto: t.amount,
    }));

    txRows.push({
      Fecha: '',
      Tipo: '',
      Categoria: '',
      Descripcion: 'TOTAL',
      Moneda: '',
      Monto: input.transactions.reduce((a, b) => a + b.amount, 0),
    });

    const wsTransactions = XLSX.utils.json_to_sheet(txRows);
    wsTransactions['!cols'] = [
      { wch: 12 },
      { wch: 10 },
      { wch: 24 },
      { wch: 34 },
      { wch: 14 },
      { wch: 14 },
    ];
    XLSX.utils.book_append_sheet(wb, wsTransactions, 'Movimientos');

    XLSX.writeFile(wb, `${fileName}_${this.today()}.xlsx`);
  }

  saveBlob(blob: Blob, fileName = 'reporte'): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}_${this.today()}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  }

  private today(): string {
    return new Date().toISOString().split('T')[0];
  }
}