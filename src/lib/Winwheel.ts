export class Winwheel {
  private options: WinwheelOptions

  private defaultOptions: WinwheelOptions = {
    canvasId: "canvas", // Id of the canvas which the wheel is to draw on to.
    centerX: null, // X position of the center of the wheel. The default of these are null which means will be placed in center of the canvas.
    centerY: null, // Y position of the wheel center. If left null at time of construct the center of the canvas is used.
    outerRadius: null, // The radius of the outside of the wheel. If left null it will be set to the radius from the center of the canvas to its shortest side.
    innerRadius: 0, // Normally 0. Allows the creation of rings / doughnuts if set to value > 0. Should not exceed outer radius.
    numSegments: 1, // The number of segments. Need at least one to draw.
    drawMode: "code", // The draw mode. Possible values are 'code', 'image', 'segmentImage'. Default is code which means segments are drawn using canvas arc() function.
    rotationAngle: 0, // The angle of rotation of the wheel - 0 is 12 o'clock position.
    textFontFamily: "Arial", // Segment text font, you should use web safe fonts.
    textFontSize: 20, // Size of the segment text.
    textFontWeight: "bold", // Font weight.
    textOrientation: "horizontal", // Either horizontal, vertical, or curved.
    textAlignment: "center", // Either center, inner, or outer.
    textDirection: "normal", // Either normal or reversed. In normal mode for horizontal text in segment at 3 o'clock is correct way up, in reversed text at 9 o'clock segment is correct way up.
    textMargin: null, // Margin between the inner or outer of the wheel (depends on textAlignment).
    textFillStyle: "black", // This is basically the text colour.
    textStrokeStyle: null, // Basically the line colour for segment text, only looks good for large text so off by default.
    textLineWidth: 1, // Width of the lines around the text. Even though this defaults to 1, a line is only drawn if textStrokeStyle specified.
    fillStyle: "silver", // The segment background colour.
    strokeStyle: "black", // Segment line colour. Again segment lines only drawn if this is specified.
    lineWidth: 1, // Width of lines around segments.
    clearTheCanvas: true, // When set to true the canvas will be cleared before the wheel is drawn.
    imageOverlay: false, // If set to true in image drawing mode the outline of the segments will be displayed over the image. Does nothing in code drawMode.
    drawText: true, // By default the text of the segments is rendered in code drawMode and not in image drawMode.
    pointerAngle: 0, // Location of the pointer that indicates the prize when wheel has stopped. Default is 0 so the (corrected) 12 o'clock position.
    wheelImage: null, // Must be set to image data in order to use image to draw the wheel - drawMode must also be 'image'.
    imageDirection: "N", // Used when drawMode is segmentImage. Default is north, can also be (E)ast, (S)outh, (W)est.
  }

  segments: Array<Segment> = []

  constructor(_options?: WinwheelOptions, _drawWheel?: boolean) {
    // -----------------------------------------
    // Merge defaultOptions and given options and set them as properties this.options
    this.options = { ...this.defaultOptions, ..._options }

    // ------------------------------------------
    // Populate segments array if number of segments is specified for this object.
    for (let i = 1; i <= this.options.numSegments; i++) {
      // If options for the segments have been specified then create a segment sending these options so
      // the specified values are used instead of the defaults.
      if (
        this.options.segments &&
        typeof this.options.segments[i - 1] !== "undefined"
      ) {
        this.segments[i] = new Segment(this.options.segments[i - 1])
      }
      this.segments[i] = new Segment()
    }

    // ------------------------------------------
    // Call function to update the segment sizes setting the starting and ending angles.
    this.updateSegmentSizes()

    // If the text margin is null then set to same as font size as we want some by default.
    if (this.options.textMargin === null) {
      this.options.textMargin = this.options.textFontSize / 1.7
    }

    // if (
    //   this.options.animation &&
    //   typeof this.options.animation !== "undefined"
    // ) {}

    // if (
    //   this.options.pins &&
    //   typeof this.options.pins !== "undefined"
    // ) {}

    // ------------------------------------------
    // On that note, if the drawMode is image change some defaults provided a value has not been specified.

    // Create pointer guide.


  }

  updateSegmentSizes() {}
}

interface WinwheelOptions {
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
  textFontWeight?: string
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
  wheelImage?: null
  imageDirection?: "N" | "S" | "E" | "W"
  segments?: Array<SegmentOptions>
}

class Pin {
  private defaultOptions = {
    visible: true,
    number: 36,
    outerRadius: 3,
    fillStyle: "grey",
    strokeStyle: "black",
    lineWidth: 1,
    margin: 3, // The space between outside edge of the wheel and the pins.
  }
  constructor(_options) {
    // -----------------------------------------
    // Merge defaultOptions and given options and set them as properties of the class
    const opts = { ...this.defaultOptions, ..._options }
    for (const key in opts) {
      this[key] = opts[key]
    }
  }
}

class WheelAnimation {
  private defaultOptions = {
    type: "spinOngoing",
    direction: "clockwise",
    propertyName: null,
    propertyValue: null,
    duration: 10,
    yoyo: false,
    repeat: 0,
    easing: "power3.easeOut",
    stopAngle: null,
    spins: null,
    clearTheCanvas: null,
    callbackFinished: null,
    callbackBefore: null,
    callbackAfter: null,
  }
  constructor(_options) {
    // -----------------------------------------
    // Merge defaultOptions and given options and set them as properties of the class
    const opts = { ...this.defaultOptions, ..._options }
    for (const key in opts) {
      this[key] = opts[key]
    }
  }
}

class Segment {
  private defaultOptions: SegmentOptions = {
    size: null,
    text: "",
    fillStyle: null,
    strokeStyle: null,
    lineWidth: null,
    textFontFamily: null,
    textFontSize: null,
    textFontWeight: null,
    textOrientation: null,
    textAlignment: null,
    textDirection: null,
    textMargin: null,
    textFillStyle: null,
    textStrokeStyle: null,
    textLineWidth: null,
    image: null,
    imageDirection: null,
    imgData: null,
  }

  startAngle = 0
  endAngle = 0

  constructor(_options?: SegmentOptions) {
    // -----------------------------------------
    // Merge defaultOptions and given options and set them as properties of the class
    const opts = { ...this.defaultOptions, ..._options }
    for (const key in opts) {
      this[key] = opts[key]
    }
  }
}

interface SegmentOptions {
  size: number
  text: string
  fillStyle: string
  strokeStyle: string
  lineWidth: number
  textFontFamily: string
  textFontSize: number
  textFontWeight: string
  textOrientation: null
  textAlignment: string
  textDirection: null
  textMargin: number
  textFillStyle: string
  textStrokeStyle: string
  textLineWidth: number
  image: null
  imageDirection: string
  imgData: null
}
