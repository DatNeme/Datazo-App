import { Component, inject, effect } from '@angular/core';
import { RouterOutlet, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { ThemeService } from './core/services/theme.service';
import { I18nService } from './core/i18n/i18n.service';
import { AuthService } from './core/services/auth.service';
import { UserService } from './core/services/user.service';
import { TranslatePipe } from './core/i18n/translate.pipe';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule, MatToolbarModule, MatButtonModule, MatMenuModule, TranslatePipe],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  themeService = inject(ThemeService);
  i18n = inject(I18nService);
  auth = inject(AuthService);
  router = inject(Router);
  userService = inject(UserService);

  constructor() {
    // Al loguearse, aplicar preferencias del perfil
    effect(() => {
      const profile = this.userService.userProfile();
      if (profile) {
        // Untracked para evitar ciclos infinitos, solo nos interesa aplicar los cambios
        // que vengan de la BD (ej. en el login).
        this.themeService.setDarkMode(profile.preferences.theme === 'dark');
        if (this.i18n.currentLang() !== profile.preferences.language) {
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
  }

  logout() {
    this.auth.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      }
    });
  }
}
