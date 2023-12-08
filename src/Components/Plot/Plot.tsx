/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import uPlot from "uplot";
import UplotReact from "uplot-react";
import { DrawStyle, LineInterpolation, PlotProps, UplotOptionsWithStepBand } from "./types";
import { correctPlotData, cursorOpts, dateFormatValues, paths, wheelZoomPlugin } from "./utils";

import "uplot/dist/uPlot.min.css";
import "./style.css";


const Plot = ({
  id,
  title,
  data,
  target,
  widthRef,
  stepOptions = { drawStyle: DrawStyle.line, lineInterpolation: LineInterpolation.stepAfter } 
}: PlotProps) => {
  const [plotData, setPlotData] = useState<uPlot.AlignedData>();
  const [plotDimension, setPlotDimension] = useState<string>("");

  const showPoints =  typeof stepOptions.lineInterpolation !== "number" && stepOptions.drawStyle === DrawStyle.line;

  const options: UplotOptionsWithStepBand = {
    title,
    width: widthRef ? widthRef - 75 : 800,
    height: 400,
    padding: [20, 20, 20, 60],
    cursor: cursorOpts,
    axes: [
      {
        values: dateFormatValues,
      },
      {
        values: (u, val, space) => val.map(v => v),
      }
    ],
    series:
      [
        {
          label: "Date",
          value: "{DD}.{MM}.{YYYY}, {HH}:{mm}:{ss}"
        },
        {
          label: "",
          points: { show: showPoints },
          width: showPoints ? 2 : 1,
          stroke: "#2185D0",
          fill: "#2185D01F",
          value: (u: uPlot, v: number | null) => v === null ? "--" : `${v} ${plotDimension || ""}`,
          paths,
          ...stepOptions
        }
      ],
    plugins: [wheelZoomPlugin()],
    scales: {
      x: { time: true },
    },
  };

  useEffect(() => {
    if (!data) {
      return;
    }
    const newData = correctPlotData(data[0], data[1]);
    setPlotDimension(newData.dimension);

    setPlotData([newData.x, newData.y as (number | null)[]]);
  }, [data]);

  return (
      <UplotReact
        key={`plot_${id}`}
        options={options}
        data={plotData || [[]]}
        target={target ?? undefined}
      />
  );
};

export default Plot;
