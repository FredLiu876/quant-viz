import LineChart from "./features/price-chart/components/PriceChart";
import PythonEditorRunner from "./features/editor/components/PythonEditorRunner";

export default function App() {
  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4">
      <LineChart/>
      <PythonEditorRunner />
    </div>
  );
}
