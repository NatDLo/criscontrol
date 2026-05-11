import { Component, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';

import { CategoryService } from '../../core/services/category.service';
import { Category, CreateCategoryDto, CategoryType } from '../../core/models';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

const CATEGORY_ICONS: string[] = [
  'restaurant', 'directions_car', 'home', 'local_hospital', 'school',
  'shopping_cart', 'flight', 'sports_esports', 'payments', 'work',
  'attach_money', 'savings', 'card_giftcard', 'fitness_center', 'wifi',
];

const CATEGORY_COLORS: { label: string; value: string }[] = [
  { label: 'Azul',     value: '#3B82F6' },
  { label: 'Verde',    value: '#10B981' },
  { label: 'Rojo',     value: '#EF4444' },
  { label: 'Naranja',  value: '#F97316' },
  { label: 'Morado',   value: '#8B5CF6' },
  { label: 'Rosa',     value: '#EC4899' },
  { label: 'Amarillo', value: '#F59E0B' },
  { label: 'Gris',     value: '#64748B' },
];

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatChipsModule,
    MatTooltipModule,
  ],
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.scss',
})
export class CategoriesComponent implements OnInit {
  private readonly svc   = inject(CategoryService);
  private readonly dialog = inject(MatDialog);
  private readonly snack  = inject(MatSnackBar);
  private readonly fb     = inject(FormBuilder);

  readonly categories = signal<Category[]>([]);
  readonly loading    = signal(false);
  readonly saving     = signal(false);
  readonly formOpen   = signal(false);
  readonly editingId  = signal<string | null>(null);

  readonly icons  = CATEGORY_ICONS;
  readonly colors = CATEGORY_COLORS;

  form!: FormGroup;

  ngOnInit(): void {
    this.initForm();
    this.loadCategories();
  }

  private initForm(category?: Category): void {
    this.form = this.fb.group({
      name:        [category?.name ?? '',      [Validators.required, Validators.maxLength(60)]],
      type:        [category?.type ?? 'expense', Validators.required],
      icon:        [category?.icon ?? 'payments'],
      color:       [category?.color ?? '#3B82F6'],
      description: [category?.description ?? ''],
    });
  }

  loadCategories(): void {
    this.loading.set(true);
    this.svc.getAll().subscribe({
      next: (res) => { this.categories.set(res.data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openNew(): void {
    this.editingId.set(null);
    this.initForm();
    this.formOpen.set(true);
  }

  openEdit(cat: Category): void {
    this.editingId.set(cat.id);
    this.initForm(cat);
    this.formOpen.set(true);
  }

  closeForm(): void {
    this.formOpen.set(false);
    this.editingId.set(null);
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);

    const dto = this.form.getRawValue() as CreateCategoryDto;
    const id  = this.editingId();
    const req$ = id ? this.svc.update(id, dto) : this.svc.create(dto);

    req$.subscribe({
      next: () => {
        this.snack.open(id ? 'Categoría actualizada.' : 'Categoría creada.', 'OK', {
          duration: 3000, panelClass: ['success-snackbar'],
        });
        this.saving.set(false);
        this.closeForm();
        this.loadCategories();
      },
      error: () => this.saving.set(false),
    });
  }

  confirmDelete(cat: Category): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title:        'Eliminar categoría',
        message:      `¿Eliminar la categoría "${cat.name}"? Las transacciones asociadas quedarán sin categoría.`,
        confirmLabel: 'Eliminar',
        isDanger:     true,
      },
    });

    ref.afterClosed().subscribe((ok: boolean) => {
      if (!ok) return;
      this.svc.remove(cat.id).subscribe({
        next: () => {
          this.snack.open('Categoría eliminada.', 'OK', { duration: 3000, panelClass: ['success-snackbar'] });
          this.loadCategories();
        },
      });
    });
  }

  typeLabel(type: CategoryType): string {
    return type === 'income' ? 'Ingreso' : type === 'expense' ? 'Gasto' : 'Ambos';
  }
}
