import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { I18nService } from '../../core/i18n/i18n.service';

type AuthMode = 'login' | 'register';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatProgressSpinnerModule, TranslatePipe],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  public i18n = inject(I18nService);

  mode = signal<AuthMode>('login');
  isLoading = signal(false);
  errorMessage = signal('');

  email = '';
  password = '';

  constructor() {
    // Redirigir al home automáticamente en cuanto el usuario esté logueado y el perfil cargado.
    effect(() => {
      if (this.auth.isLoggedIn()) {
        this.router.navigate(['/']);
      }
    });
  }

  toggleMode() {
    this.mode.set(this.mode() === 'login' ? 'register' : 'login');
    this.errorMessage.set('');
  }

  loginWithGoogle() {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.auth.loginWithGoogle().subscribe({
      next: () => {}, // Handled by effect
      error: (err: any) => {
        this.errorMessage.set(this.parseError(err.code));
        this.isLoading.set(false);
      }
    });
  }

  loginAnonymously() {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.auth.loginAnonymously().subscribe({
      next: () => {}, // Handled by effect
      error: (err: any) => {
        this.errorMessage.set(this.parseError(err.code));
        this.isLoading.set(false);
      }
    });
  }

  submitForm() {
    if (!this.email || !this.password) return;
    this.isLoading.set(true);
    this.errorMessage.set('');

    const action$ = this.mode() === 'login'
      ? this.auth.loginWithEmail(this.email, this.password)
      : this.auth.registerWithEmail(this.email, this.password);

    action$.subscribe({
      next: () => {}, // Handled by effect
      error: (err: any) => {
        this.errorMessage.set(this.parseError(err.code));
        this.isLoading.set(false);
      }
    });
  }

  private parseError(code: string): string {
    const errors: Record<string, string> = {
      'auth/invalid-email': 'El email no es válido.',
      'auth/wrong-password': 'Contraseña incorrecta.',
      'auth/user-not-found': 'No existe una cuenta con ese email.',
      'auth/email-already-in-use': 'Ya existe una cuenta con ese email.',
      'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
      'auth/popup-closed-by-user': 'El inicio de sesión fue cancelado.',
      'auth/too-many-requests': 'Demasiados intentos fallidos. Intenta más tarde.',
    };
    return errors[code] || 'Ocurrió un error. Intenta nuevamente.';
  }
}
