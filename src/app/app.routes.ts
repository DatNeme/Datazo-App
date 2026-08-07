import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { loggedInGuard } from './core/guards/logged-in.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [loggedInGuard],
    loadComponent: () => import('./features/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent)
  },
  {
    path: 'ranking',
    canActivate: [authGuard],
    loadComponent: () => import('./features/ranking/ranking.component').then(m => m.RankingComponent)
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'game',
    canActivate: [authGuard],
    loadComponent: () => import('./features/game/game.component').then(m => m.GameComponent)
  },
  { path: '**', redirectTo: '' }
];
