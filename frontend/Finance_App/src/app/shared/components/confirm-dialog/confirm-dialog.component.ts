import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  title:         string;
  message:       string;
  confirmLabel?: string;
  cancelLabel?:  string;
  isDanger?:     boolean;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.scss',
})
export class ConfirmDialogComponent {
  readonly dialogRef = Inject(MatDialogRef<ConfirmDialogComponent>);

  constructor(
    @Inject(MAT_DIALOG_DATA) readonly data: ConfirmDialogData,
    private readonly ref: MatDialogRef<ConfirmDialogComponent>
  ) {}

  confirm(): void { this.ref.close(true); }
  cancel():  void { this.ref.close(false); }
}
