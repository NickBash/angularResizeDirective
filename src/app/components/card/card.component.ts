import { Component } from '@angular/core';
import { CdkDrag, CdkDragHandle } from '@angular/cdk/drag-drop';
import { ResizeDirective } from '../../directives/resize.directive';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CdkDrag, CdkDragHandle, ResizeDirective],
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss',
})
export class CardComponent {
  dragPosition = { x: 0, y: 0 };
  size = { width: 300, height: 200 };
  disableResize = false;

  changePositionCard(e: { x: number; y: number }) {
    this.dragPosition = e;
  }

  changePositionSize(e: { width: number; height: number }) {
    this.size = e;
  }

  toggle() {
    this.disableResize = !this.disableResize;
  }
}
