  /*mandelbrot-case.js*/(function () {
    let imageWidth;
    function computePixel(x, y) {
      // ...
      return n;
    }function computeMandelbrotLine(y) {
      const line = new Uint8ClampedArray(imageWidth * 4);for (let x = 0; x < imageWidth; ++x) {
        line[x * 4] = computePixel(x, y);
      }return line;
    }
    function _entrycomputeMandelbrotLine() {
      try {
        const _environment = arguments[arguments.length - 1];
        imageWidth = _environment.imageWidth;
        return computeMandelbrotLine.apply(this, arguments);
      } finally {
        imageWidth = undefined;
      }
    }

    slaveFunctionLookupTable.registerStaticFunction({
      identifier: "static:mandelbrot-case.js/_entrycomputeMandelbrotLine",
      _______isFunctionId: true
    }, _entrycomputeMandelbrotLine);
  })();