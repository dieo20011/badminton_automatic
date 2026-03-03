import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { RegisterRequest } from '../../../core/models/user.model';
import { noWhitespaceValidator } from '../../../core/validators/form.validators';

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
            fullName: ['', [Validators.required, Validators.minLength(2), noWhitespaceValidator]],
            userName: ['', [Validators.required, Validators.minLength(3), noWhitespaceValidator]],
            email: ['', [Validators.required, Validators.email, noWhitespaceValidator]],
            password: ['', [Validators.required, Validators.minLength(4), noWhitespaceValidator]]
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
            fullName: (this.registerForm.value.fullName as string).trim(),
            userName: (this.registerForm.value.userName as string).trim(),
            email: (this.registerForm.value.email as string).trim(),
            password: (this.registerForm.value.password as string).trim()
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
