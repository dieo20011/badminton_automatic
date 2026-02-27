import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CourtService } from '../../../core/services/court.service';
import { CreateCourtRequest } from '../../../core/models/court.model';

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
        private fb: FormBuilder,
        private courtService: CourtService
    ) {
        this.courtForm = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(3)]],
            password: ['', [Validators.required, Validators.minLength(4)]]
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
            name: this.courtForm.value.name,
            password: this.courtForm.value.password
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
