import { gsap } from "gsap"
import { WinwheelOptions, SegmentOptions, PinOptions, AnimationOptions, PointerGuideOptions } from "./interfaces"

export class Winwheel {
  options: WinwheelOptions
  segments: Array<Segment> = []
  pins: Pin
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  animation: Animation
  drawWheel: boolean
  pointerGuide: PointerGuide
  tween: GSAPTween

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
    responsive: false,
    segments: [],
    scaleFactor: 1.0,
  }

  constructor(_options?: WinwheelOptions, _drawWheel?: boolean) {
    // -----------------------------------------
    // Merge defaultOptions and given options and set them as properties this.options
    this.options = { ...this.defaultOptions, ..._options }
    // ------------------------------------------
    // If the id of the canvas is set, try to get the canvas as we need it for drawing.
    if (this.options.canvasId) {
      this.canvas = document.getElementById(
        this.options.canvasId,
      ) as HTMLCanvasElement

      if (this.canvas) {
        // If the centerX and centerY have not been specified in the options then default to center of the canvas
        // and make the outerRadius half of the canvas width - this means the wheel will fill the canvas.
        if (this.options.centerX == null) {
          this.options.centerX = this.canvas.width / 2
        }

        if (this.options.centerY == null) {
          this.options.centerY = this.canvas.height / 2
        }

        if (this.options.outerRadius == null) {
          // Need to set to half the width of the shortest dimension of the canvas as the canvas may not be square.
          // Minus the line segment line width otherwise the lines around the segments on the top,left,bottom,right
          // side are chopped by the edge of the canvas.
          if (this.canvas.width < this.canvas.height) {
            this.options.outerRadius =
              this.canvas.width / 2 - this.options.lineWidth
          } else {
            this.options.outerRadius =
              this.canvas.height / 2 - this.options.lineWidth
          }
        }

        // Also get a 2D context to the canvas as we need this to draw with.
        this.ctx = this.canvas.getContext("2d")
      } else {
        this.canvas = null
        this.ctx = null
      }
    } else {
      this.canvas = null
      this.ctx = null
    }

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

    if (this.options.animation) {
      this.animation = new Animation(this.options.animation)
    } else {
      this.animation = new Animation()
    }

    if (this.options.Pins) {
      this.pins = new Pin(this.options.Pins)
    }

    // ------------------------------------------
    // On that note, if the drawMode is image change some defaults provided a value has not been specified.
    if (
      this.options.drawMode == "image" ||
      this.options.drawMode == "segmentImage"
    ) {
      // Remove grey fillStyle.
      if (!this.options.fillStyle) {
        this.options.fillStyle = null
      }

      // Set strokeStyle to red.
      if (!this.options.strokeStyle) {
        this.options.strokeStyle = "red"
      }

      // Set drawText to false as we will assume any text is part of the image.
      if (!this.options.drawText) {
        this.options.drawText = false
      }

      // Also set the lineWidth to 1 so that segment overlay will look correct.
      if (!this.options.lineWidth) {
        this.options.lineWidth = 1
      }

      // Set drawWheel to false as normally the image needs to be loaded first.
      if (!_drawWheel) {
        this.drawWheel = false
      }
    } else {
      // When in code drawMode the default is the wheel will draw.
      if (!_drawWheel) {
        this.drawWheel = true
      }
    }

    // Create pointer guide.
    if (this.options.pointerGuide) {
      this.pointerGuide = new PointerGuide(this.options.pointerGuide)
    } else {
      this.pointerGuide = new PointerGuide()
    }

    // Finally if drawWheel is true then call function to render the wheel, segment text, overlay etc.
    if (this.drawWheel == true) {
      this.draw(this.options.clearTheCanvas)
    } else if (this.options.drawMode == "segmentImage") {
      // If segment image then loop though all the segments and load the images for them setting a callback
      // which will call the draw function of the wheel once all the images have been loaded.
      winwheelToDrawDuringAnimation = this
      winhweelAlreadyDrawn = false

      for (let y = 1; y <= this.options.numSegments; y++) {
        if (this.segments[y].options.image !== null) {
          this.segments[y].options.imgData = new Image()
          this.segments[y].options.imgData.onload = winwheelLoadedImage
          this.segments[y].options.imgData.src = this.segments[y].options.image
        }
      }
    }
  }

  // ====================================================================================================================
  // This function sorts out the segment sizes. Some segments may have set sizes, for the others what is left out of
  // 360 degrees is shared evenly. What this function actually does is set the start and end angle of the arcs.
  // ====================================================================================================================
  updateSegmentSizes() {
    // If this object actually contains some segments
    if (this.segments) {
      // First add up the arc used for the segments where the size has been set.
      let arcUsed = 0
      let numSet = 0

      // Remember, to make it easy to access segments, the position of the segments in the array starts from 1 (not 0).
      for (let x = 1; x <= this.options.numSegments; x++) {
        if (this.segments[x].options.size !== null) {
          arcUsed += this.segments[x].options.size
          numSet++
        }
      }

      let arcLeft = 360 - arcUsed

      // Create variable to hold how much each segment with non-set size will get in terms of degrees.
      let degreesEach = 0

      if (arcLeft > 0) {
        degreesEach = arcLeft / (this.options.numSegments - numSet)
      }

      // ------------------------------------------
      // Now loop though and set the start and end angle of each segment.
      let currentDegree = 0

      for (let x = 1; x <= this.options.numSegments; x++) {
        // Set start angle.
        this.segments[x].startAngle = currentDegree

        // If the size is set then add this to the current degree to get the end, else add the degreesEach to it.
        if (this.segments[x].options.size) {
          currentDegree += this.segments[x].options.size
        } else {
          currentDegree += degreesEach
        }

        // Set end angle.
        this.segments[x].endAngle = currentDegree
      }
    }
  }

  // ====================================================================================================================
  // This function clears the canvas. Will wipe anything else which happens to be drawn on it.
  // ====================================================================================================================
  clearCanvas() {
    if (this.ctx) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    }
  }

  // ====================================================================================================================
  // This function draws / re-draws the wheel on the canvas therefore rendering any changes.
  // ====================================================================================================================
  draw(clearTheCanvas?: boolean) {
    // If have the canvas context.
    if (this.ctx) {
      // Clear the canvas, unless told not to.
      if (clearTheCanvas != undefined) {
        if (clearTheCanvas) this.clearCanvas()
      } else this.clearCanvas

      // Call functions to draw the segments and then segment text.
      if (this.options.drawMode == "image") {
        // Draw the wheel by loading and drawing an image such as a png on the canvas.
        this.drawWheelImage()

        // If we are to draw the text, do so before the overlay is drawn
        // as this allows the overlay to be used to create some interesting effects.
        if (this.options.drawText == true) {
          this.drawSegmentText()
        }

        // If image overlay is true then call function to draw the segments over the top of the image.
        // This is useful during development to check alignment between where the code thinks the segments are and where they appear on the image.
        if (this.options.imageOverlay == true) {
          this.drawSegments()
        }
      } else if (this.options.drawMode == "segmentImage") {
        // Draw the wheel by rendering the image for each segment.
        this.drawSegmentImages()

        // If we are to draw the text, do so before the overlay is drawn
        // as this allows the overlay to be used to create some interesting effects.
        if (this.options.drawText == true) {
          this.drawSegmentText()
        }

        // If image overlay is true then call function to draw the segments over the top of the image.
        // This is useful during development to check alignment between where the code thinks the segments are and where they appear on the image.
        if (this.options.imageOverlay == true) {
          this.drawSegments()
        }
      } else {
        // The default operation is to draw the segments using code via the canvas arc() method.
        this.drawSegments()

        // The text is drawn on top.
        if (this.options.drawText == true) {
          this.drawSegmentText()
        }
      }

      // If this class has pins.
      if (this.pins) {
        // If they are to be visible then draw them.
        if (this.pins.options.visible == true) this.drawPins()
      }

      // If pointer guide is display property is set to true then call function to draw the pointer guide.
      if (this.pointerGuide.options.display == true) {
        this.drawPointerGuide()
      }
    }
  }

  // ====================================================================================================================
  // Draws the pins around the outside of the wheel.
  // ====================================================================================================================
  drawPins() {
    if (this.pins && this.pins.options.number) {
      // Work out the angle to draw each pin a which is simply 360 / the number of pins as they space evenly around.
      let pinSpacing = 360 / this.pins.options.number

      for (let i = 1; i <= this.pins.options.number; i++) {
        this.ctx.save()

        // Set the stroke style and line width.
        this.ctx.strokeStyle = this.pins.options.strokeStyle
        this.ctx.lineWidth = this.pins.options.lineWidth
        this.ctx.fillStyle = this.pins.options.fillStyle

        // Move to the center.
        this.ctx.translate(this.options.centerX, this.options.centerY)

        // Rotate to to the pin location which is i * the pinSpacing.
        this.ctx.rotate(
          this.degToRad(i * pinSpacing + this.options.rotationAngle),
        )

        // Move back out.
        this.ctx.translate(-this.options.centerX, -this.options.centerY)

        // Create a path for the pin circle.
        this.ctx.beginPath()
        // x, y, radius, startAngle, endAngle.
        this.ctx.arc(
          this.options.centerX,
          this.options.centerY -
            this.options.outerRadius +
            this.pins.options.outerRadius +
            this.pins.options.margin,
          this.pins.options.outerRadius,
          0,
          2 * Math.PI,
        )

        if (this.pins.options.fillStyle) this.ctx.fill()

        if (this.pins.options.strokeStyle) this.ctx.stroke()

        this.ctx.restore()
      }
    }
  }

  // ====================================================================================================================
  // Draws a line from the center of the wheel to the outside at the angle where the code thinks the pointer is.
  // ====================================================================================================================
  drawPointerGuide() {
    // If have canvas context.
    if (this.ctx) {
      this.ctx.save()

      // Rotate the canvas to the line goes towards the location of the pointer.
      this.ctx.translate(this.options.centerX, this.options.centerY)
      this.ctx.rotate(this.degToRad(this.options.pointerAngle))
      this.ctx.translate(-this.options.centerX, -this.options.centerY)

      // Set line colour and width.
      this.ctx.strokeStyle = this.pointerGuide.options.strokeStyle
      this.ctx.lineWidth = this.pointerGuide.options.lineWidth

      // Draw from the center of the wheel outwards past the wheel outer radius.
      this.ctx.beginPath()
      this.ctx.moveTo(this.options.centerX, this.options.centerY)
      this.ctx.lineTo(this.options.centerX, -(this.options.outerRadius / 4))

      this.ctx.stroke()
      this.ctx.restore()
    }
  }

  // ====================================================================================================================
  // This function takes an image such as PNG and draws it on the canvas making its center at the centerX and center for the wheel.
  // ====================================================================================================================
  drawWheelImage() {
    // Double check the wheelImage property of this class is not null. This does not actually detect that an image
    // source was set and actually loaded so might get error if this is not the case. This is why the initial call
    // to draw() should be done from a wheelImage.onload callback as detailed in example documentation.
    if (this.options.wheelImage != null) {
      // Work out the correct X and Y to draw the image at. We need to get the center point of the image
      // aligned over the center point of the wheel, we can't just place it at 0, 0.
      let imageLeft =
        this.options.centerX - (this.options.wheelImage.height as number) / 2
      let imageTop =
        this.options.centerY - (this.options.wheelImage.width as number) / 2

      // Rotate and then draw the wheel.
      // We must rotate by the rotationAngle before drawing to ensure that image wheels will spin.
      this.ctx.save()
      this.ctx.translate(this.options.centerX, this.options.centerY)
      this.ctx.rotate(this.degToRad(this.options.rotationAngle))
      this.ctx.translate(-this.options.centerX, -this.options.centerY)

      this.ctx.drawImage(this.options.wheelImage, imageLeft, imageTop)

      this.ctx.restore()
    }
  }
  // ====================================================================================================================
  // This function draws the wheel on the canvas by rendering the image for each segment.
  // ====================================================================================================================
  drawSegmentImages() {
    // Again check have context in case this function was called directly and not via draw function.
    if (this.ctx) {
      // Draw the segments if there is at least one in the segments array.
      if (this.segments) {
        // Loop though and output all segments - position 0 of the array is not used, so start loop from index 1
        // this is to avoid confusion when talking about the first segment.
        for (let x = 1; x <= this.options.numSegments; x++) {
          // Get the segment object as we need it to read options from.
          let seg = this.segments[x]
          let segOptions = seg.options

          // Check image has loaded so a property such as height has a value.
          if (segOptions.imgData.height) {
            // Work out the correct X and Y to draw the image at which depends on the direction of the image.
            // Images can be created in 4 directions. North, South, East, West.
            // North: Outside at top, inside at bottom. Sits evenly over the 0 degrees angle.
            // South: Outside at bottom, inside at top. Sits evenly over the 180 degrees angle.
            // East: Outside at right, inside at left. Sits evenly over the 90 degrees angle.
            // West: Outside at left, inside at right. Sits evenly over the 270 degrees angle.
            let imageLeft = 0
            let imageTop = 0
            let imageAngle = 0
            let imageDirection = ""

            if (segOptions.imageDirection !== null)
              imageDirection = segOptions.imageDirection
            else imageDirection = this.options.imageDirection

            if (imageDirection == "S") {
              // Left set so image sits half/half over the 180 degrees point.
              imageLeft = this.options.centerX - segOptions.imgData.width / 2

              // Top so image starts at the centerY.
              imageTop = this.options.centerY

              // Angle to draw the image is its starting angle + half its size.
              // Here we add 180 to the angle to the segment is poistioned correctly.
              imageAngle =
                seg.startAngle + 180 + (seg.endAngle - seg.startAngle) / 2
            } else if (imageDirection == "E") {
              // Left set so image starts and the center point.
              imageLeft = this.options.centerX

              // Top is so that it sits half/half over the 90 degree point.
              imageTop = this.options.centerY - segOptions.imgData.height / 2

              // Again get the angle in the center of the segment and add it to the rotation angle.
              // this time we need to add 270 to that to the segment is rendered the correct place.
              imageAngle =
                seg.startAngle + 270 + (seg.endAngle - seg.startAngle) / 2
            } else if (imageDirection == "W") {
              // Left is the centerX minus the width of the image.
              imageLeft = this.options.centerX - segOptions.imgData.width

              // Top is so that it sits half/half over the 270 degree point.
              imageTop = this.options.centerY - segOptions.imgData.height / 2

              // Again get the angle in the center of the segment and add it to the rotation angle.
              // this time we need to add 90 to that to the segment is rendered the correct place.
              imageAngle =
                seg.startAngle + 90 + (seg.endAngle - seg.startAngle) / 2
            } // North is the default.
            else {
              // Left set so image sits half/half over the 0 degrees point.
              imageLeft = this.options.centerX - segOptions.imgData.width / 2

              // Top so image is its height out (above) the center point.
              imageTop = this.options.centerY - segOptions.imgData.height

              // Angle to draw the image is its starting angle + half its size.
              // this sits it half/half over the center angle of the segment.
              imageAngle = seg.startAngle + (seg.endAngle - seg.startAngle) / 2
            }

            // --------------------------------------------------
            // Rotate to the position of the segment and then draw the image.
            this.ctx.save()
            this.ctx.translate(this.options.centerX, this.options.centerY)

            // So math here is the rotation angle of the wheel plus half way between the start and end angle of the segment.
            this.ctx.rotate(
              this.degToRad(this.options.rotationAngle + imageAngle),
            )
            this.ctx.translate(-this.options.centerX, -this.options.centerY)

            // Draw the image.
            this.ctx.drawImage(segOptions.imgData, imageLeft, imageTop)

            this.ctx.restore()
          } else {
            console.log("Segment " + x + " imgData is not loaded")
          }
        }
      }
    }
  }

  // ====================================================================================================================
  // This function draws the wheel on the page by rendering the segments on the canvas.
  // ====================================================================================================================
  drawSegments() {
    // Again check have context in case this function was called directly and not via draw function.
    if (this.ctx) {
      // Draw the segments if there is at least one in the segments array.
      if (this.segments) {
        // Loop though and output all segments - position 0 of the array is not used, so start loop from index 1
        // this is to avoid confusion when talking about the first segment.
        for (let x = 1; x <= this.options.numSegments; x++) {
          // Get the segment object as we need it to read options from.
          let seg = this.segments[x]
          let segOptions = seg.options

          let fillStyle
          let lineWidth
          let strokeStyle

          // Set the variables that defined in the segment, or use the default options.
          if (segOptions.fillStyle !== null) fillStyle = segOptions.fillStyle
          else fillStyle = this.options.fillStyle

          this.ctx.fillStyle = fillStyle

          if (segOptions.lineWidth !== null) lineWidth = segOptions.lineWidth
          else lineWidth = this.options.lineWidth

          this.ctx.lineWidth = lineWidth

          if (segOptions.strokeStyle !== null)
            strokeStyle = segOptions.strokeStyle
          else strokeStyle = this.options.strokeStyle

          this.ctx.strokeStyle = strokeStyle

          // Check there is a strokeStyle or fillStyle, if either the the segment is invisible so should not
          // try to draw it otherwise a path is began but not ended.
          if (strokeStyle || fillStyle) {
            // ----------------------------------
            // Begin a path as the segment consists of an arc and 2 lines.
            this.ctx.beginPath()

            // If don't have an inner radius then move to the center of the wheel as we want a line out from the center
            // to the start of the arc for the outside of the wheel when we arc. Canvas will draw the connecting line for us.
            if (!this.options.innerRadius) {
              this.ctx.moveTo(this.options.centerX, this.options.centerY)
            } else {
              //++ do need to draw the starting line in the correct x + y based on the start angle
              //++ otherwise as seen when the wheel does not use up 360 the starting segment is missing the stroked side,
            }

            // Draw the outer arc of the segment clockwise in direction -->
            this.ctx.arc(
              this.options.centerX,
              this.options.centerY,
              this.options.outerRadius,
              this.degToRad(seg.startAngle + this.options.rotationAngle - 90),
              this.degToRad(seg.endAngle + this.options.rotationAngle - 90),
              false,
            )

            if (this.options.innerRadius) {
              // Draw another arc, this time anticlockwise <-- at the innerRadius between the end angle and the start angle.
              // Canvas will draw a connecting line from the end of the outer arc to the beginning of the inner arc completing the shape.
              //++ Think the reason the lines are thinner for 2 of the segments is because the thing auto chops part of it
              //++ when doing the next one. Again think that actually drawing the lines will help.
              this.ctx.arc(
                this.options.centerX,
                this.options.centerY,
                this.options.innerRadius,
                this.degToRad(seg.endAngle + this.options.rotationAngle - 90),
                this.degToRad(seg.startAngle + this.options.rotationAngle - 90),
                true,
              )
            } else {
              // If no inner radius then we draw a line back to the center of the wheel.
              this.ctx.lineTo(this.options.centerX, this.options.centerY)
            }

            // Fill and stroke the segment. Only do either if a style was specified, if the style is null then
            // we assume the developer did not want that particular thing.
            // For example no stroke style so no lines to be drawn.
            if (fillStyle) this.ctx.fill()

            if (strokeStyle) this.ctx.stroke()
          }
        }
      }
    }
  }

  // ====================================================================================================================
  // This draws the text on the segments using the specified text options.
  // ====================================================================================================================
  drawSegmentText() {
    // Again only draw the text if have a canvas context.
    if (this.ctx) {
      // Declare variables to hold the values. These are populated either with the value for the specific segment,
      // or if not specified then the global default value.
      let fontFamily
      let fontSize
      let fontWeight
      let orientation
      let alignment
      let direction
      let margin
      let fillStyle
      let strokeStyle
      let lineWidth
      let fontSetting

      // Loop though all the segments.
      for (let x = 1; x <= this.options.numSegments; x++) {
        // Save the context so it is certain that each segment text option will not affect the other.
        this.ctx.save()

        // Get the segment object as we need it to read options from.
        let seg = this.segments[x]
        let segOptions = seg.options

        // Check is text as no point trying to draw if there is no text to render.
        if (segOptions.text) {
          // Set values to those for the specific segment or use global default if null.
          if (segOptions.textFontFamily !== null)
            fontFamily = segOptions.textFontFamily
          else fontFamily = this.options.textFontFamily
          if (segOptions.textFontSize !== null)
            fontSize = segOptions.textFontSize
          else fontSize = this.options.textFontSize
          if (segOptions.textFontWeight !== null)
            fontWeight = segOptions.textFontWeight
          else fontWeight = this.options.textFontWeight
          if (segOptions.textOrientation !== null)
            orientation = segOptions.textOrientation
          else orientation = this.options.textOrientation
          if (segOptions.textAlignment !== null)
            alignment = segOptions.textAlignment
          else alignment = this.options.textAlignment
          if (segOptions.textDirection !== null)
            direction = segOptions.textDirection
          else direction = this.options.textDirection
          if (segOptions.textMargin !== null) margin = segOptions.textMargin
          else margin = this.options.textMargin
          if (segOptions.textFillStyle !== null)
            fillStyle = segOptions.textFillStyle
          else fillStyle = this.options.textFillStyle
          if (segOptions.textStrokeStyle !== null)
            strokeStyle = segOptions.textStrokeStyle
          else strokeStyle = this.options.textStrokeStyle
          if (segOptions.textLineWidth !== null)
            lineWidth = segOptions.textLineWidth
          else lineWidth = this.options.textLineWidth

          // ------------------------------
          // We need to put the font bits together in to one string.
          fontSetting = ""

          if (fontWeight != null) fontSetting += fontWeight + " "

          if (fontSize != null) fontSetting += fontSize + "px " // Fonts on canvas are always a px value.

          if (fontFamily != null) fontSetting += fontFamily

          // Now set the canvas context to the decided values.
          this.ctx.font = fontSetting
          this.ctx.fillStyle = fillStyle
          this.ctx.strokeStyle = strokeStyle
          this.ctx.lineWidth = lineWidth

          // Split the text in to multiple lines on the \n character.
          let lines = segOptions.text.split("\n")

          // Figure out the starting offset for the lines as when there are multiple lines need to center the text
          // vertically in the segment (when thinking of normal horozontal text).
          let lineOffset = 0 - fontSize * (lines.length / 2) + fontSize / 2

          // The offset works great for horozontal and vertial text, also centered curved. But when the text is curved
          // and the alignment is outer then the multiline text should not have some text outside the wheel. Same if inner curved.
          if (
            orientation == "curved" &&
            (alignment == "inner" || alignment == "outer")
          ) {
            lineOffset = 0
          }

          for (let i = 0; i < lines.length; i++) {
            // ---------------------------------
            // If direction is reversed then do things differently than if normal (which is the default - see further down)
            if (direction == "reversed") {
              // When drawing reversed or 'upside down' we need to do some trickery on our part.
              // The canvas text rendering function still draws the text left to right and the correct way up,
              // so we need to overcome this with rotating the opposite side of the wheel the correct way up then pulling the text
              // through the center point to the correct segment it is supposed to be on.
              if (orientation == "horizontal") {
                if (alignment == "inner") this.ctx.textAlign = "right"
                else if (alignment == "outer") this.ctx.textAlign = "left"
                else this.ctx.textAlign = "center"

                this.ctx.textBaseline = "middle"

                // Work out the angle to rotate the wheel, this is in the center of the segment but on the opposite side of the wheel which is why do -180.
                let textAngle = this.degToRad(
                  seg.endAngle -
                    (seg.endAngle - seg.startAngle) / 2 +
                    this.options.rotationAngle -
                    90 -
                    180,
                )

                this.ctx.save()
                this.ctx.translate(this.options.centerX, this.options.centerY)
                this.ctx.rotate(textAngle)
                this.ctx.translate(-this.options.centerX, -this.options.centerY)

                if (alignment == "inner") {
                  // In reversed state the margin is subtracted from the innerX.
                  // When inner the inner radius also comes in to play.
                  if (fillStyle)
                    this.ctx.fillText(
                      lines[i],
                      this.options.centerX - this.options.innerRadius - margin,
                      this.options.centerY + lineOffset,
                    )

                  if (strokeStyle)
                    this.ctx.strokeText(
                      lines[i],
                      this.options.centerX - this.options.innerRadius - margin,
                      this.options.centerY + lineOffset,
                    )
                } else if (alignment == "outer") {
                  // In reversed state the position is the center minus the radius + the margin for outer aligned text.
                  if (fillStyle)
                    this.ctx.fillText(
                      lines[i],
                      this.options.centerX - this.options.outerRadius + margin,
                      this.options.centerY + lineOffset,
                    )

                  if (strokeStyle)
                    this.ctx.strokeText(
                      lines[i],
                      this.options.centerX - this.options.outerRadius + margin,
                      this.options.centerY + lineOffset,
                    )
                } else {
                  // In reversed state the everything in minused.
                  if (fillStyle)
                    this.ctx.fillText(
                      lines[i],
                      this.options.centerX -
                        this.options.innerRadius -
                        (this.options.outerRadius - this.options.innerRadius) /
                          2 -
                        margin,
                      this.options.centerY + lineOffset,
                    )

                  if (strokeStyle)
                    this.ctx.strokeText(
                      lines[i],
                      this.options.centerX -
                        this.options.innerRadius -
                        (this.options.outerRadius - this.options.innerRadius) /
                          2 -
                        margin,
                      this.options.centerY + lineOffset,
                    )
                }

                this.ctx.restore()
              } else if (orientation == "vertical") {
                // See normal code further down for comments on how it works, this is similar by plus/minus is reversed.
                this.ctx.textAlign = "center"

                // In reversed mode this are reversed.
                if (alignment == "inner") this.ctx.textBaseline = "top"
                else if (alignment == "outer") this.ctx.textBaseline = "bottom"
                else this.ctx.textBaseline = "middle"

                let textAngle =
                  seg.endAngle - (seg.endAngle - seg.startAngle) / 2 - 180
                textAngle += this.options.rotationAngle

                this.ctx.save()
                this.ctx.translate(this.options.centerX, this.options.centerY)
                this.ctx.rotate(this.degToRad(textAngle))
                this.ctx.translate(-this.options.centerX, -this.options.centerY)

                let yPos: number
                if (alignment == "outer")
                  yPos =
                    this.options.centerY + this.options.outerRadius - margin
                else if (alignment == "inner")
                  yPos =
                    this.options.centerY + this.options.innerRadius + margin

                // I have found that the text looks best when a fraction of the font size is shaved off.
                let yInc = fontSize - fontSize / 9

                // Loop though and output the characters.
                if (alignment == "outer") {
                  // In reversed mode outer means text in 6 o'clock segment sits at bottom of the wheel and we draw up.
                  for (let c = lines[i].length - 1; c >= 0; c--) {
                    let character = lines[i].charAt(c)

                    if (fillStyle)
                      this.ctx.fillText(
                        character,
                        this.options.centerX + lineOffset,
                        yPos,
                      )

                    if (strokeStyle)
                      this.ctx.strokeText(
                        character,
                        this.options.centerX + lineOffset,
                        yPos,
                      )

                    yPos -= yInc
                  }
                } else if (alignment == "inner") {
                  // In reversed mode inner text is drawn from top of segment at 6 o'clock position to bottom of the wheel.
                  for (let c = 0; c < lines[i].length; c++) {
                    let character = lines[i].charAt(c)

                    if (fillStyle)
                      this.ctx.fillText(
                        character,
                        this.options.centerX + lineOffset,
                        yPos,
                      )

                    if (strokeStyle)
                      this.ctx.strokeText(
                        character,
                        this.options.centerX + lineOffset,
                        yPos,
                      )

                    yPos += yInc
                  }
                } else if (alignment == "center") {
                  // Again for reversed this is the opposite of before.
                  // If there is more than one character in the text then an adjustment to the position needs to be done.
                  // What we are aiming for is to position the center of the text at the center point between the inner and outer radius.
                  let centerAdjustment = 0

                  if (lines[i].length > 1) {
                    centerAdjustment = (yInc * (lines[i].length - 1)) / 2
                  }

                  let yPos =
                    this.options.centerY +
                    this.options.innerRadius +
                    (this.options.outerRadius - this.options.innerRadius) / 2 +
                    centerAdjustment +
                    margin

                  for (let c = lines[i].length - 1; c >= 0; c--) {
                    let character = lines[i].charAt(c)

                    if (fillStyle)
                      this.ctx.fillText(
                        character,
                        this.options.centerX + lineOffset,
                        yPos,
                      )

                    if (strokeStyle)
                      this.ctx.strokeText(
                        character,
                        this.options.centerX + lineOffset,
                        yPos,
                      )

                    yPos -= yInc
                  }
                }

                this.ctx.restore()
              } else if (orientation == "curved") {
                // There is no built in canvas function to draw text around an arc,
                // so we need to do this ourselves.
                let radius = 0

                // Set the alignment of the text - inner, outer, or center by calculating
                // how far out from the center point of the wheel the text is drawn.
                if (alignment == "inner") {
                  // When alignment is inner the radius is the innerRadius plus any margin.
                  radius = this.options.innerRadius + margin
                  this.ctx.textBaseline = "top"
                } else if (alignment == "outer") {
                  // Outer it is the outerRadius minus any margin.
                  radius = this.options.outerRadius - margin
                  this.ctx.textBaseline = "bottom"

                  // We need to adjust the radius in this case to take in to multiline text.
                  // In this case the radius needs to be further out, not at the inner radius.
                  radius -= fontSize * (lines.length - 1)
                } else if (alignment == "center") {
                  // When center we want the text halfway between the inner and outer radius.
                  radius =
                    this.options.innerRadius +
                    margin +
                    (this.options.outerRadius - this.options.innerRadius) / 2
                  this.ctx.textBaseline = "middle"
                }

                // Set the angle to increment by when looping though and outputting the characters in the text
                // as we do this by rotating the wheel small amounts adding each character.
                let anglePerChar = 0
                let drawAngle = 0

                // If more than one character in the text then...
                if (lines[i].length > 1) {
                  // Text is drawn from the left.
                  this.ctx.textAlign = "left"

                  // Work out how much angle the text rendering loop below needs to rotate by for each character to render them next to each other.
                  // I have discovered that 4 * the font size / 10 at 100px radius is the correct spacing for between the characters
                  // using a monospace font, non monospace may look a little odd as in there will appear to be extra spaces between chars.
                  anglePerChar = 4 * (fontSize / 10)

                  // Work out what percentage the radius the text will be drawn at is of 100px.
                  let radiusPercent = 100 / radius

                  // Then use this to scale up or down the anglePerChar value.
                  // When the radius is less than 100px we need more angle between the letters, when radius is greater (so the text is further
                  // away from the center of the wheel) the angle needs to be less otherwise the characters will appear further apart.
                  anglePerChar = anglePerChar * radiusPercent

                  // Next we want the text to be drawn in the middle of the segment, without this it would start at the beginning of the segment.
                  // To do this we need to work out how much arc the text will take up in total then subtract half of this from the center
                  // of the segment so that it sits centred.
                  let totalArc = anglePerChar * lines[i].length

                  // Now set initial draw angle to half way between the start and end of the segment.
                  drawAngle =
                    seg.startAngle +
                    ((seg.endAngle - seg.startAngle) / 2 - totalArc / 2)
                } else {
                  // The initial draw angle is the center of the segment when only one character.
                  drawAngle =
                    seg.startAngle + (seg.endAngle - seg.startAngle) / 2

                  // To ensure is dead-center the text alignment also needs to be centered.
                  this.ctx.textAlign = "center"
                }

                // ----------------------
                // Adjust the initial draw angle as needed to take in to account the rotationAngle of the wheel.
                drawAngle += this.options.rotationAngle

                // And as with other 'reverse' text direction functions we need to subtract 180 degrees from the angle
                // because when it comes to draw the characters in the loop below we add the radius instead of subtract it.
                drawAngle -= 180

                // ----------------------
                // Now the drawing itself.
                // In reversed direction mode we loop through the characters in the text backwards in order for them to appear on screen correctly
                for (let c = lines[i].length; c >= 0; c--) {
                  this.ctx.save()

                  let character = lines[i].charAt(c)

                  // Rotate the wheel to the draw angle as we need to add the character at this location.
                  this.ctx.translate(this.options.centerX, this.options.centerY)
                  this.ctx.rotate(this.degToRad(drawAngle))
                  this.ctx.translate(
                    -this.options.centerX,
                    -this.options.centerY,
                  )

                  // Now draw the character directly below the center point of the wheel at the appropriate radius.
                  // Note in the reversed mode we add the radius to the this.centerY instead of subtract.
                  if (strokeStyle)
                    this.ctx.strokeText(
                      character,
                      this.options.centerX,
                      this.options.centerY + radius + lineOffset,
                    )

                  if (fillStyle)
                    this.ctx.fillText(
                      character,
                      this.options.centerX,
                      this.options.centerY + radius + lineOffset,
                    )

                  // Increment the drawAngle by the angle per character so next loop we rotate
                  // to the next angle required to draw the character at.
                  drawAngle += anglePerChar

                  this.ctx.restore()
                }
              }
            } else {
              // Normal direction so do things normally.
              // Check text orientation, of horizontal then reasonably straight forward, if vertical then a bit more work to do.
              if (orientation == "horizontal") {
                // Based on the text alignment, set the correct value in the context.
                if (alignment == "inner") this.ctx.textAlign = "left"
                else if (alignment == "outer") this.ctx.textAlign = "right"
                else this.ctx.textAlign = "center"

                // Set this too.
                this.ctx.textBaseline = "middle"

                // Work out the angle around the wheel to draw the text at, which is simply in the middle of the segment the text is for.
                // The rotation angle is added in to correct the annoyance with the canvas arc drawing functions which put the 0 degrees at the 3 oclock
                let textAngle = this.degToRad(
                  seg.endAngle -
                    (seg.endAngle - seg.startAngle) / 2 +
                    this.options.rotationAngle -
                    90,
                )

                // We need to rotate in order to draw the text because it is output horizontally, so to
                // place correctly around the wheel for all but a segment at 3 o'clock we need to rotate.
                this.ctx.save()
                this.ctx.translate(this.options.centerX, this.options.centerY)
                this.ctx.rotate(textAngle)
                this.ctx.translate(-this.options.centerX, -this.options.centerY)

                // --------------------------
                // Draw the text based on its alignment adding margin if inner or outer.
                if (alignment == "inner") {
                  // Inner means that the text is aligned with the inner of the wheel. If looking at a segment in in the 3 o'clock position
                  // it would look like the text is left aligned within the segment.
                  // Because the segments are smaller towards the inner of the wheel, in order for the text to fit is is a good idea that
                  // a margin is added which pushes the text towards the outer a bit.
                  // The inner radius also needs to be taken in to account as when inner aligned.
                  // If fillstyle is set the draw the text filled in.
                  if (fillStyle)
                    this.ctx.fillText(
                      lines[i],
                      this.options.centerX + this.options.innerRadius + margin,
                      this.options.centerY + lineOffset,
                    )

                  // If stroke style is set draw the text outline.
                  if (strokeStyle)
                    this.ctx.strokeText(
                      lines[i],
                      this.options.centerX + this.options.innerRadius + margin,
                      this.options.centerY + lineOffset,
                    )
                } else if (alignment == "outer") {
                  // Outer means the text is aligned with the outside of the wheel, so if looking at a segment in the 3 o'clock position
                  // it would appear the text is right aligned. To position we add the radius of the wheel in to the equation
                  // and subtract the margin this time, rather than add it.
                  // I don't understand why, but in order of the text to render correctly with stroke and fill, the stroke needs to
                  // come first when drawing outer, rather than second when doing inner.
                  if (fillStyle)
                    this.ctx.fillText(
                      lines[i],
                      this.options.centerX + this.options.outerRadius - margin,
                      this.options.centerY + lineOffset,
                    )

                  // If fillstyle the fill the text.
                  if (strokeStyle)
                    this.ctx.strokeText(
                      lines[i],
                      this.options.centerX + this.options.outerRadius - margin,
                      this.options.centerY + lineOffset,
                    )
                } else {
                  // In this case the text is to drawn centred in the segment.
                  // Typically no margin is required, however even though centred the text can look closer to the inner of the wheel
                  // due to the way the segments narrow in (is optical effect), so if a margin is specified it is placed on the inner
                  // side so the text is pushed towards the outer.
                  // If stoke style the stroke the text.
                  if (fillStyle)
                    this.ctx.fillText(
                      lines[i],
                      this.options.centerX +
                        this.options.innerRadius +
                        (this.options.outerRadius - this.options.innerRadius) /
                          2 +
                        margin,
                      this.options.centerY + lineOffset,
                    )

                  // If fillstyle the fill the text.
                  if (strokeStyle)
                    this.ctx.strokeText(
                      lines[i],
                      this.options.centerX +
                        this.options.innerRadius +
                        (this.options.outerRadius - this.options.innerRadius) /
                          2 +
                        margin,
                      this.options.centerY + lineOffset,
                    )
                }

                // Restore the context so that wheel is returned to original position.
                this.ctx.restore()
              } else if (orientation == "vertical") {
                // If vertical then we need to do this ourselves because as far as I am aware there is no option built in to html canvas
                // which causes the text to draw downwards or upwards one character after another.
                // In this case the textAlign is always center, but the baseline is either top or bottom
                // depending on if inner or outer alignment has been specified.
                this.ctx.textAlign = "center"

                if (alignment == "inner") this.ctx.textBaseline = "bottom"
                else if (alignment == "outer") this.ctx.textBaseline = "top"
                else this.ctx.textBaseline = "middle"

                // The angle to draw the text at is halfway between the end and the starting angle of the segment.
                let textAngle =
                  seg.endAngle - (seg.endAngle - seg.startAngle) / 2

                // Ensure the rotation angle of the wheel is added in, otherwise the test placement won't match
                // the segments they are supposed to be for.
                textAngle += this.options.rotationAngle

                // Rotate so can begin to place the text.
                this.ctx.save()
                this.ctx.translate(this.options.centerX, this.options.centerY)
                this.ctx.rotate(this.degToRad(textAngle))
                this.ctx.translate(-this.options.centerX, -this.options.centerY)

                let yPos: number

                // Work out the position to start drawing in based on the alignment.
                // If outer then when considering a segment at the 12 o'clock position want to start drawing down from the top of the wheel.
                if (alignment == "outer")
                  yPos =
                    this.options.centerY - this.options.outerRadius + margin
                else if (alignment == "inner")
                  yPos =
                    this.options.centerY - this.options.innerRadius - margin

                // We need to know how much to move the y axis each time.
                // This is not quite simply the font size as that puts a larger gap in between the letters
                // than expected, especially with monospace fonts. I found that shaving a little off makes it look "right".
                let yInc = fontSize - fontSize / 9

                // Loop though and output the characters.
                if (alignment == "outer") {
                  // For this alignment we draw down from the top of a segment at the 12 o'clock position to simply
                  // loop though the characters in order.
                  for (let c = 0; c < lines[i].length; c++) {
                    let character = lines[i].charAt(c)

                    if (fillStyle)
                      this.ctx.fillText(
                        character,
                        this.options.centerX + lineOffset,
                        yPos,
                      )

                    if (strokeStyle)
                      this.ctx.strokeText(
                        character,
                        this.options.centerX + lineOffset,
                        yPos,
                      )

                    yPos += yInc
                  }
                } else if (alignment == "inner") {
                  // Here we draw from the inner of the wheel up, but in order for the letters in the text text to
                  // remain in the correct order when reading, we actually need to loop though the text characters backwards.
                  for (let c = lines[i].length - 1; c >= 0; c--) {
                    let character = lines[i].charAt(c)

                    if (fillStyle)
                      this.ctx.fillText(
                        character,
                        this.options.centerX + lineOffset,
                        yPos,
                      )

                    if (strokeStyle)
                      this.ctx.strokeText(
                        character,
                        this.options.centerX + lineOffset,
                        yPos,
                      )

                    yPos -= yInc
                  }
                } else if (alignment == "center") {
                  // This is the most complex of the three as we need to draw the text top down centred between the inner and outer of the wheel.
                  // So logically we have to put the middle character of the text in the center then put the others each side of it.
                  // In reality that is a really bad way to do it, we can achieve the same if not better positioning using a
                  // variation on the method used for the rendering of outer aligned text once we have figured out the height of the text.
                  // If there is more than one character in the text then an adjustment to the position needs to be done.
                  // What we are aiming for is to position the center of the text at the center point between the inner and outer radius.
                  let centerAdjustment = 0

                  if (lines[i].length > 1) {
                    centerAdjustment = (yInc * (lines[i].length - 1)) / 2
                  }

                  // Now work out where to start rendering the string. This is half way between the inner and outer of the wheel, with the
                  // centerAdjustment included to correctly position texts with more than one character over the center.
                  // If there is a margin it is used to push the text away from the center of the wheel.
                  let yPos =
                    this.options.centerY -
                    this.options.innerRadius -
                    (this.options.outerRadius - this.options.innerRadius) / 2 -
                    centerAdjustment -
                    margin

                  // Now loop and draw just like outer text rendering.
                  for (let c = 0; c < lines[i].length; c++) {
                    let character = lines[i].charAt(c)

                    if (fillStyle)
                      this.ctx.fillText(
                        character,
                        this.options.centerX + lineOffset,
                        yPos,
                      )

                    if (strokeStyle)
                      this.ctx.strokeText(
                        character,
                        this.options.centerX + lineOffset,
                        yPos,
                      )

                    yPos += yInc
                  }
                }

                this.ctx.restore()
              } else if (orientation == "curved") {
                // There is no built in canvas function to draw text around an arc, so
                // we need to do this ourselves.
                let radius = 0

                // Set the alignment of the text - inner, outer, or center by calculating
                // how far out from the center point of the wheel the text is drawn.
                if (alignment == "inner") {
                  // When alignment is inner the radius is the innerRadius plus any margin.
                  radius = this.options.innerRadius + margin
                  this.ctx.textBaseline = "bottom"

                  // We need to adjust the radius in this case to take in to multiline text.
                  // In this case the radius needs to be further out, not at the inner radius.
                  radius += fontSize * (lines.length - 1)
                } else if (alignment == "outer") {
                  // Outer it is the outerRadius minus any margin.
                  radius = this.options.outerRadius - margin
                  this.ctx.textBaseline = "top"
                } else if (alignment == "center") {
                  // When center we want the text halfway between the inner and outer radius.
                  radius =
                    this.options.innerRadius +
                    margin +
                    (this.options.outerRadius - this.options.innerRadius) / 2
                  this.ctx.textBaseline = "middle"
                }

                // Set the angle to increment by when looping though and outputting the characters in the text
                // as we do this by rotating the wheel small amounts adding each character.
                let anglePerChar = 0
                let drawAngle = 0

                // If more than one character in the text then...
                if (lines[i].length > 1) {
                  // Text is drawn from the left.
                  this.ctx.textAlign = "left"

                  // Work out how much angle the text rendering loop below needs to rotate by for each character to render them next to each other.
                  // I have discovered that 4 * the font size / 10 at 100px radius is the correct spacing for between the characters
                  // using a monospace font, non monospace may look a little odd as in there will appear to be extra spaces between chars.
                  anglePerChar = 4 * (fontSize / 10)

                  // Work out what percentage the radius the text will be drawn at is of 100px.
                  let radiusPercent = 100 / radius

                  // Then use this to scale up or down the anglePerChar value.
                  // When the radius is less than 100px we need more angle between the letters, when radius is greater (so the text is further
                  // away from the center of the wheel) the angle needs to be less otherwise the characters will appear further apart.
                  anglePerChar = anglePerChar * radiusPercent

                  // Next we want the text to be drawn in the middle of the segment, without this it would start at the beginning of the segment.
                  // To do this we need to work out how much arc the text will take up in total then subtract half of this from the center
                  // of the segment so that it sits centred.
                  let totalArc = anglePerChar * lines[i].length

                  // Now set initial draw angle to half way between the start and end of the segment.
                  drawAngle =
                    seg.startAngle +
                    ((seg.endAngle - seg.startAngle) / 2 - totalArc / 2)
                } else {
                  // The initial draw angle is the center of the segment when only one character.
                  drawAngle =
                    seg.startAngle + (seg.endAngle - seg.startAngle) / 2

                  // To ensure is dead-center the text alignment also needs to be centred.
                  this.ctx.textAlign = "center"
                }

                // ----------------------
                // Adjust the initial draw angle as needed to take in to account the rotationAngle of the wheel.
                drawAngle += this.options.rotationAngle

                // ----------------------
                // Now the drawing itself.
                // Loop for each character in the text.
                for (let c = 0; c < lines[i].length; c++) {
                  this.ctx.save()

                  let character = lines[i].charAt(c)

                  // Rotate the wheel to the draw angle as we need to add the character at this location.
                  this.ctx.translate(this.options.centerX, this.options.centerY)
                  this.ctx.rotate(this.degToRad(drawAngle))
                  this.ctx.translate(
                    -this.options.centerX,
                    -this.options.centerY,
                  )

                  // Now draw the character directly above the center point of the wheel at the appropriate radius.
                  if (strokeStyle)
                    this.ctx.strokeText(
                      character,
                      this.options.centerX,
                      this.options.centerY - radius + lineOffset,
                    )

                  if (fillStyle)
                    this.ctx.fillText(
                      character,
                      this.options.centerX,
                      this.options.centerY - radius + lineOffset,
                    )

                  // Increment the drawAngle by the angle per character so next loop we rotate
                  // to the next angle required to draw the character at.
                  drawAngle += anglePerChar

                  this.ctx.restore()
                }
              }
            }

            // Increment this ready for the next time.
            lineOffset += fontSize
          }
        }

        // Restore so all text options are reset ready for the next text.
        this.ctx.restore()
      }
    }
  }

  // ====================================================================================================================
  // Converts degrees to radians which is what is used when specifying the angles on HTML5 canvas arcs.
  // ====================================================================================================================
  degToRad(d: number) {
    return d * 0.0174532925199432957
  }

  // ====================================================================================================================
  // This function sets the center location of the wheel, saves a function call to set x then y.
  // ====================================================================================================================
  setCenter(x: number, y: number) {
    this.options.centerX = x
    this.options.centerY = y
  }

  // ====================================================================================================================
  // This function allows a segment to be added to the wheel. The position of the segment is optional,
  // if not specified the new segment will be added to the end of the wheel.
  // ====================================================================================================================
  addSegment(options: SegmentOptions, position?: number) {
    // Create a new segment object passing the options in.
    const newSegment = new Segment(options)

    // Increment the numSegments property of the class since new segment being added.
    this.options.numSegments++
    let segmentPos: number

    // Work out where to place the segment, the default is simply as a new segment at the end of the wheel.
    if (typeof position !== "undefined") {
      // Because we need to insert the segment at this position, not overwrite it, we need to move all segments after this
      // location along one in the segments array, before finally adding this new segment at the specified location.
      for (let x = this.options.numSegments; x > position; x--) {
        this.segments[x].options = this.segments[x - 1].options
      }

      this.segments[position] = newSegment
      segmentPos = position
    } else {
      this.segments[this.options.numSegments] = newSegment
      segmentPos = this.options.numSegments
    }

    // Since a segment has been added the segment sizes need to be re-computed so call function to do this.
    this.updateSegmentSizes()

    // Return the segment object just created in the wheel (JavaScript will return it by reference), so that
    // further things can be done with it by the calling code if desired.
    return this.segments[segmentPos]
  }

  // ====================================================================================================================
  // This function must be used if the canvasId is changed as we also need to get the context of the new canvas.
  // ====================================================================================================================
  setCanvasId(canvasId) {
    if (canvasId) {
      this.options.canvasId = canvasId
      this.canvas = document.getElementById(
        this.options.canvasId,
      ) as HTMLCanvasElement

      if (this.canvas) {
        this.ctx = this.canvas.getContext("2d")
      }
    } else {
      this.options.canvasId = null
      this.ctx = null
      this.canvas = null
    }
  }

  // ====================================================================================================================
  // This function deletes the specified segment from the wheel by removing it from the segments array.
  // It then sorts out the other bits such as update of the numSegments.
  // ====================================================================================================================
  deleteSegment(position) {
    // There needs to be at least one segment in order for the wheel to draw, so only allow delete if there
    // is more than one segment currently left in the wheel.
    //++ check that specifying a position that does not exist - say 10 in a 6 segment wheel does not cause issues.
    if (this.options.numSegments > 1) {
      // If the position of the segment to remove has been specified.
      if (typeof position !== "undefined") {
        // The array is to be shortened so we need to move all segments after the one
        // to be removed down one so there is no gap.
        for (let x = position; x < this.options.numSegments; x++) {
          this.segments[x].options = this.segments[x + 1].options
        }
      }

      // Unset the last item in the segments array since there is now one less.
      this.segments[this.options.numSegments] = undefined

      // Decrement the number of segments,
      // then call function to update the segment sizes.
      this.options.numSegments--
      this.updateSegmentSizes()
    }
  }

  // ====================================================================================================================
  // This function takes the x an the y of a mouse event, such as click or move, and converts the x and the y in to
  // co-ordinates on the canvas as the raw values are the x and the y from the top and left of the user's browser.
  // ====================================================================================================================
  windowToCanvas(x: number, y: number) {
    let bbox = this.canvas.getBoundingClientRect()

    return {
      x: Math.floor(x - bbox.left * (this.canvas.width / bbox.width)),
      y: Math.floor(y - bbox.top * (this.canvas.height / bbox.height)),
    }
  }

  // ====================================================================================================================
  // This function returns the segment object located at the specified x and y coordinates on the canvas.
  // It is used to allow things to be done with a segment clicked by the user, such as highlight, display or change some values, etc.
  // ====================================================================================================================
  getSegmentAt(x: number, y: number) {
    let foundSegment = null

    // Call function to return segment number.
    let segmentNumber = this.getSegmentNumberAt(x, y)

    // If found one then set found segment to pointer to the segment object.
    if (segmentNumber !== null) {
      foundSegment = this.segments[segmentNumber]
    }

    return foundSegment
  }

  // ====================================================================================================================
  // Returns the number of the segment clicked instead of the segment object.
  // ====================================================================================================================
  getSegmentNumberAt(x: number, y: number) {
    // KNOWN ISSUE: this does not work correct if the canvas is scaled using css, or has padding, border.
    // @TODO see if can find a solution at some point, check windowToCanvas working as needed, then below.
    // Call function above to convert the raw x and y from the user's browser to canvas coordinates
    // i.e. top and left is top and left of canvas, not top and left of the user's browser.
    let loc = this.windowToCanvas(x, y)

    // ------------------------------------------
    // Now start the process of working out the segment clicked.
    // First we need to figure out the angle of an imaginary line between the centerX and centerY of the wheel and
    // the X and Y of the location (for example a mouse click).
    let topBottom
    let leftRight
    let adjacentSideLength
    let oppositeSideLength
    let hypotenuseSideLength

    // We will use right triangle maths with the TAN function.
    // The start of the triangle is the wheel center, the adjacent side is along the x axis, and the opposite side is along the y axis.
    // We only ever use positive numbers to work out the triangle and the center of the wheel needs to be considered as 0 for the numbers
    // in the maths which is why there is the subtractions below. We also remember what quadrant of the wheel the location is in as we
    // need this information later to add 90, 180, 270 degrees to the angle worked out from the triangle to get the position around a 360 degree wheel.
    if (loc.x > this.options.centerX) {
      adjacentSideLength = loc.x - this.options.centerX
      leftRight = "R" // Location is in the right half of the wheel.
    } else {
      adjacentSideLength = this.options.centerX - loc.x
      leftRight = "L" // Location is in the left half of the wheel.
    }

    if (loc.y > this.options.centerY) {
      oppositeSideLength = loc.y - this.options.centerY
      topBottom = "B" // Bottom half of wheel.
    } else {
      oppositeSideLength = this.options.centerY - loc.y
      topBottom = "T" // Top Half of wheel.
    }

    // Now divide opposite by adjacent to get tan value.
    let tanVal = oppositeSideLength / adjacentSideLength

    // Use the tan function and convert results to degrees since that is what we work with.
    let result = (Math.atan(tanVal) * 180) / Math.PI
    let locationAngle = 0

    // We also need the length of the hypotenuse as later on we need to compare this to the outerRadius of the segment / circle.
    hypotenuseSideLength = Math.sqrt(
      oppositeSideLength * oppositeSideLength +
        adjacentSideLength * adjacentSideLength,
    )

    // ------------------------------------------
    // Now to make sense around the wheel we need to alter the values based on if the location was in top or bottom half
    // and also right or left half of the wheel, by adding 90, 180, 270 etc. Also for some the initial locationAngle needs to be inverted.
    if (topBottom == "T" && leftRight == "R") {
      locationAngle = Math.round(90 - result)
    } else if (topBottom == "B" && leftRight == "R") {
      locationAngle = Math.round(result + 90)
    } else if (topBottom == "B" && leftRight == "L") {
      locationAngle = Math.round(90 - result + 180)
    } else if (topBottom == "T" && leftRight == "L") {
      locationAngle = Math.round(result + 270)
    }

    // ------------------------------------------
    // And now we have to adjust to make sense when the wheel is rotated from the 0 degrees either
    // positive or negative and it can be many times past 360 degrees.
    if (this.options.rotationAngle != 0) {
      let rotatedPosition = this.getRotationPosition()

      // So we have this, now we need to alter the locationAngle as a result of this.
      locationAngle = locationAngle - rotatedPosition

      // If negative then take the location away from 360.
      if (locationAngle < 0) {
        locationAngle = 360 - Math.abs(locationAngle)
      }
    }

    // ------------------------------------------
    // OK, so after all of that we have the angle of a line between the centerX and centerY of the wheel and
    // the X and Y of the location on the canvas where the mouse was clicked. Now time to work out the segment
    // this corresponds to. We can use the segment start and end angles for this.
    let foundSegmentNumber = null

    for (let x = 1; x <= this.options.numSegments; x++) {
      // Due to segments sharing start and end angles, if line is clicked will pick earlier segment.
      if (
        locationAngle >= this.segments[x].startAngle &&
        locationAngle <= this.segments[x].endAngle
      ) {
        // To ensure that a click anywhere on the canvas in the segment direction will not cause a
        // segment to be matched, as well as the angles, we need to ensure the click was within the radius
        // of the segment (or circle if no segment radius).
        // If the hypotenuseSideLength (length of location from the center of the wheel) is with the radius
        // then we can assign the segment to the found segment and break out the loop.
        // Have to take in to account hollow wheels (doughnuts) so check is greater than innerRadius as
        // well as less than or equal to the outerRadius of the wheel.
        if (
          hypotenuseSideLength >= this.options.innerRadius &&
          hypotenuseSideLength <= this.options.outerRadius
        ) {
          foundSegmentNumber = x
          break
        }
      }
    }

    // Finally return the number.
    return foundSegmentNumber
  }

  // ====================================================================================================================
  // Returns a reference to the segment that is at the location of the pointer on the wheel.
  // ====================================================================================================================
  getIndicatedSegment() {
    // Call function below to work this out and return the prizeNumber.
    let prizeNumber = this.getIndicatedSegmentNumber()

    // Then simply return the segment in the segments array at that position.
    return this.segments[prizeNumber]
  }

  // ====================================================================================================================
  // Works out the segment currently pointed to by the pointer of the wheel. Normally called when the spinning has stopped
  // to work out the prize the user has won. Returns the number of the segment in the segments array.
  // ====================================================================================================================
  getIndicatedSegmentNumber() {
    let indicatedPrize = 0
    let rawAngle = this.getRotationPosition()

    // Now we have the angle of the wheel, but we need to take in to account where the pointer is because
    // will not always be at the 12 o'clock 0 degrees location.
    let relativeAngle = Math.floor(this.options.pointerAngle - rawAngle)

    if (relativeAngle < 0) {
      relativeAngle = 360 - Math.abs(relativeAngle)
    }

    // Now we can work out the prize won by seeing what prize segment startAngle and endAngle the relativeAngle is between.
    for (let x = 1; x < this.segments.length; x++) {
      if (
        relativeAngle >= this.segments[x].options["startAngle"] &&
        relativeAngle <= this.segments[x].options["endAngle"]
      ) {
        indicatedPrize = x
        break
      }
    }

    return indicatedPrize
  }

  // ==================================================================================================================================================
  // Returns the rotation angle of the wheel corrected to 0-360 (i.e. removes all the multiples of 360).
  // ==================================================================================================================================================
  getRotationPosition() {
    let rawAngle = this.options.rotationAngle // Get current rotation angle of wheel.

    // If positive work out how many times past 360 this is and then take the floor of this off the rawAngle.
    if (rawAngle >= 0) {
      if (rawAngle > 360) {
        // Get floor of the number of times past 360 degrees.
        let timesPast360 = Math.floor(rawAngle / 360)

        // Take all this extra off to get just the angle 0-360 degrees.
        rawAngle = rawAngle - 360 * timesPast360
      }
    } else {
      // Is negative, need to take off the extra then convert in to 0-360 degree value
      // so if, for example, was -90 then final value will be (360 - 90) = 270 degrees.
      if (rawAngle < -360) {
        let timesPast360 = Math.ceil(rawAngle / 360) // Ceil when negative.

        rawAngle = rawAngle - 360 * timesPast360 // Is minus because dealing with negative.
      }

      rawAngle = 360 + rawAngle // Make in the range 0-360. Is plus because raw is still negative.
    }

    return rawAngle
  }

  // ==================================================================================================================================================
  // This function starts the wheel's animation by using the properties of the animation object of of the wheel to begin the a greensock tween.
  // ==================================================================================================================================================
  startAnimation() {
    if (this.animation) {
      // Call function to compute the animation properties.
      this.computeAnimation()

      // Set this global variable to this object as an external function is required to call the draw() function on the wheel
      // each loop of the animation as Greensock cannot call the draw function directly on this class.
      winwheelToDrawDuringAnimation = this

      // Put together the properties of the greesock animation.
      let properties = []
      properties[this.animation.options.propertyName] =
        this.animation.options.propertyValue // Here we set the property to be animated and its value.
      properties["yoyo"] = this.animation.options.yoyo // Set others.
      properties["repeat"] = this.animation.options.repeat
      properties["ease"] = this.animation.options.easing
      properties["onUpdate"] = winwheelAnimationLoop // Call function to re-draw the canvas.
      properties["onComplete"] = winwheelStopAnimation // Call function to perform actions when animation has finished.

      // Do the tween animation passing the properties from the animation object as an array of key => value pairs.
      // Keep reference to the tween object in the wheel as that allows pausing, resuming, and stopping while the animation is still running.
      this.tween = gsap.to(
        this,
        this.animation.options.duration,
        properties as unknown as GSAPTweenVars,
      )
    }
  }

  // ==================================================================================================================================================
  // Use same function function which needs to be outside the class for the callback when it stops because is finished.
  // ==================================================================================================================================================
  stopAnimation(canCallback) {
    // @TODO as part of multiwheel, need to work out how to stop the tween for a single wheel but allow others to continue.
    // We can kill the animation using our tween object.
    if (winwheelToDrawDuringAnimation) {
      winwheelToDrawDuringAnimation.tween.kill()

      // Call the callback function.
      winwheelStopAnimation(canCallback)
    }

    // Ensure the winwheelToDrawDuringAnimation is set to this class.
    winwheelToDrawDuringAnimation = this
  }

  // ==================================================================================================================================================
  // Pause animation by telling tween to pause.
  // ==================================================================================================================================================
  pauseAnimation() {
    if (this.tween) {
      this.tween.pause()
    }
  }

  // ==================================================================================================================================================
  // Resume the animation by telling tween to continue playing it.
  // ==================================================================================================================================================
  resumeAnimation() {
    if (this.tween) {
      this.tween.play()
    }
  }

  // ====================================================================================================================
  // Called at the beginning of the startAnimation function and computes the values needed to do the animation
  // before it starts. This allows the developer to change the animation properties after the wheel has been created
  // and have the animation use the new values of the animation properties.
  // ====================================================================================================================
  computeAnimation() {
    if (this.animation) {
      // Set the animation parameters for the specified animation type including some sensible defaults if values have not been specified.
      if (this.animation.options.type == "spinOngoing") {
        // When spinning the rotationAngle is the wheel property which is animated.
        this.animation.options.propertyName = "rotationAngle"

        if (this.animation.options.spins == null) {
          this.animation.options.spins = 5
        }

        if (this.animation.options.repeat == null) {
          this.animation.options.repeat = -1 // -1 means it will repeat forever.
        }

        if (this.animation.options.easing == null) {
          this.animation.options.easing = "Linear.easeNone"
        }

        if (this.animation.options.yoyo == null) {
          this.animation.options.yoyo = false
        }

        // We need to calculate the propertyValue and this is the spins * 360 degrees.
        this.animation.options.propertyValue =
          this.animation.options.spins * 360

        // If the direction is anti-clockwise then make the property value negative.
        if (this.animation.options.direction == "anti-clockwise") {
          this.animation.options.propertyValue =
            0 - this.animation.options.propertyValue
        }
      } else if (this.animation.options.type == "spinToStop") {
        // Spin to stop the rotation angle is affected.
        this.animation.options.propertyName = "rotationAngle"

        if (this.animation.options.spins == null) {
          this.animation.options.spins = 5
        }

        if (this.animation.options.repeat == null) {
          this.animation.options.repeat = 0 // As this is spin to stop we don't normally want it repeated.
        }

        if (this.animation.options.easing == null) {
          this.animation.options.easing = "Power4.easeOut" // This easing is fast start and slows over time.
        }

        if (this.animation.options.stopAngle == null) {
          // If the stop angle has not been specified then pick random between 0 and 359.
          this.animation._stopAngle = Math.floor(Math.random() * 359)
        } else {
          // We need to set the internal to 360 minus what the user entered because the wheel spins past 0 without
          // this it would indicate the prize on the opposite side of the wheel. We aslo need to take in to account
          // the pointerAngle as the stop angle needs to be relative to that.
          this.animation._stopAngle =
            360 - this.animation.options.stopAngle + this.options.pointerAngle
        }

        if (this.animation.options.yoyo == null) {
          this.animation.options.yoyo = false
        }

        // The property value is the spins * 360 then plus or minus the stopAngle depending on if the rotation is clockwise or anti-clockwise.
        this.animation.options.propertyValue =
          this.animation.options.spins * 360

        if (this.animation.options.direction == "anti-clockwise") {
          this.animation.options.propertyValue =
            0 - this.animation.options.propertyValue

          // Also if the value is anti-clockwise we need subtract the stopAngle (but to get the wheel to stop in the correct
          // place this is 360 minus the stop angle as the wheel is rotating backwards).
          this.animation.options.propertyValue -=
            360 - this.animation._stopAngle
        } else {
          // Add the stopAngle to the propertyValue as the wheel must rotate around to this place and stop there.
          this.animation.options.propertyValue += this.animation._stopAngle
        }
      } else if (this.animation.options.type == "spinAndBack") {
        // This is basically is a spin for a number of times then the animation reverses and goes back to start.
        // If a repeat is specified then this can be used to make the wheel "rock" left and right.
        // Again this is a spin so the rotationAngle the property which is animated.
        this.animation.options.propertyName = "rotationAngle"

        if (this.animation.options.spins == null) {
          this.animation.options.spins = 5
        }

        if (this.animation.options.repeat == null) {
          this.animation.options.repeat = 1 // This needs to be set to at least 1 in order for the animation to reverse.
        }

        if (this.animation.options.easing == null) {
          this.animation.options.easing = "Power2.easeInOut" // This is slow at the start and end and fast in the middle.
        }

        if (this.animation.options.yoyo == null) {
          this.animation.options.yoyo = true // This needs to be set to true to have the animation reverse back like a yo-yo.
        }

        if (this.animation.options.stopAngle == null) {
          this.animation._stopAngle = 0
        } else {
          // We need to set the internal to 360 minus what the user entered
          // because the wheel spins past 0 without this it would indicate the
          // prize on the opposite side of the wheel.
          this.animation._stopAngle = 360 - this.animation.options.stopAngle
        }

        // The property value is the spins * 360 then plus or minus the stopAngle depending on if the rotation is clockwise or anti-clockwise.
        this.animation.options.propertyValue =
          this.animation.options.spins * 360

        if (this.animation.options.direction == "anti-clockwise") {
          this.animation.options.propertyValue =
            0 - this.animation.options.propertyValue

          // Also if the value is anti-clockwise we need subtract the stopAngle (but to get the wheel to stop in the correct
          // place this is 360 minus the stop angle as the wheel is rotating backwards).
          this.animation.options.propertyValue -=
            360 - this.animation._stopAngle
        } else {
          // Add the stopAngle to the propertyValue as the wheel must rotate around to this place and stop there.
          this.animation.options.propertyValue += this.animation._stopAngle
        }
      } else if (this.animation.options.type == "custom") {
        // Do nothing as all values must be set by the developer in the parameters
        // especially the propertyName and propertyValue.
      }
    }
  }

  // ====================================================================================================================
  // Calculates and returns a random stop angle inside the specified segment number. Value will always be 1 degree inside
  // the start and end of the segment to avoid issue with the segment overlap.
  // ====================================================================================================================
  getRandomForSegment(segmentNumber: number) {
    let stopAngle = 0

    if (segmentNumber) {
      if (typeof this.segments[segmentNumber] !== "undefined") {
        let startAngle = this.segments[segmentNumber].startAngle
        let endAngle = this.segments[segmentNumber].endAngle
        let range = endAngle - startAngle - 2

        if (range > 0) {
          stopAngle = startAngle + 1 + Math.floor(Math.random() * range)
        } else {
          console.log(
            "Segment size is too small to safely get random angle inside it",
          )
        }
      } else {
        console.log("Segment " + segmentNumber + " undefined")
      }
    } else {
      console.log("Segment number not specified")
    }

    return stopAngle
  }
}

