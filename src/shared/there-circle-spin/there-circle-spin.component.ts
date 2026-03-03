import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-three-circle-spin',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="overlay-layer">
      <div class="loader">
      </div>
    </div>
  `,
  styles: [
    `
      .overlay-layer {
        position: fixed;
        inset: 0;
        background: rgba(255, 255, 255, 0.5);
        z-index: 9000;
        transition: opacity 0.2s linear;

        .loader {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 150px;
          height: 150px;
          translate: -50% -50%;
          border-radius: 50%;
          border: 3px solid transparent;
          border-top-color: #3498db;
          animation: spin 2s linear infinite;
          z-index: 9001;

          .logo-image {
            position: absolute;
            left: 50%;
            top: 50%;
            width: 38px;
            transform: translate(-50%, -50%);
            z-index: 9002;
          }

          &:before {
            content: '';
            position: absolute;
            top: 5px;
            left: 5px;
            right: 5px;
            bottom: 5px;
            border-radius: 50%;
            border: 3px solid transparent;
            border-top-color: #000000;
            animation: spin 3s linear infinite;
          }

          &:after {
            content: '';
            position: absolute;
            top: 15px;
            left: 15px;
            right: 15px;
            bottom: 15px;
            border-radius: 50%;
            border: 3px solid transparent;
            border-top-color: #33cc33;
            animation: spin 1.5s linear infinite;
          }

          @keyframes spin {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThreeCircleSpinComponent {}
