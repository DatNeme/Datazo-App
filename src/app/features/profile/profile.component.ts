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
import { I18nService } from '../../core/i18n/i18n.service';

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
  i18n = inject(I18nService);

  newUsername = signal<string>('');
  newDisplayName = signal<string>('');
  newApiKey = signal<string>('');
  
  isSavingUsername = signal(false);
  usernameError = signal('');
  usernameSuccess = signal(false);

  isSavingName = signal(false);
  nameSuccess = signal(false);

  isSavingApiKey = signal(false);
  apiKeySuccess = signal(false);

  ngOnInit() {
    const profile = this.userService.userProfile();
    if (profile) {
      this.newUsername.set(profile.username || '');
      this.newDisplayName.set(profile.displayName || '');
      this.newApiKey.set(profile.preferences?.geminiApiKey || '');
    }
  }

  async saveUsername() {
    const val = this.newUsername().trim();
    if (!val) {
      this.usernameError.set(this.i18n.translate('PROFILE.USERNAME_EMPTY'));
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(val)) {
      this.usernameError.set(this.i18n.translate('PROFILE.USERNAME_INVALID'));
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
        const errorMsg = this.i18n.translate('PROFILE.USERNAME_TAKEN').replace('{{val}}', val);
        this.usernameError.set(errorMsg);
      }
    } catch (e) {
      this.usernameError.set(this.i18n.translate('PROFILE.USERNAME_ERROR'));
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
    } finally {
      this.isSavingName.set(false);
    }
  }

  async saveApiKey() {
    const val = this.newApiKey().trim();
    
    const user = this.auth.currentUser();
    if (!user) return;

    this.isSavingApiKey.set(true);
    this.apiKeySuccess.set(false);

    try {
      await this.userService.updatePreferences(user.uid, { geminiApiKey: val });
      this.apiKeySuccess.set(true);
      setTimeout(() => this.apiKeySuccess.set(false), 3000);
    } catch (e) {
    } finally {
      this.isSavingApiKey.set(false);
    }
  }
}
