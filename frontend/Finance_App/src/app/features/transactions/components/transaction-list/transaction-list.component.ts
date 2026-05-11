import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { DatePipe, CurrencyPipe, NgClass } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
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
    NgClass,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatMenuModule,
  ],
  templateUrl: './transaction-list.component.html',
  styleUrl: './transaction-list.component.scss',
})
export class TransactionListComponent implements AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort)      sort!: MatSort;

  @Output() edit   = new EventEmitter<Transaction>();
  @Output() delete = new EventEmitter<Transaction>();

  readonly columns = ['date', 'description', 'category', 'type', 'amount', 'actions'];
  readonly dataSource = new MatTableDataSource<Transaction>([]);

  @Input() set transactions(data: Transaction[]) {
    this.dataSource.data = data;
  }

  @Input() total    = 0;
  @Input() loading  = false;
  @Input() pageSize = 10;

  @Output() pageChange = new EventEmitter<{ page: number; pageSize: number }>();

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort      = this.sort;
  }

  onPage(event: { pageIndex: number; pageSize: number }): void {
    this.pageChange.emit({ page: event.pageIndex + 1, pageSize: event.pageSize });
  }
}
