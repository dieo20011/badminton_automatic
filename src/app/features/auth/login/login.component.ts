import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { LoginRequest } from '../../../core/models/user.model';
import { noWhitespaceValidator } from '../../../core/validators/form.validators';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterLink],
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss']
})
export class LoginComponent {
    loginForm: FormGroup;
    isLoading = false;
    errorMessage = '';

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private router: Router,
        private route: ActivatedRoute
    ) {
        this.loginForm = this.fb.group({
            username: ['', [Validators.required, Validators.minLength(3), noWhitespaceValidator]],
            password: ['', [Validators.required, Validators.minLength(4), noWhitespaceValidator]]
        });
    }

    onSubmit(): void {
        if (this.loginForm.invalid) {
            this.markFormGroupTouched(this.loginForm);
            return;
        }

        this.isLoading = true;
        this.errorMessage = '';

        const request: LoginRequest = {
            username: (this.loginForm.value.username as string).trim(),
            password: (this.loginForm.value.password as string).trim()
        };

        this.authService.login(request).subscribe({
            next: () => {
                const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/courts';
                this.router.navigate([returnUrl]);
            },
            error: (err: { error?: { errorMessage?: string }; message?: string }) => {
                this.errorMessage = err?.error?.errorMessage ?? err?.message ?? 'Login failed. Please try again.';
                this.isLoading = false;
            },
            complete: () => {
                this.isLoading = false;
            }
        });
    }

    private markFormGroupTouched(formGroup: FormGroup): void {
        Object.keys(formGroup.controls).forEach((key: string) => {
            const control = formGroup.get(key);
            control?.markAsTouched();
        });
    }

    get username() {
        return this.loginForm.get('username');
    }

    get password() {
        return this.loginForm.get('password');
    }
}
