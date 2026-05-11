import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CurrencyPipe, NgClass } from '@angular/common';

export type CardVariant = 'balance' | 'income' | 'expense' | 'count';

@Component({
  selector: 'app-summary-card',
  standalone: true,
  imports: [MatIconModule, CurrencyPipe, NgClass],
  templateUrl: './summary-card.component.html',
  styleUrl: './summary-card.component.scss',
})
export class SummaryCardComponent {
  @Input() label   = '';
  @Input() value   = 0;
  @Input() icon    = 'payments';
  @Input() variant: CardVariant = 'balance';
  @Input() isCurrency = true;
  @Input() trend?: number; // positive = up, negative = down
}
