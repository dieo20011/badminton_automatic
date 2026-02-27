import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { RegisterRequest } from '../../../core/models/user.model';

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterLink],
    templateUrl: './register.component.html',
    styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
    registerForm: FormGroup;
    isLoading = false;
    errorMessage = '';

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private router: Router
    ) {
        this.registerForm = this.fb.group({
            fullName: ['', [Validators.required, Validators.minLength(2)]],
            userName: ['', [Validators.required, Validators.minLength(3)]],
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(4)]]
        });
    }

    onSubmit(): void {
        if (this.registerForm.invalid) {
            this.markFormGroupTouched(this.registerForm);
            return;
        }

        this.isLoading = true;
        this.errorMessage = '';

        const request: RegisterRequest = {
            fullName: this.registerForm.value.fullName,
            userName: this.registerForm.value.userName,
            email: this.registerForm.value.email,
            password: this.registerForm.value.password
        };

        this.authService.register(request).subscribe({
            next: () => {
                this.router.navigate(['/courts']);
            },
            error: (err: { error?: { errorMessage?: string }; message?: string }) => {
                this.errorMessage = err?.error?.errorMessage ?? err?.message ?? 'Registration failed. Please try again.';
                this.isLoading = false;
            },
            complete: () => {
                this.isLoading = false;
            }
        });
    }

    private markFormGroupTouched(formGroup: FormGroup): void {
        Object.keys(formGroup.controls).forEach((key: string) => {
            formGroup.get(key)?.markAsTouched();
        });
    }

    get fullName() {
        return this.registerForm.get('fullName');
    }
    get userName() {
        return this.registerForm.get('userName');
    }
    get email() {
        return this.registerForm.get('email');
    }
    get password() {
        return this.registerForm.get('password');
    }
}
