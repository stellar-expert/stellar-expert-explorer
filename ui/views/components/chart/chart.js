//Charts render via the in-house pure-JS SVG engine in @stellar-expert/ui-framework.
//Thin re-export so existing view imports (`import Chart from '.../chart'`) keep working unchanged.
import {Chart, ChartEngine, ChartLoader} from '@stellar-expert/ui-framework'

//ChartEngine exposes the chart constructors and palette/options (e.g. ChartEngine.getOptions().colors[…])
export {ChartLoader, ChartEngine}
//Chart.withErrorBoundary (framework's shared withErrorBoundary) and Chart.Loader are attached as statics
export default Chart
