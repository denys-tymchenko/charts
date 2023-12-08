
import { useEffect, useRef, useState } from 'react';
import Plot from '../Components/Plot';
import { DrawStyle, LineInterpolation, PlotProps, StepOptions } from '../Components/Plot/types';
import { generateRandomDataArray } from '../Components/Plot/utils';

import './style.css';

type PlotDataMap = Map<StepOptions, PlotProps['data']>;

const opts: StepOptions[] = [
  { drawStyle: DrawStyle.line, lineInterpolation: LineInterpolation.stepAfter },
  { drawStyle: DrawStyle.line, lineInterpolation: LineInterpolation.spline },
  { drawStyle: DrawStyle.line },
  { drawStyle: DrawStyle.bars }
];

function App() {
  const [plotData, setPlotData] = useState<PlotDataMap>();

  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const plotData: PlotDataMap = new Map();
    const data = generateRandomDataArray();

    for (const opt of opts) {
      const xValues: number[] = data.map(metric => metric.time);
      const yValues: number[] = data.map(metric => metric.value);
      plotData.set(opt, [xValues, yValues]);
    }

    setPlotData(plotData); 
  }, []);
  
  return (
    <div className="App" ref={wrapperRef}>
      {plotData && [...plotData.entries()].map(([opt, data], i) => (
        <Plot data={data} id='1' title='Date & Value' widthRef={800} target={wrapperRef.current} key={i} stepOptions={opt} />
      ))}
    </div>
  );
}

export default App;
