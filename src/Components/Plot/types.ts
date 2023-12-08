export type StepOptions = {
  drawStyle?: DrawStyle,
  lineInterpolation?: LineInterpolation,
};

export type StepBandSeries = uPlot.Series & StepOptions;

export type UplotOptionsWithStepBand = Omit<uPlot.Options, "series"> & {
  series:  StepBandSeries[],
};

export type PlotProps = {
  id: string,
  title: string,
  data: [xValues: number[], ...yValues: number[][]],
  target: HTMLElement | null,
  widthRef?: number,
  stepOptions?: StepOptions
};

export type PlotData = {
  x: number[],
  y: (number | null | undefined)[] | (number | null | undefined)[][],
  dimension: string
};

export enum LineInterpolation {
  "linear" = 0,
  "stepAfter" = 1,
  "stepBefore" = 2,
  "spline" = 3,
};

export enum DrawStyle {
  "line" = 0,
  "bars" = 1,
  "points" = 2,
  "barsLeft" = 3,
  "barsRight" = 4,
};
