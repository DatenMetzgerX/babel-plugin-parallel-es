declare module "babel-code-frame" {
  function codeFrame(
    rawLines: string,
    lineNumber: number,
    colNumber: number,
    options?: {
      highlightCode?: boolean;
      linesAbove?: number;
      linesBelow?: number;
    }
  ): string;

  export = codeFrame;
}
