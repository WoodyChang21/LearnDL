import { useState } from "react";
import * as RadioGroup from "@radix-ui/react-radio-group";
import * as Switch from "@radix-ui/react-switch";
import * as Slider from "@radix-ui/react-slider";
import * as Select from "@radix-ui/react-select";
import * as Tabs from "@radix-ui/react-tabs";
import * as Progress from "@radix-ui/react-progress";
import { ChevronDown, Upload } from "lucide-react";
// import { MetricsView } from "../components/MetricsView";
// import { ConfusionMatrix } from "../components/ConfusionMatrix";
// import { LearningCurve } from "../components/LearningCurve";
// import { AttentionView } from "../components/AttentionView";
// import { EmbeddingView } from "../components/EmbeddingView";

export function Training() {
  const [dataset, setDataset] = useState("imdb");
  const [lowercase, setLowercase] = useState(true);
  const [removePunctuation, setRemovePunctuation] = useState(true);
  const [removeStopwords, setRemoveStopwords] = useState(false);
  const [lemmatization, setLemmatization] = useState(false);
  const [trainSplit, setTrainSplit] = useState([80]);
  const [model, setModel] = useState("distilbert");
  const [modelName, setModelName] = useState("");
  const [epochs, setEpochs] = useState(4);
  const [batchSize, setBatchSize] = useState(32);
  const [learningRate, setLearningRate] = useState("2e-5");
  const [fineTune, setFineTune] = useState(true);
  const [isTraining, setIsTraining] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hasResults, setHasResults] = useState(false);

  const startTraining = () => {
    if (!modelName.trim()) {
      alert("Please enter a model name");
      return;
    }
    
    setIsTraining(true);
    setProgress(0);
    
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsTraining(false);
          setHasResults(true);
          
          // Save trained model to localStorage
          const trainedModel = {
            name: modelName,
            model: model,
            dataset: dataset,
            accuracy: "91.8%",
            date: new Date().toLocaleDateString("en-US", { 
              year: "numeric", 
              month: "short", 
              day: "numeric" 
            }),
            config: {
              epochs,
              batchSize,
              learningRate,
              fineTune,
              trainSplit: trainSplit[0],
              lowercase,
              removePunctuation,
              removeStopwords,
              lemmatization,
            },
          };
          
          const existingModels = JSON.parse(localStorage.getItem("trainedModels") || "[]");
          existingModels.unshift(trainedModel);
          localStorage.setItem("trainedModels", JSON.stringify(existingModels));
          
          return 100;
        }
        return prev + 5;
      });
    }, 200);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Configuration Section - 40% */}
      <div className="mb-8">
        <h1 className="text-3xl mb-6">Training</h1>
        
        {/* Model Name Input */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Model Name</label>
          <input
            type="text"
            value={modelName}
            onChange={(e) => setModelName(e.target.value)}
            placeholder="e.g., IMDB-DistilBERT-v1"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">Give your model a unique name for easy identification</p>
        </div>
        
        <div className="grid grid-cols-3 gap-6 mb-6">
          {/* Card 1: Dataset */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h3 className="font-semibold mb-4">Dataset</h3>
            
            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-2">Select Dataset</label>
              <Select.Root value={dataset} onValueChange={setDataset}>
                <Select.Trigger className="w-full px-3 py-2 border border-gray-300 rounded-lg flex items-center justify-between bg-white hover:border-gray-400">
                  <Select.Value />
                  <Select.Icon>
                    <ChevronDown className="size-4" />
                  </Select.Icon>
                </Select.Trigger>
                <Select.Portal>
                  <Select.Content className="bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                    <Select.Viewport className="p-1">
                      <Select.Item value="imdb" className="px-3 py-2 hover:bg-gray-100 cursor-pointer rounded outline-none">
                        <Select.ItemText>IMDB Sentiment</Select.ItemText>
                      </Select.Item>
                      <Select.Item value="sms" className="px-3 py-2 hover:bg-gray-100 cursor-pointer rounded outline-none">
                        <Select.ItemText>SMS Spam</Select.ItemText>
                      </Select.Item>
                      <Select.Item value="agnews" className="px-3 py-2 hover:bg-gray-100 cursor-pointer rounded outline-none">
                        <Select.ItemText>AG News</Select.ItemText>
                      </Select.Item>
                      <Select.Item value="csv" className="px-3 py-2 hover:bg-gray-100 cursor-pointer rounded outline-none">
                        <Select.ItemText>Upload CSV</Select.ItemText>
                      </Select.Item>
                    </Select.Viewport>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>
            </div>

            {dataset === "csv" && (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center mb-4 hover:border-gray-400 cursor-pointer">
                <Upload className="size-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
              </div>
            )}

            <div>
              <label className="block text-sm text-gray-600 mb-2">Sample Preview</label>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left">Text</th>
                      <th className="px-3 py-2 text-left">Label</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-gray-200">
                      <td className="px-3 py-2 text-xs">This movie was amazing</td>
                      <td className="px-3 py-2 text-xs">Positive</td>
                    </tr>
                    <tr className="border-t border-gray-200">
                      <td className="px-3 py-2 text-xs">Worst acting ever</td>
                      <td className="px-3 py-2 text-xs">Negative</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Card 2: Preprocessing */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h3 className="font-semibold mb-4">Preprocessing</h3>
            
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between">
                <label className="text-sm">Lowercase</label>
                <Switch.Root
                  checked={lowercase}
                  onCheckedChange={setLowercase}
                  className="w-11 h-6 bg-gray-200 rounded-full data-[state=checked]:bg-blue-600 relative transition-colors"
                >
                  <Switch.Thumb className="block size-5 bg-white rounded-full shadow-sm transition-transform translate-x-0.5 data-[state=checked]:translate-x-[22px]" />
                </Switch.Root>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm">Remove punctuation</label>
                <Switch.Root
                  checked={removePunctuation}
                  onCheckedChange={setRemovePunctuation}
                  className="w-11 h-6 bg-gray-200 rounded-full data-[state=checked]:bg-blue-600 relative transition-colors"
                >
                  <Switch.Thumb className="block size-5 bg-white rounded-full shadow-sm transition-transform translate-x-0.5 data-[state=checked]:translate-x-[22px]" />
                </Switch.Root>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm">Remove stopwords</label>
                <Switch.Root
                  checked={removeStopwords}
                  onCheckedChange={setRemoveStopwords}
                  className="w-11 h-6 bg-gray-200 rounded-full data-[state=checked]:bg-blue-600 relative transition-colors"
                >
                  <Switch.Thumb className="block size-5 bg-white rounded-full shadow-sm transition-transform translate-x-0.5 data-[state=checked]:translate-x-[22px]" />
                </Switch.Root>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm">Lemmatization</label>
                <Switch.Root
                  checked={lemmatization}
                  onCheckedChange={setLemmatization}
                  className="w-11 h-6 bg-gray-200 rounded-full data-[state=checked]:bg-blue-600 relative transition-colors"
                >
                  <Switch.Thumb className="block size-5 bg-white rounded-full shadow-sm transition-transform translate-x-0.5 data-[state=checked]:translate-x-[22px]" />
                </Switch.Root>
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-600 mb-3 block">
                Train/Val Split: {trainSplit[0]}/{100 - trainSplit[0]}
              </label>
              <Slider.Root
                value={trainSplit}
                onValueChange={setTrainSplit}
                min={50}
                max={95}
                step={5}
                className="relative flex items-center w-full h-5"
              >
                <Slider.Track className="relative grow h-1 bg-gray-200 rounded-full">
                  <Slider.Range className="absolute h-full bg-blue-600 rounded-full" />
                </Slider.Track>
                <Slider.Thumb className="block size-4 bg-blue-600 rounded-full shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </Slider.Root>
            </div>
          </div>

          {/* Card 3: Model & Hyperparameters */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h3 className="font-semibold mb-4">Model & Hyperparameters</h3>
            
            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-3">Model</label>
              <RadioGroup.Root value={model} onValueChange={setModel} className="space-y-2">
                <div className="flex items-center">
                  <RadioGroup.Item
                    value="bilstm"
                    id="bilstm"
                    className="size-4 rounded-full border border-gray-300 data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600"
                  >
                    <RadioGroup.Indicator className="flex items-center justify-center w-full h-full relative after:content-[''] after:block after:size-1.5 after:rounded-full after:bg-white" />
                  </RadioGroup.Item>
                  <label htmlFor="bilstm" className="ml-2 text-sm">BiLSTM + GloVe</label>
                </div>
                <div className="flex items-center">
                  <RadioGroup.Item
                    value="distilbert"
                    id="distilbert"
                    className="size-4 rounded-full border border-gray-300 data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600"
                  >
                    <RadioGroup.Indicator className="flex items-center justify-center w-full h-full relative after:content-[''] after:block after:size-1.5 after:rounded-full after:bg-white" />
                  </RadioGroup.Item>
                  <label htmlFor="distilbert" className="ml-2 text-sm">DistilBERT</label>
                </div>
                <div className="flex items-center">
                  <RadioGroup.Item
                    value="roberta"
                    id="roberta"
                    className="size-4 rounded-full border border-gray-300 data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600"
                  >
                    <RadioGroup.Indicator className="flex items-center justify-center w-full h-full relative after:content-[''] after:block after:size-1.5 after:rounded-full after:bg-white" />
                  </RadioGroup.Item>
                  <label htmlFor="roberta" className="ml-2 text-sm">RoBERTa</label>
                </div>
              </RadioGroup.Root>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Epochs</label>
                <input
                  type="number"
                  value={epochs}
                  onChange={(e) => setEpochs(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-600 mb-1">Batch size</label>
                <input
                  type="number"
                  value={batchSize}
                  onChange={(e) => setBatchSize(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-600 mb-1">Learning rate</label>
                <input
                  type="text"
                  value={learningRate}
                  onChange={(e) => setLearningRate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm">Fine-tune embeddings</label>
                <Switch.Root
                  checked={fineTune}
                  onCheckedChange={setFineTune}
                  className="w-11 h-6 bg-gray-200 rounded-full data-[state=checked]:bg-blue-600 relative transition-colors"
                >
                  <Switch.Thumb className="block size-5 bg-white rounded-full shadow-sm transition-transform translate-x-0.5 data-[state=checked]:translate-x-[22px]" />
                </Switch.Root>
              </div>
            </div>
          </div>
        </div>

        {/* Train Button */}
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={startTraining}
            disabled={isTraining}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isTraining ? "Training..." : "Start Training"}
          </button>

          {isTraining && (
            <div className="w-full max-w-md">
              <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Training Progress</span>
                  <span className="text-sm font-medium">{progress}%</span>
                </div>
                <Progress.Root className="relative overflow-hidden bg-gray-200 rounded-full h-2">
                  <Progress.Indicator
                    className="bg-blue-600 h-full transition-transform duration-300 ease-in-out"
                    style={{ transform: `translateX(-${100 - progress}%)` }}
                  />
                </Progress.Root>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results Section - 60% */}
      {hasResults && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h2 className="text-2xl mb-6">Results</h2>
          
          <Tabs.Root defaultValue="metrics">
            <Tabs.List className="flex gap-2 border-b border-gray-200 mb-6">
              <Tabs.Trigger
                value="metrics"
                className="px-4 py-2 text-sm data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 -mb-px"
              >
                Metrics
              </Tabs.Trigger>
              <Tabs.Trigger
                value="confusion"
                className="px-4 py-2 text-sm data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 -mb-px"
              >
                Confusion Matrix
              </Tabs.Trigger>
              <Tabs.Trigger
                value="curve"
                className="px-4 py-2 text-sm data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 -mb-px"
              >
                Learning Curve
              </Tabs.Trigger>
              <Tabs.Trigger
                value="attention"
                className="px-4 py-2 text-sm data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 -mb-px"
              >
                Attention
              </Tabs.Trigger>
              <Tabs.Trigger
                value="embeddings"
                className="px-4 py-2 text-sm data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 -mb-px"
              >
                Embeddings
              </Tabs.Trigger>
            </Tabs.List>

            {/* <Tabs.Content value="metrics">
              <MetricsView />
            </Tabs.Content>

            <Tabs.Content value="confusion">
              <ConfusionMatrix />
            </Tabs.Content>

            <Tabs.Content value="curve">
              <LearningCurve />
            </Tabs.Content>

            <Tabs.Content value="attention">
              <AttentionView />
            </Tabs.Content>

            <Tabs.Content value="embeddings">
              <EmbeddingView />
            </Tabs.Content> */}
          </Tabs.Root>
        </div>
      )}
    </div>
  );
}