import { Component, Input, Output, EventEmitter } from '@angular/core';
import { DatePipe, CurrencyPipe, NgClass } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';

import { Transaction } from '../../../../core/models';

@Component({
  selector: 'app-transaction-list',
  standalone: true,
  imports: [
    DatePipe,
    CurrencyPipe,
    MatTableModule,
    MatPaginatorModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatMenuModule,
  ],
  templateUrl: './transaction-list.component.html',
  styleUrl: './transaction-list.component.scss',
})
export class TransactionListComponent {
  @Input() transactions: Transaction[] = [];
  @Input() total = 0;
  @Input() loading = false;
  @Input() pageSize = 10;
  @Input() page = 1;

  @Output() edit = new EventEmitter<Transaction>();
  @Output() delete = new EventEmitter<Transaction>();
  @Output() pageChange = new EventEmitter<{ page: number; pageSize: number }>();

  readonly columns = ['date', 'description', 'category', 'type', 'amount', 'actions'];

  onPage(event: PageEvent): void {
    this.pageChange.emit({ page: event.pageIndex + 1, pageSize: event.pageSize });
  }
}