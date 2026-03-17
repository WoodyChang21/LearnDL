import * as RadioGroup from "@radix-ui/react-radio-group";

const FINE_TUNE_MODE_OPTIONS: Array<{
  label: string;
  value: string;
}> = [
  { label: "Freeze All", value: "freeze_all" },
  { label: "Unfreeze Last N Layers", value: "unfreeze_last_n_layers" },
  { label: "Unfreeze All", value: "unfreeze_all" },
];

type ModelParamsCardProps = {
  model: string;
  epochs: number;
  batchSize: number;
  learningRate: string;
  evaluationFrequency: string;
  fineTune: string;
  onModelChange: (value: string) => void;
  onEpochsChange: (value: number) => void;
  onBatchSizeChange: (value: number) => void;
  onLearningRateChange: (value: string) => void;
  onEvaluationFrequencyChange: (value: string) => void;
  onFineTuneModeChange: (value: string) => void;
};

export function ModelParamsCard({
  model,
  epochs,
  batchSize,
  learningRate,
  evaluationFrequency,
  fineTune,
  onModelChange,
  onEpochsChange,
  onBatchSizeChange,
  onLearningRateChange,
  onEvaluationFrequencyChange,
  onFineTuneModeChange,
}: ModelParamsCardProps) {
  const isEpochsValid = Number.isFinite(epochs) && epochs > 0;
  const isBatchSizeValid = Number.isFinite(batchSize) && batchSize > 0;

    return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <h3 className="font-semibold mb-4">Model Parameters</h3>

      <div className="mb-4">
        <label className="block text-sm text-gray-600 mb-3">Model</label>
        <RadioGroup.Root value={model} onValueChange={onModelChange} className="space-y-2">
          <div className="flex items-center">
            <RadioGroup.Item
              value="bilstm"
              id="bilstm"
              className="size-4 rounded-full border border-gray-300 data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600"
            >
              <RadioGroup.Indicator className="flex items-center justify-center w-full h-full relative after:content-[''] after:block after:size-1.5 after:rounded-full after:bg-white" />
            </RadioGroup.Item>
            <label htmlFor="bilstm" className="ml-2 text-sm">
              Bert Model
            </label>
          </div>
          <div className="flex items-center">
            <RadioGroup.Item
              value="distilbert"
              id="distilbert"
              className="size-4 rounded-full border border-gray-300 data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600"
            >
              <RadioGroup.Indicator className="flex items-center justify-center w-full h-full relative after:content-[''] after:block after:size-1.5 after:rounded-full after:bg-white" />
            </RadioGroup.Item>
            <label htmlFor="distilbert" className="ml-2 text-sm">
              DistilBERT Model
            </label>
          </div>
          {/* <div className="flex items-center">
            <RadioGroup.Item
              value="roberta"
              id="roberta"
              className="size-4 rounded-full border border-gray-300 data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600"
            >
              <RadioGroup.Indicator className="flex items-center justify-center w-full h-full relative after:content-[''] after:block after:size-1.5 after:rounded-full after:bg-white" />
            </RadioGroup.Item>
            <label htmlFor="roberta" className="ml-2 text-sm">
              RoBERTa
            </label>
          </div> */}
        </RadioGroup.Root>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Epochs</label>
          <input
            type="number"
            min={1}
            value={epochs}
            onChange={(event) => onEpochsChange(Number(event.target.value))}
            className={`w-full px-3 py-2 border rounded-lg text-sm ${
              isEpochsValid ? "border-gray-300" : "border-red-500"
            }`}
          />
          {!isEpochsValid && (
            <p className="text-xs text-red-600 mt-1">Please enter a number bigger than 0.</p>
          )}
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Batch size</label>
          <input
            type="number"
            min={1}
            value={batchSize}
            onChange={(event) => onBatchSizeChange(Number(event.target.value))}
            className={`w-full px-3 py-2 border rounded-lg text-sm ${
              isBatchSizeValid ? "border-gray-300" : "border-red-500"
            }`}
          />
          {!isBatchSizeValid && (
            <p className="text-xs text-red-600 mt-1">Please enter a number bigger than 0.</p>
          )}
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Learning rate</label>
          <input
            type="text"
            value={learningRate}
            onChange={(event) => onLearningRateChange(event.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Evaluation frequency</label>
          <input
            type="text"
            min={1}
            value={evaluationFrequency}
            onChange={(event) => onEvaluationFrequencyChange(event.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm">Fine Tune Mode</label>
          <select
            value={fineTune}
            onChange={(event) => onFineTuneModeChange(event.target.value)}
            className="min-w-28 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {FINE_TUNE_MODE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
