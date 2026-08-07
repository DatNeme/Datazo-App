import { Component, inject, effect, untracked } from '@angular/core';
import { RouterOutlet, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { ThemeService } from './core/services/theme.service';
import { I18nService } from './core/i18n/i18n.service';
import { AuthService } from './core/services/auth.service';
import { UserService } from './core/services/user.service';
import { TranslatePipe } from './core/i18n/translate.pipe';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule, MatToolbarModule, MatButtonModule, MatMenuModule, MatSnackBarModule, TranslatePipe],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  themeService = inject(ThemeService);
  i18n = inject(I18nService);
  auth = inject(AuthService);
  router = inject(Router);
  userService = inject(UserService);
  snackBar = inject(MatSnackBar);

  constructor() {
    effect(() => {
      const profile = this.userService.userProfile();
      if (profile) {
        this.themeService.setDarkMode(profile.preferences.theme === 'dark');
        if (untracked(() => this.i18n.currentLang()) !== profile.preferences.language) {
          this.i18n.use(profile.preferences.language);
        }
      }
    });
  }

  toggleTheme() {
    this.themeService.toggleTheme();
    const user = this.auth.currentUser();
    if (user && !user.isAnonymous) {
      this.userService.updatePreferences(user.uid, {
        theme: this.themeService.isDarkMode() ? 'dark' : 'light'
      });
    }
  }

  toggleLanguage() {
    const currentLang = this.i18n.currentLang();
    const newLang = currentLang === 'es' ? 'en' : 'es';
    this.i18n.use(newLang);
    
    const user = this.auth.currentUser();
    if (user && !user.isAnonymous) {
      this.userService.updatePreferences(user.uid, { language: newLang });
    }

    if (newLang === 'es') {
      const profile = this.userService.userProfile();
      if (!profile?.preferences?.geminiApiKey) {
        this.snackBar.open('Debes configurar tu Gemini API Key en el Perfil para jugar en Español.', 'Ir al Perfil', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom'
        }).onAction().subscribe(() => {
          this.router.navigate(['/profile']);
        });
      }
    }
  }

  logout() {
    this.auth.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      }
    });
  }
}
