import { DOCUMENT } from '@angular/common';
import {
  Directive,
  ElementRef,
  EventEmitter,
  Inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
  Renderer2,
} from '@angular/core';
import { Subject, fromEvent, takeUntil } from 'rxjs';

export type ResizeAnchorType = 'top' | 'left' | 'bottom' | 'right';

export type ResizeDirectionType = 'x' | 'y' | 'xy';

export interface IOutputSize {
  width: number;
  height: number;
}

export interface IOutputPosition {
  x: number;
  y: number;
}

export interface IControlBlock {
  className: string;
  anchors: ResizeAnchorType[];
  direction: ResizeDirectionType;
}

const sizeControlBlocks: IControlBlock[] = [
  {
    className: 'resize-line__right',
    anchors: ['right'],
    direction: 'x',
  },
  {
    className: 'resize-line__left',
    anchors: ['left'],
    direction: 'x',
  },
  {
    className: 'resize-line__bottom',
    anchors: ['bottom'],
    direction: 'y',
  },
  {
    className: 'resize-line__top',
    anchors: ['top'],
    direction: 'y',
  },
  {
    className: 'resize-square__bottom-right',
    anchors: ['bottom', 'right'],
    direction: 'xy',
  },
  {
    className: 'resize-square__top-left',
    anchors: ['top', 'left'],
    direction: 'xy',
  },
  {
    className: 'resize-square__bottom-left',
    anchors: ['bottom', 'left'],
    direction: 'xy',
  },
  {
    className: 'resize-square__top-right',
    anchors: ['top', 'right'],
    direction: 'xy',
  },
];

@Directive({
  selector: '[appResize]',
  standalone: true,
})
export class ResizeDirective implements OnInit, OnDestroy {
  deleteListener = new Subject<void>();

  @Output()
  onChangePosition = new EventEmitter<IOutputPosition>();

  @Output()
  onChangeSize = new EventEmitter<IOutputSize>();

  @Input('disabledResize') set disabled(value: boolean) {
    this.toggleVisibility(value);
  }

  @Input()
  minHeightResize: number = 0;

  @Input()
  minWidthResize: number = 0;

  @Input()
  maxHeightResize: number | null = null;

  @Input()
  maxWidthResize: number | null = null;

  controlElements: HTMLDivElement[] = [];

  constructor(
    @Inject(DOCUMENT) private _document: Document,
    private elementRef: ElementRef,
    private renderer: Renderer2
  ) {}

  ngOnInit(): void {
    this.renderer.setStyle(
      this.elementRef.nativeElement,
      'position',
      'relative'
    );

    sizeControlBlocks.forEach(
      ({ direction, anchors, className }: IControlBlock) => {
        const element: HTMLDivElement = this.renderer.createElement('div');
        this.controlElements.push(element);

        this.renderer.addClass(element, className);

        this.renderer.appendChild(this.elementRef.nativeElement, element);

        fromEvent<MouseEvent>(element, 'mousedown')
          .pipe(takeUntil(this.deleteListener))
          .subscribe((mousedownEvent) => {
            mousedownEvent.preventDefault();

            const mouseX: number = mousedownEvent.clientX;
            const mouseY: number = mousedownEvent.clientY;

            const {
              x: elementStartX,
              y: elementStartY,
            }: { x: number; y: number } =
              this.elementRef.nativeElement.getBoundingClientRect();

            const startWidth: number =
              this.elementRef.nativeElement.offsetWidth;
            const startHeight: number =
              this.elementRef.nativeElement.offsetHeight;

            const elementEndX: number = elementStartX + startWidth;
            const elementEndY: number = elementStartY + startHeight;

            const clearListener: Subject<void> = new Subject<void>();

            fromEvent<MouseEvent>(this._document, 'mousemove')
              .pipe(takeUntil(clearListener), takeUntil(this.deleteListener))
              .subscribe((mousemoveEvent) => {
                mousemoveEvent.preventDefault();

                const size: IOutputSize = {
                  height: startHeight,
                  width: startWidth,
                };
                const position: IOutputPosition = {
                  x: elementStartX,
                  y: elementStartY,
                };

                if (direction === 'x' || direction === 'xy') {
                  let width: number = 0;

                  if (anchors.includes('left')) {
                    width = startWidth - mousemoveEvent.clientX + mouseX;
                  } else if (anchors.includes('right')) {
                    width = startWidth + mousemoveEvent.clientX - mouseX;
                  }

                  if (width <= this.minWidthResize) {
                    size.width = this.minWidthResize;
                  } else if (
                    this.maxWidthResize &&
                    width >= this.maxWidthResize
                  ) {
                    size.width = this.maxWidthResize;
                  } else {
                    size.width = width;
                  }
                }

                if (direction === 'y' || direction === 'xy') {
                  let height: number = 0;

                  if (anchors.includes('top')) {
                    height = startHeight + mouseY - mousemoveEvent.clientY;
                  } else if (anchors.includes('bottom')) {
                    height = startHeight - mouseY + mousemoveEvent.clientY;
                  }

                  if (height <= this.minHeightResize) {
                    size.height = this.minHeightResize;
                  } else if (
                    this.maxHeightResize &&
                    height >= this.maxHeightResize
                  ) {
                    size.height = this.maxHeightResize;
                  } else {
                    size.height = height;
                  }
                }

                if (anchors.includes('left')) {
                  position.x = elementEndX - size.width;
                }

                if (anchors.includes('top')) {
                  position.y = elementEndY - size.height;
                }

                this.onChangePosition.emit(position);
                this.onChangeSize.emit(size);
              });

            fromEvent(this._document, 'mouseup')
              .pipe(takeUntil(clearListener), takeUntil(this.deleteListener))
              .subscribe(() => {
                clearListener.next();
                clearListener.complete();
              });
          });
      }
    );
  }

  ngOnDestroy(): void {
    this.deleteListener.next();
    this.deleteListener.complete();
  }

  toggleVisibility(value: boolean): void {
    this.controlElements.forEach((el: HTMLDivElement) => {
      this.renderer.setStyle(el, 'display', value ? 'none' : 'block');
    });
  }
}
