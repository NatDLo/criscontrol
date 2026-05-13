import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly snack = inject(MatSnackBar);

  readonly savingProfile = signal(false);
  readonly savingPassword = signal(false);
  readonly hideCurrent = signal(true);
  readonly hideNew = signal(true);
  readonly hideNew2 = signal(true);

  readonly profileForm = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.maxLength(150)]],
    first_name: ['', [Validators.maxLength(150)]],
    last_name: ['', [Validators.maxLength(150)]],
    email: [{value: '', disabled: true}],
  });

  readonly passwordForm = this.fb.nonNullable.group({
    current_password: ['', [Validators.required]],
    new_password: ['', [Validators.required, Validators.minLength(12)]],
    new_password2: ['', [Validators.required, Validators.minLength(12)]],
  });

  ngOnInit(): void {
    const user = this.auth.currentUser();
    if (user) {
      this.profileForm.patchValue({
        username: user.username ?? '',
        first_name: user.first_name ?? '',
        last_name: user.last_name ?? '',
        email: user.email ?? '',
      });
    } else {
      this.auth.getMe().subscribe({
        next: (u) =>
          this.profileForm.patchValue({
            username: u.username ?? '',
            first_name: u.first_name ?? '',
            last_name: u.last_name ?? '',
            email: u.email ?? '',
          }),
      });
    }
  }

  saveProfile(): void {
    if (this.profileForm.invalid || this.savingProfile()) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.savingProfile.set(true);
    const raw = this.profileForm.getRawValue();
    this.auth
      .updateProfile({
        username: raw.username,
        first_name: raw.first_name,
        last_name: raw.last_name,
      })
      .pipe(finalize(() => this.savingProfile.set(false)))
      .subscribe({
        next: (user) => {
          this.profileForm.patchValue({
            username: user.username ?? '',
            first_name: user.first_name ?? '',
            last_name: user.last_name ?? '',
            email: user.email ?? '',
          });
          this.snack.open('Profile updated / Perfil actualizado correctamente.', 'OK', { duration: 2500 });
        },
        error: (err) => {
          const msg =
            err?.error?.detail ||
            err?.error?.message ||
            'Could not update profile / No se pudo actualizar el perfil.';
          this.snack.open(String(msg), 'Cerrar', { duration: 4000 });
        },
      });
  }

  changePassword(): void {
    if (this.passwordForm.invalid || this.savingPassword()) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const v = this.passwordForm.getRawValue();
    if (v.new_password !== v.new_password2) {
      this.snack.open('La nueva contraseña y su confirmación no coinciden.', 'Cerrar', {
        duration: 3500,
      });
      return;
    }

    this.savingPassword.set(true);
    this.auth
      .changePassword(v)
      .pipe(finalize(() => this.savingPassword.set(false)))
      .subscribe({
        next: () => {
          this.passwordForm.reset({
            current_password: '',
            new_password: '',
            new_password2: '',
          });
          this.snack.open('Contraseña actualizada correctamente.', 'OK', { duration: 2500 });
        },
        error: (err) => {
          const msg =
            err?.error?.detail ||
            err?.error?.message ||
            'No se pudo cambiar la contraseña.';
          this.snack.open(String(msg), 'Cerrar', { duration: 4000 });
        },
      });
  }
}