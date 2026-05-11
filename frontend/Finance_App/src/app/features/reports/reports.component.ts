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
    DatePipe,
    PercentPipe,
    NgClass,
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
    const now   = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);

    this.filterForm = this.fb.group({
      startDate:   [start,       Validators.required],
      endDate:     [now,         Validators.required],
      type:        ['all'],
      categoryIds: [[]],
      groupBy:     ['month'],
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
        // Fallback: build summary client-side
        const s = this.summary();
        if (s) {
          this.excel.exportSummary([
            { label: 'Total Ingresos',    value: s.totalIncome },
            { label: 'Total Gastos',      value: s.totalExpenses },
            { label: 'Balance',           value: s.balance },
            { label: 'Nº Transacciones',  value: s.transactionCount },
            { label: 'Promedio por Mov.', value: s.avgTransactionAmount },
          ]);
        }
        this.exporting.set(false);
        this.snack.open('Reporte generado localmente.', 'OK', { duration: 3000 });
      },
    });
  }

  balanceColor(val: number): string {
    return val >= 0 ? 'text-income' : 'text-expense';
  }
}
