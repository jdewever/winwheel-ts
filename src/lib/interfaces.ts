export interface WinwheelOptions {
  canvasId: string
  centerX: number
  centerY: number
  outerRadius: number
  innerRadius: number
  numSegments: number
  drawMode: "code" | "image" | "segmentImage"
  rotationAngle: number
  textFontFamily: string
  textFontSize: number
  textFontWeight: string | number
  textOrientation: "horizontal" | "vertical" | "curved"
  textAlignment: "center" | "inner" | "outer"
  textDirection: "normal" | "reversed"
  textMargin: number
  textFillStyle: string
  textStrokeStyle: string
  textLineWidth: number
  fillStyle: string
  strokeStyle: string
  lineWidth: number
  clearTheCanvas: boolean
  imageOverlay: boolean
  drawText: boolean
  pointerAngle: number
  wheelImage: CanvasImageSource
  imageDirection: "N" | "S" | "E" | "W"
  responsive: boolean
  segments: Array<SegmentOptions>
  scaleFactor: number
  animation: AnimationOptions
  pointerGuide: PointerGuideOptions
  Pins: PinOptions
}

export interface SegmentOptions {
  size: number
  text: string
  fillStyle: string
  strokeStyle: string
  lineWidth: number
  textFontFamily: string
  textFontSize: number
  textFontWeight: string
  textOrientation: "horizontal" | "vertical" | "curved"
  textAlignment: "center" | "inner" | "outer"
  textDirection: "normal" | "reversed"
  textMargin: number
  textFillStyle: string
  textStrokeStyle: string
  textLineWidth: number
  image: string
  imageDirection: "N" | "S" | "E" | "W"
  imgData: HTMLImageElement
}

export interface PinOptions {
  visible: boolean
  number: number
  outerRadius: number
  fillStyle: string
  strokeStyle: string
  lineWidth: number
  margin: number
  responsive: boolean
}

export interface AnimationOptions {
  type: "spinOngoing" | "spinToStop" | "spinAndBack" | "custom"
  direction: "clockwise" | "anti-clockwise"
  propertyName: string
  propertyValue: number
  duration: number
  yoyo: boolean
  repeat: number
  easing:
    | "Power3.easeOut"
    | "Linear.easeNone"
    | "Power2.easeInOut"
    | "Power4.easeOut"
  stopAngle: number
  spins: number
  clearTheCanvas: boolean
  callbackFinished: VoidFunction
  callbackBefore: VoidFunction
  callbackAfter: VoidFunction
  callbackSound: VoidFunction
  soundTrigger: "segment" | "pin"
}

export interface PointerGuideOptions {
  display: boolean
  strokeStyle: string
  lineWidth: number
}
