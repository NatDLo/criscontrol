import { Component, Inject, OnInit, inject, signal } from '@angular/core';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';

import { TransactionService } from '../../../../core/services/transaction.service';
import { Transaction, Category } from '../../../../core/models';

export interface TransactionFormData {
  transaction?: Transaction;
  categories: Category[];
}

@Component({
  selector: 'app-transaction-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatRadioModule,
    MatDatepickerModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './transaction-form.component.html',
  styleUrl: './transaction-form.component.scss',
})
export class TransactionFormComponent implements OnInit {
  private readonly fb      = inject(FormBuilder);
  private readonly svc     = inject(TransactionService);
  private readonly snack   = inject(MatSnackBar);
  readonly dialogRef       = inject(MatDialogRef<TransactionFormComponent>);

  readonly saving  = signal(false);
  readonly isEdit  = signal(false);

  form!: FormGroup;

  constructor(@Inject(MAT_DIALOG_DATA) readonly data: TransactionFormData) {}

  ngOnInit(): void {
    const tx = this.data.transaction;
    this.isEdit.set(!!tx);

    this.form = this.fb.group({
      type:        [tx?.type ?? 'expense', Validators.required],
      amount:      [tx?.amount ?? null, [Validators.required, Validators.min(0.01)]],
      currency:    [tx?.currency ?? 'USD', Validators.required],
      categoryId:  [tx?.categoryId ?? '', Validators.required],
      description: [tx?.description ?? '', [Validators.required, Validators.maxLength(200)]],
      date:        [tx?.date ? new Date(tx.date) : new Date(), Validators.required],
      
    });
  }

  get filteredCategories(): Category[] {
    const type = this.form.get('type')?.value as string;
    return this.data.categories.filter(
      (c) => c.isActive && (c.type === 'both' || c.type === type)
    );
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const raw  = this.form.getRawValue();
    const date = (raw.date as Date).toISOString().split('T')[0];
    const dto  = { ...raw, date };

    const request$ = this.isEdit()
      ? this.svc.update(this.data.transaction!.id, dto)
      : this.svc.create(dto);

    request$.subscribe({
      next: (res) => {
        this.snack.open(
          this.isEdit() ? 'Transacción actualizada.' : 'Transacción registrada.',
          'OK',
          { duration: 3000, panelClass: ['success-snackbar'] }
        );
        this.dialogRef.close(res.data);
      },
      error: () => this.saving.set(false),
    });
  }

  cancel(): void {
    this.dialogRef.close(null);
  }
}
