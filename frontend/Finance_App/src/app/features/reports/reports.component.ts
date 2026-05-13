import { Component, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CurrencyPipe, DatePipe, PercentPipe, NgClass } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { ReportService } from '../../core/services/report.service';
import { CategoryService } from '../../core/services/category.service';
import { ExcelExportService } from '../../core/services/excel-export.service';
import { TransactionService } from '../../core/services/transaction.service';
import { Category, ReportFilter, ReportSummary, CategoryStat, MonthlyData } from '../../core/models';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CurrencyPipe,
    PercentPipe,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatTableModule,
  ],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss',
})
export class ReportsComponent implements OnInit {
  private readonly reportSvc = inject(ReportService);
  private readonly catSvc    = inject(CategoryService);
  private readonly txSvc     = inject(TransactionService);
  private readonly excel     = inject(ExcelExportService);
  private readonly snack     = inject(MatSnackBar);
  private readonly fb        = inject(FormBuilder);

  readonly categories    = signal<Category[]>([]);
  readonly summary       = signal<ReportSummary | null>(null);
  readonly catStats      = signal<CategoryStat[]>([]);
  readonly monthlyData   = signal<MonthlyData[]>([]);
  readonly loading       = signal(false);
  readonly exporting     = signal(false);
  readonly hasResults    = signal(false);

  filterForm!: FormGroup;

  readonly monthlyColumns = ['period', 'income', 'expenses', 'balance'];
  readonly catColumns     = ['category', 'total', 'percentage', 'count'];

  ngOnInit(): void {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);

    this.filterForm = this.fb.group({
      startDate: [start, Validators.required],
      endDate: [now, Validators.required],
      type: ['all'],
      categoryIds: [[]],
      groupBy: ['month'],
    });

    this.filterForm.get('type')?.valueChanges.subscribe((type) => {
      const selected: string[] = this.filterForm.get('categoryIds')?.value ?? [];

      const allowed = new Set(
        this.categories()
          .filter((c) =>
            type === 'income'
              ? c.type === 'income'
              : type === 'expense'
                ? c.type === 'expense'
                : true
          )
          .map((c) => String(c.id))
      );

      const next = selected.filter((id) => allowed.has(String(id)));
      if (next.length !== selected.length) {
        this.filterForm.patchValue({ categoryIds: next }, { emitEvent: false });
      }
    });

