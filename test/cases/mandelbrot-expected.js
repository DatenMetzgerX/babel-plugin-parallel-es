import parallel from "parallel-es";

const imageWidth = 10000;
const imageHeight = 10000;

function computePixel(x, y) {
    // ...
    return n;
}

function _environmentExtractor() {
    return {
        imageWidth: imageWidth
    };
}

function computeMandelbrotLine(y) {
    const line = new Uint8ClampedArray(imageWidth * 4);
    for (let x = 0; x < imageWidth; ++x) {
        line[x * 4] = computePixel(x, y);
    }
    return line;
}

parallel.range(imageHeight).inEnvironment(_environmentExtractor()).map({
    identifier: "static:mandelbrot-case.js/_entrycomputeMandelbrotLine",
    _______isFunctionId: true
}).then(result => console.log(result));