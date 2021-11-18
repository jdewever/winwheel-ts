export class Winwheel {
  constructor(_options?: WinwheelOptions, _drawWheel?: boolean)
  updateSegmentSizes(): void
  clearCanvas(): void
  draw(clearTheCanvas?: boolean): void
  drawPins(): void
  drawPointerGuide(): void
  drawWheelImage(): void
  drawSegmentImages(): void
  drawSegments(): void
  drawSegmentText(): void
  degToRad(d: number): number
  setCenter(x: number, y: number): void
  addSegment(options: SegmentOptions, position?: number): Segment
  setCanvasId(canvasId: string): void
  deleteSegment(position: number): void
  windowToCanvas(x: number, y: number): { x: number; y: number }
  getSegmentAt(x: number, y: number): Segment
  getSegmentNumberAt(x: number, y: number): number
  getIndicatedSegment(): Segment
  getIndicatedSegmentNumber(): number
  getRotationPosition(): number
  startAnimation(): void
  stopAnimation(canCallback: boolean): void
  pauseAnimation(): void
  resumeAnimation(): void
  computeAnimation(): void
  getRandomForSegment(segmentNumber: number): number
}

export interface WinwheelOptions {
  canvasId?: string
  centerX?: number
  centerY?: number
  outerRadius?: number
  innerRadius?: number
  numSegments?: number
  drawMode?: "code" | "image" | "segmentImage"
  rotationAngle?: number
  textFontFamily?: string
  textFontSize?: number
  textFontWeight?: string | number
  textOrientation?: "horizontal" | "vertical" | "curved"
  textAlignment?: "center" | "inner" | "outer"
  textDirection?: "normal" | "reversed"
  textMargin?: number
  textFillStyle?: string
  textStrokeStyle?: string
  textLineWidth?: number
  fillStyle?: string
  strokeStyle?: string
  lineWidth?: number
  clearTheCanvas?: boolean
  imageOverlay?: boolean
  drawText?: boolean
  pointerAngle?: number
  wheelImage?: CanvasImageSource
  imageDirection?: "N" | "S" | "E" | "W"
  responsive?: boolean
  segments?: Array<SegmentOptions>
  scaleFactor?: number
  animation?: AnimationOptions
  pointerGuide?: PointerGuideOptions
  Pins?: PinOptions
}

export class Segment {
  constructor(_options?: SegmentOptions)
  changeImage(image: unknown, imageDirection?: "N" | "S" | "E" | "W"): void
}

export interface SegmentOptions {
  size?: number
  text?: string
  fillStyle?: string
  strokeStyle?: string
  lineWidth?: number
  textFontFamily?: string
  textFontSize?: number
  textFontWeight?: string
  textOrientation?: "horizontal" | "vertical" | "curved"
  textAlignment?: "center" | "inner" | "outer"
  textDirection?: "normal" | "reversed"
  textMargin?: number
  textFillStyle?: string
  textStrokeStyle?: string
  textLineWidth?: number
  image?: string
  imageDirection?: "N" | "S" | "E" | "W"
  imgData?: HTMLImageElement
}

export class Pin {
  constructor(_options?: PinOptions)
}

export interface PinOptions {
  visible?: boolean
  number?: number
  outerRadius?: number
  fillStyle?: string
  strokeStyle?: string
  lineWidth?: number
  margin?: number
  responsive?: boolean
}

export class Animation {
  constructor(_options?: AnimationOptions)
}

export interface AnimationOptions {
  type?: "spinOngoing" | "spinToStop" | "spinAndBack" | "custom"
  direction?: "clockwise" | "anti-clockwise"
  propertyName?: string
  propertyValue?: number
  duration?: number
  yoyo?: boolean
  repeat?: number
  easing?: "power3.easeOut" | "linear.easeNone" | "power2.easeInOut "
  stopAngle?: number
  spins?: number
  clearTheCanvas?: boolean
  callbackFinished?: VoidFunction
  callbackBefore?: VoidFunction
  callbackAfter?: VoidFunction
  callbackSound?: VoidFunction
  soundTrigger?: "segment" | "pin"
}

export class PointerGuide {
  constructor(_options?: PointerGuideOptions)
}

export interface PointerGuideOptions {
  display?: boolean
  strokeStyle?: string
  lineWidth?: number
}