class Pin {
  options: PinOptions

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
    this.options = { ...this.defaultOptions, ..._options }
  }
}

class Animation {
  options: AnimationOptions
  _stopAngle: number

  private defaultOptions: AnimationOptions = {
    type: "spinOngoing",
    direction: "clockwise",
    propertyName: null,
    propertyValue: null,
    duration: 10,
    yoyo: false,
    repeat: 0,
    easing: "Power3.easeOut",
    stopAngle: null,
    spins: null,
    clearTheCanvas: null,
    callbackFinished: null,
    callbackBefore: null,
    callbackAfter: null,
  }
  constructor(_options?: AnimationOptions) {
    this.options = { ...this.defaultOptions, ..._options }
  }
}

class Segment {
  options: SegmentOptions

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
    this.options = { ...this.defaultOptions, ..._options }
  }
}

class PointerGuide {
  options: PointerGuideOptions

  private defaultOptions = {
    display: false,
    strokeStyle: "red",
    lineWidth: 3,
  }

  constructor(_options?: PointerGuideOptions) {
    this.options = { ...this.defaultOptions, ..._options }
  }
}

// ====================================================================================================================
// This function takes the percent 0-100 and returns the number of degrees 0-360 this equates to.
// ====================================================================================================================
function winwheelPercentToDegrees(percentValue: number) {
  let degrees = 0

  if (percentValue > 0 && percentValue <= 100) {
    let divider = percentValue / 100
    degrees = 360 * divider
  }

  return degrees
}

