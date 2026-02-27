import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
    {
        path: '',
        redirectTo: '/courts',
        pathMatch: 'full'
    },
    {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
    },
    {
        path: 'register',
        loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
    },
    {
        path: 'courts',
        canActivate: [authGuard],
        loadComponent: () => import('./features/courts/court-list/court-list.component').then(m => m.CourtListComponent)
    },
    {
        path: 'courts/:id',
        canActivate: [authGuard],
        loadComponent: () => import('./features/courts/court-detail/court-detail.component').then(m => m.CourtDetailComponent)
    },
    {
        path: '**',
        redirectTo: '/courts'
    }
];