    this.catSvc.getAll().subscribe({ next: (res) => this.categories.set(res.data) });
  }

  buildFilter(): ReportFilter {
    const fv = this.filterForm.getRawValue();
    return {
      startDate:   (fv.startDate as Date).toISOString().split('T')[0],
      endDate:     (fv.endDate   as Date).toISOString().split('T')[0],
      type:        fv.type !== 'all' ? fv.type : undefined,
      categoryIds: fv.categoryIds?.length ? fv.categoryIds : undefined,
      groupBy:     fv.groupBy,
    };
  }

  generate(): void {
    if (this.filterForm.invalid) { this.filterForm.markAllAsTouched(); return; }

    this.loading.set(true);
    this.hasResults.set(false);
    const filter = this.buildFilter();

    // Parallel requests
    let pending = 3;
    const done = () => { if (--pending === 0) { this.loading.set(false); this.hasResults.set(true); } };

    this.reportSvc.getSummary(filter).subscribe({
      next: (res) => { this.summary.set(res.data); done(); },
      error: () => done(),
    });

    this.reportSvc.getMonthlyData(filter).subscribe({
      next: (res) => { this.monthlyData.set(res.data); done(); },
      error: () => done(),
    });

    this.reportSvc.getCategoryStats(filter).subscribe({
      next: (res) => { this.catStats.set(res.data); done(); },
      error: () => done(),
    });
  }

  filteredCategories(): Category[] {
    const type = this.filterForm?.get('type')?.value;
    if (type === 'income') return this.categories().filter((c) => c.type === 'income');
    if (type === 'expense') return this.categories().filter((c) => c.type === 'expense');
    return this.categories();
  }

  /** Try backend export first; fall back to client-side if unavailable. */
  exportExcel(): void {
  if (this.filterForm.invalid) return;

  this.exporting.set(true);
  const filter = this.buildFilter();

  this.reportSvc.downloadExcel(filter).subscribe({
    next: (blob) => {
      this.excel.saveBlob(blob, 'reporte');
      this.exporting.set(false);
    },
    error: () => {
      // Fallback completo: genera workbook local con 4 hojas
      this.txSvc
        .getAll({
          startDate: filter.startDate,
          endDate: filter.endDate,
          type: filter.type,
          page: 1,
          pageSize: 100000,
          sortBy: 'date',
          sortDir: 'asc',
        })
        .pipe(finalize(() => this.exporting.set(false)))
        .subscribe({
          next: (res) => {
            let rows = res.data;

            if (filter.categoryIds?.length) {
              const ids = new Set(filter.categoryIds.map(String));
              rows = rows.filter((x) => ids.has(String(x.categoryId)));
            }

            const liveSummary = this.summary() ?? this.buildSummaryFromRows(rows);
            const categories = this.catStats().length ? this.catStats() : liveSummary.topCategories;
            const monthly = this.monthlyData().length ? this.monthlyData() : liveSummary.monthlyData;

            this.excel.exportReportWorkbook(
              {
                summary: {
                  totalIncome: liveSummary.totalIncome,
                  totalExpenses: liveSummary.totalExpenses,
                  balance: liveSummary.balance,
                  transactionCount: liveSummary.transactionCount,
                  avgTransactionAmount: liveSummary.avgTransactionAmount,
                },
                categories: categories.map((c) => ({
                  categoryName: c.categoryName,
                  total: c.total,
                  percentage: c.percentage,
                  transactionCount: c.transactionCount,
                })),
                monthly: monthly.map((m) => ({
                  period: m.period,
                  income: m.income,
                  expenses: m.expenses,
                  balance: m.balance,
                })),
                transactions: rows.map((t) => ({
                  date: t.date,
                  type: t.type,
                  categoryName: t.categoryName,
                  description: t.description,
                  currencyDisplay: t.currencyDisplay ?? undefined,
                  currency: t.currency,
                  amount: t.amount,
                })),
                filters: {
                  startDate: filter.startDate,
                  endDate: filter.endDate,
                  type: filter.type ?? 'all',
                },
              },
              'reporte_financiero'
            );

            this.snack.open('Reporte Excel completo generado.', 'OK', { duration: 3000 });
          },
          error: () => {
            this.snack.open('No se pudo generar el Excel.', 'Cerrar', { duration: 3500 });
          },
        });
    },
  });
}

private buildSummaryFromRows(rows: Array<{
  type: 'income' | 'expense';
  amount: number;
  date: string;
  categoryId: string;
  categoryName?: string;
}>): ReportSummary {
  const totalIncome = rows
    .filter((x) => x.type === 'income')
    .reduce((a, b) => a + b.amount, 0);

  const totalExpenses = rows
    .filter((x) => x.type === 'expense')
    .reduce((a, b) => a + b.amount, 0);

  const transactionCount = rows.length;
  const balance = totalIncome - totalExpenses;
  const avgTransactionAmount = transactionCount
    ? (totalIncome + totalExpenses) / transactionCount
    : 0;

  const byCategory = new Map<
    string,
    { categoryId: string; categoryName: string; total: number; percentage: number; transactionCount: number }
  >();

  rows.forEach((tx) => {
    const key = String(tx.categoryId);
    const prev = byCategory.get(key) ?? {
      categoryId: key,
      categoryName: tx.categoryName ?? 'Sin categoria',
      total: 0,
      percentage: 0,
      transactionCount: 0,
    };
    prev.total += tx.amount;
    prev.transactionCount += 1;
    byCategory.set(key, prev);
  });

  const topCategories = Array.from(byCategory.values())
    .map((x) => ({
      ...x,
      percentage: (x.total / Math.max(1, totalIncome + totalExpenses)) * 100,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  const monthlyMap = new Map<string, { period: string; income: number; expenses: number; balance: number }>();

  rows.forEach((tx) => {
    const period = tx.date.slice(0, 7);
    const prev = monthlyMap.get(period) ?? { period, income: 0, expenses: 0, balance: 0 };
    if (tx.type === 'income') prev.income += tx.amount;
    else prev.expenses += tx.amount;
    prev.balance = prev.income - prev.expenses;
    monthlyMap.set(period, prev);
  });

  const monthlyData = Array.from(monthlyMap.values()).sort((a, b) =>
    a.period.localeCompare(b.period)
  );

  return {
    totalIncome,
    totalExpenses,
    balance,
    transactionCount,
    avgTransactionAmount,
    topCategories,
    monthlyData,
  };
}

  balanceColor(val: number): string {
    return val >= 0 ? 'text-income' : 'text-expense';
  }
}