// ====================================================================================================================
// In order for the wheel to be re-drawn during the spin animation the function greesock calls needs to be outside
// of the class as for some reason it errors if try to call winwheel.draw() directly.
// ====================================================================================================================
function winwheelAnimationLoop() {
  if (winwheelToDrawDuringAnimation) {
    // Check if the clearTheCanvas is specified for this animation, if not or it is not false then clear the canvas.
    if (winwheelToDrawDuringAnimation.animation.clearTheCanvas != false) {
      winwheelToDrawDuringAnimation.ctx.clearRect(
        0,
        0,
        winwheelToDrawDuringAnimation.canvas.width,
        winwheelToDrawDuringAnimation.canvas.height,
      )
    }

    // If there is a callback function which is supposed to be called before the wheel is drawn then do that.
    if (winwheelToDrawDuringAnimation.animation.callbackBefore != null) {
      eval(winwheelToDrawDuringAnimation.animation.callbackBefore)
    }

    // Call code to draw the wheel, pass in false as we never want it to clear the canvas as that would wipe anything drawn in the callbackBefore.
    winwheelToDrawDuringAnimation.draw(false)

    // If there is a callback function which is supposed to be called after the wheel has been drawn then do that.
    if (winwheelToDrawDuringAnimation.animation.callbackAfter != null) {
      eval(winwheelToDrawDuringAnimation.animation.callbackAfter)
    }
  }
}

