import { Component, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { debounceTime, distinctUntilChanged } from 'rxjs';

import { TransactionService } from '../../core/services/transaction.service';
import { CategoryService } from '../../core/services/category.service';
import { ExcelExportService } from '../../core/services/excel-export.service';
import { Transaction, Category, TransactionFilter } from '../../core/models';
import {
  TransactionFormComponent,
  TransactionFormData,
} from './components/transaction-form/transaction-form.component';
import { TransactionListComponent } from './components/transaction-list/transaction-list.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    TransactionListComponent,
  ],
  templateUrl: './transactions.component.html',
  styleUrl: './transactions.component.scss',
})
export class TransactionsComponent implements OnInit {
  private readonly txSvc     = inject(TransactionService);
  private readonly catSvc    = inject(CategoryService);
  private readonly excel     = inject(ExcelExportService);
  private readonly dialog    = inject(MatDialog);
  private readonly snack     = inject(MatSnackBar);
  private readonly fb        = inject(FormBuilder);

  readonly transactions = signal<Transaction[]>([]);
  readonly categories   = signal<Category[]>([]);
  readonly total        = signal(0);
  readonly loading      = signal(false);

  filterForm!: FormGroup;
  currentFilter: TransactionFilter = { page: 1, pageSize: 10 };

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      search:    [''],
      type:      ['all'],
      categoryId:[''],
      startDate: [null],
      endDate:   [null],
    });

    this.loadCategories();
    this.loadTransactions();

    this.filterForm.valueChanges.pipe(debounceTime(400), distinctUntilChanged()).subscribe(() => {
      this.currentFilter.page = 1;
      this.loadTransactions();
    });
  }

  loadCategories(): void {
    this.catSvc.getAll().subscribe({
      next: (res) => this.categories.set(res.data),
    });
  }

  loadTransactions(): void {
    this.loading.set(true);
    const fv = this.filterForm.getRawValue();

    const filter: TransactionFilter = {
      ...this.currentFilter,
      type:       fv.type !== 'all' ? fv.type : undefined,
      categoryId: fv.categoryId || undefined,
      startDate:  fv.startDate ? (fv.startDate as Date).toISOString().split('T')[0] : undefined,
      endDate:    fv.endDate   ? (fv.endDate   as Date).toISOString().split('T')[0] : undefined,
    };

    this.txSvc.getAll(filter).subscribe({
      next: (res) => {
        this.transactions.set(res.data);
        this.total.set(res.total);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  openForm(transaction?: Transaction): void {
    const dialogRef = this.dialog.open<TransactionFormComponent, TransactionFormData>(
      TransactionFormComponent,
      {
        width:     '560px',
        maxWidth:  '95vw',
        data:      { transaction, categories: this.categories() },
        autoFocus: false,
      }
    );

    dialogRef.afterClosed().subscribe((result: Transaction | null) => {
      if (result) this.loadTransactions();
    });
  }

  confirmDelete(tx: Transaction): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title:   'Eliminar transacción',
        message: `¿Estás seguro de eliminar "${tx.description}"? Esta acción no se puede deshacer.`,
        confirmLabel: 'Eliminar',
        isDanger:     true,
      },
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;
      this.txSvc.remove(tx.id).subscribe({
        next: () => {
          this.snack.open('Transacción eliminada.', 'OK', {
            duration: 3000,
            panelClass: ['success-snackbar'],
          });
          this.loadTransactions();
        },
      });
    });
  }

  exportExcel(): void {
    this.excel.exportTransactions(this.transactions(), 'transacciones');
  }

  onPageChange(ev: { page: number; pageSize: number }): void {
    this.currentFilter.page     = ev.page;
    this.currentFilter.pageSize = ev.pageSize;
    this.loadTransactions();
  }

  clearFilters(): void {
    this.filterForm.reset({ type: 'all' });
  }
}
