import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CourtService } from '../../../core/services/court.service';
import { CreateCourtRequest } from '../../../core/models/court.model';
import { noWhitespaceValidator } from '../../../core/validators/form.validators';

@Component({
    selector: 'app-add-court-dialog',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './add-court-dialog.component.html',
    styleUrls: ['./add-court-dialog.component.scss']
})
export class AddCourtDialogComponent {
    @Output() close = new EventEmitter<void>();
    @Output() courtAdded = new EventEmitter<void>();

    courtForm: FormGroup;
    isSubmitting = false;

    constructor(
        private readonly fb: FormBuilder,
        private readonly courtService: CourtService
    ) {
        this.courtForm = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(3), noWhitespaceValidator]],
            password: ['', [Validators.required, Validators.minLength(4), noWhitespaceValidator]]
        });
    }

    onClose(): void {
        this.close.emit();
    }

    onSubmit(): void {
        if (this.courtForm.invalid) {
            this.markFormGroupTouched(this.courtForm);
            return;
        }

        this.isSubmitting = true;

        const request: CreateCourtRequest = {
            name: (this.courtForm.value.name as string).trim(),
            password: (this.courtForm.value.password as string).trim()
        };

        this.courtService.createCourt(request).then(() => {
            this.courtAdded.emit();
            this.isSubmitting = false;
        }).catch(() => {
            this.isSubmitting = false;
        });
    }

    private markFormGroupTouched(formGroup: FormGroup): void {
        Object.keys(formGroup.controls).forEach((key: string) => {
            const control = formGroup.get(key);
            control?.markAsTouched();
        });
    }

    get name() {
        return this.courtForm.get('name');
    }

    get password() {
        return this.courtForm.get('password');
    }
}