// ====================================================================================================================
// This function is called-back when the greensock animation has finished.
// ====================================================================================================================
let winwheelToDrawDuringAnimation = null // This global is set by the winwheel class to the wheel object to be re-drawn.

function winwheelStopAnimation(canCallback: boolean) {
  // When the animation is stopped if canCallback is not false then try to call the callback.
  // false can be passed in to stop the after happening if the animation has been stopped before it ended normally.
  if (canCallback != false) {
    if (winwheelToDrawDuringAnimation.animation.callbackFinished != null) {
      eval(winwheelToDrawDuringAnimation.animation.callbackFinished)
    }
  }
}

// ====================================================================================================================
// Called after the image has loaded for each segment. Once all the images are loaded it then calls the draw function
// on the wheel to render it. Used in constructor and also when a segment image is changed.
// ====================================================================================================================
let winhweelAlreadyDrawn = false

function winwheelLoadedImage() {
  // Prevent multiple drawings of the wheel which ocurrs without this check due to timing of function calls.
  if (winhweelAlreadyDrawn == false) {
    // Set to 0.
    let winwheelImageLoadCount = 0

    // Loop though all the segments of the wheel and check if image data loaded, if so increment counter.
    for (let i = 1; i <= winwheelToDrawDuringAnimation.numSegments; i++) {
      // Check the image data object is not null and also that the image has completed loading by checking
      // that a property of it such as the height has some sort of true value.
      if (
        winwheelToDrawDuringAnimation.segments[i].imgData != null &&
        winwheelToDrawDuringAnimation.segments[i].imgData.height
      ) {
        winwheelImageLoadCount++
      }
    }

    // If number of images loaded matches the segments then all the images for the wheel are loaded.
    if (winwheelImageLoadCount == winwheelToDrawDuringAnimation.numSegments) {
      // Call draw function to render the wheel.
      winhweelAlreadyDrawn = true
      winwheelToDrawDuringAnimation.draw()
    }
  }
}
