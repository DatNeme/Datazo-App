import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { RouterModule } from '@angular/router';
import { TranslatePipe } from '../../core/i18n/translate.pipe';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatProgressSpinnerModule, MatIconModule, TranslatePipe, RouterModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  userService = inject(UserService);
  auth = inject(AuthService);

  newUsername = signal<string>('');
  newDisplayName = signal<string>('');
  
  isSavingUsername = signal(false);
  usernameError = signal('');
  usernameSuccess = signal(false);

  isSavingName = signal(false);
  nameSuccess = signal(false);

  ngOnInit() {
    const profile = this.userService.userProfile();
    if (profile) {
      this.newUsername.set(profile.username || '');
      this.newDisplayName.set(profile.displayName || '');
    }
  }

  async saveUsername() {
    const val = this.newUsername().trim();
    if (!val) {
      this.usernameError.set('El nombre de usuario no puede estar vacío');
      return;
    }
    // Validar caracteres (solo letras, numeros, guiones bajos)
    if (!/^[a-zA-Z0-9_]+$/.test(val)) {
      this.usernameError.set('Solo se permiten letras, números y guiones bajos (_)');
      return;
    }

    const user = this.auth.currentUser();
    if (!user) return;

    this.isSavingUsername.set(true);
    this.usernameError.set('');
    this.usernameSuccess.set(false);

    try {
      const success = await this.userService.changeUsername(user.uid, val);
      if (success) {
        this.usernameSuccess.set(true);
        setTimeout(() => this.usernameSuccess.set(false), 3000);
      } else {
        this.usernameError.set(`El nombre de usuario @${val} ya está en uso.`);
      }
    } catch (e) {
      this.usernameError.set('Ocurrió un error al cambiar el nombre de usuario.');
    } finally {
      this.isSavingUsername.set(false);
    }
  }

  async saveName() {
    const val = this.newDisplayName().trim();
    if (!val) return;

    const user = this.auth.currentUser();
    if (!user) return;

    this.isSavingName.set(true);
    this.nameSuccess.set(false);

    try {
      await this.userService.updateDisplayName(user.uid, val);
      this.nameSuccess.set(true);
      setTimeout(() => this.nameSuccess.set(false), 3000);
    } catch (e) {
      // Error manejado silenciosamente o con toast
    } finally {
      this.isSavingName.set(false);
    }
  }
}
