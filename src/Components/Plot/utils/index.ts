import uPlot, { Cursor } from "uplot";
import { DrawStyle, LineInterpolation, PlotData, StepBandSeries } from "../types";

const { linear, stepped, bars, spline } = uPlot.paths;

const lineInterpolations: Record<LineInterpolation, uPlot.Series.PathBuilder | undefined> = {
  [LineInterpolation.linear]: linear?.(),
  [LineInterpolation.stepAfter]: stepped?.({ align: 1 }),
  [LineInterpolation.stepBefore]: stepped?.({ align: -1 }),
  [LineInterpolation.spline]: spline?.()
};

const getPathRender = (style: DrawStyle, lineInterpolation?: LineInterpolation | null ): uPlot.Series.PathBuilder | null | undefined => {

  const styleRender: Record<DrawStyle, uPlot.Series.PathBuilder | undefined> = {
    [DrawStyle.bars]: bars?.({ size: [0.6, 100] }),
    [DrawStyle.barsLeft]: bars?.({ size: [1], align: 1 }),
    [DrawStyle.barsRight]: bars?.({ size: [1], align: -1 }),
    [DrawStyle.line]: lineInterpolation ? lineInterpolations[lineInterpolation] : undefined,
    [DrawStyle.points]: undefined,
  };
  
  return styleRender[style];
};

export function paths(u: uPlot, seriesIdx: number, idx0: number, idx1: number): uPlot.Series.Paths | null {
  const s = u.series[seriesIdx] as StepBandSeries;
  const style = s.drawStyle;
  const interp = s.lineInterpolation;

  if (typeof style !== "number") return null;

  const renderer = getPathRender(style, interp);

  return renderer?.(u, seriesIdx, idx0, idx1) ?? null;
}

function clamp(nRange: number | undefined, nMin: number | undefined, nMax: number | undefined, fRange: number | undefined, fMin: number | undefined, fMax: number | undefined) {
  if (!nRange || !nMin || !nMax || !fRange || !fMin || !fMax) {
    return [];
  }
  if (nRange > fRange) {
    nMin = fMin;
    nMax = fMax;
  }
  else if (nMin < fMin) {
    nMin = fMin;
    nMax = fMin + nRange;
  }
  else if (nMax > fMax) {
    nMax = fMax;
    nMin = fMax - nRange;
  }

  return [nMin, nMax];
}

export function wheelZoomPlugin(factor: number = 0.75) {
  let xMin: number;
  let xMax: number;
  let yMin: number;
  let yMax: number;
  let xRange: number;
  let yRange: number;

  return {
    hooks: {
      ready: (u: uPlot) => {
        xMin = u.scales.x.min as number;
        xMax = u.scales.x.max as number;
        yMin = u.scales.y.min as number;
        yMax = u.scales.y.max as number;

        xRange = xMax - xMin;
        yRange = yMax - yMin;

        const over = u.over;

        const scXMin0 = u.scales.x.min as number;
        const scXMax0 = u.scales.x.max as number;
        let left0: number;

        const xUnitsPerPx = u.posToVal(1, "x") - u.posToVal(0, "x");

        function onup(e: MouseEvent) {
          document.removeEventListener("mousemove", onmove);
          document.removeEventListener("mouseup", onup);
        }

        function onmove(e: MouseEvent) {
          e.preventDefault();

          const left1 = e.clientX;

          const dx = xUnitsPerPx * (left1 - left0);

          u.setScale("x", {
            min: scXMin0 - dx,
            max: scXMax0 - dx,
          });
        }

        // wheel drag pan
        over.addEventListener("mousedown", e => {
          if (e.button === 1) {
            e.preventDefault();

            left0 = e.clientX;

            document.addEventListener("mousemove", onmove);
            document.addEventListener("mouseup", onup);
          }
        });

        // wheel scroll zoom
        over.addEventListener("wheel", e => {
          e.preventDefault();

          const { left, top } = u.cursor;

          const rect = over.getBoundingClientRect();

          const leftPct = left as number / rect.width;
          const btmPct = 1 - (top as number) / rect.height;
          const xVal = u.posToVal(left as number, "x");
          const yVal = u.posToVal(top as number, "y");

          const oxRange = (u.scales.x.max as number) - (u.scales.x.min as number);
          const oyRange = (u.scales.y.max as number) - (u.scales.y.min as number);

          const nxRange = e.deltaY < 0 ? oxRange * factor : oxRange / factor;
          let nxMin = xVal - leftPct * nxRange;
          let nxMax = nxMin + nxRange;

          [nxMin, nxMax] = clamp(nxRange, nxMin, nxMax, xRange, xMin, xMax);

          const nyRange = e.deltaY < 0 ? oyRange * factor : oyRange / factor;
          let nyMin = yVal - btmPct * nyRange;
          let nyMax = nyMin + nyRange;

          [nyMin, nyMax] = clamp(nyRange, nyMin, nyMax, yRange, yMin, yMax);

          u.batch(() => {
            u.setScale("x", {
              min: nxMin,
              max: nxMax,
            });

            u.setScale("y", {
              min: nyMin,
              max: nyMax,
            });
          });
        });
      }
    }
  };
}

export const dateFormatValues = [
  // tick incr        default           year                                  month    day                            hour     min                sec          mode
  [3600 * 24 * 365,   "{YYYY}",         null,                                 null,    null,                          null,    null,              null,        1],
  [3600 * 24 * 28,    "{MMM}",          "\n{YYYY}",                           null,    null,                          null,    null,              null,        1],
  [3600 * 24,         "{DD}.{MM}",      "\n{YYYY}",                           null,    null,                          null,    null,              null,        1],
  [3600,              "{HH}:{mm}",      "\n{DD}.{MM}.{YYYY}",                 null,    "\n{DD}.{MM}",                 null,    null,              null,        1],
  [60,                "{HH}:{mm}",      "\n{DD}.{MM}.{YYYY}",                 null,    "\n{DD}.{MM}",                 null,    null,              null,        1],
  [1,                 "{HH}:{mm}:{ss}", "\n{DD}.{MM}.{YYYY}",                 null,    "\n{DD}.{MM}, {HH}:{mm}",      null,    null,              null,        1],
  [0.001,             ":{ss}.{fff}",    "\n{DD}.{MM}.{YYYY}, {HH}:{mm}",      null,    "\n{DD}.{MM}, {HH}:{mm}",      null,    "\n{HH}:{mm}",     null,        1],
];

const mooSync = uPlot.sync("moo");

const matchSyncKeys = (own: string | null, ext: string | null) => own === ext;

function upDownFilter(type: string) {
  return type !== "mouseup" && type !== "mousedown";
}

export const cursorOpts: Cursor = {
  lock: true,
  focus: {
    prox: 16,
  },
  sync: {
    key: mooSync.key,
    setSeries: true,
    match: [matchSyncKeys, matchSyncKeys],
    filters: {
      pub: upDownFilter,
    }
  },
};

export function correctPlotData(xValues: number[], yValues: number[]): PlotData {
  const plotData: PlotData = {
    x: xValues,
    y: yValues,
    dimension: ""
  };

  return plotData;
}

export function generateRandomDataArray(): { time: number, value: number }[] {
  const startDate = new Date(Date.now() - 365 * 24 * 3600 * 1000);
  
  const dataArray = [];

  for (let i = 0; i < 365; i++) {
    const timestamp = (startDate.getTime() + ((i + 4) * 60 * 60 * 24 * 1000)) / 1000;
    const randomValue = Math.floor(Math.random() * 11000) - 100;

    dataArray.push({
      time: timestamp,
      value: randomValue,
    });
  }

  return dataArray;
}
