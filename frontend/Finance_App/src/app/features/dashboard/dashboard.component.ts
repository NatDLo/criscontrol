import { Component, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe, NgClass } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';

import { TransactionService } from '../../core/services/transaction.service';
import { Transaction, TransactionSummary } from '../../core/models';
import { SummaryCardComponent } from './components/summary-card/summary-card.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    NgClass,
    CurrencyPipe,
    DatePipe,
    RouterLink,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    SummaryCardComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private readonly transactionService = inject(TransactionService);

  readonly loading        = signal(true);
  readonly summary        = signal<TransactionSummary | null>(null);
  readonly recentTx       = signal<Transaction[]>([]);
  readonly selectedPeriod = signal<'month' | 'quarter' | 'year'>('month');

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    const { start, end } = this.getPeriodDates(this.selectedPeriod());

    this.transactionService.getSummary(start, end).subscribe({
      next: (res) => this.summary.set(res.data),
      error: () => this.loading.set(false),
    });

    this.transactionService
      .getAll({ page: 1, pageSize: 8, sortBy: 'date', sortDir: 'desc' })
      .subscribe({
        next: (res) => {
          this.recentTx.set(res.data);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  selectPeriod(period: 'month' | 'quarter' | 'year'): void {
    this.selectedPeriod.set(period);
    this.loadData();
  }

  private getPeriodDates(period: 'month' | 'quarter' | 'year'): { start: string; end: string } {
    const now   = new Date();
    const end   = now.toISOString().split('T')[0];
    let   start = '';

    if (period === 'month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    } else if (period === 'quarter') {
      const q = Math.floor(now.getMonth() / 3);
      start   = new Date(now.getFullYear(), q * 3, 1).toISOString().split('T')[0];
    } else {
      start = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
    }

    return { start, end };
  }
}
