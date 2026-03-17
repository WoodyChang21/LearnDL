import { useEffect, useState } from "react";
import * as Select from "@radix-ui/react-select";
import { ChevronDown } from "lucide-react";
import {
  predictWithTrainingSession,
  type PredictionConfig,
} from "../api/mlTraining";
import { getCurrentUserId } from "../api/session";
import {
  getUserTrainingSessions,
  type TrainingRun,
} from "../api/trainingSessions";
import {
  AttentionPanel,
  type AttentionVisualizationData,
} from "../components/TrainingVisualizations";

export function Prediction() {
  const [trainedModels, setTrainedModels] = useState<TrainingRun[]>([]);
  const [selectedTrainingSessionId, setSelectedTrainingSessionId] = useState("");
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [inputText, setInputText] = useState("I really loved this product, highly recommended!");
  const [prediction] = useState<{
    label: string;
    confidence: number;
    probabilities: { label: string; value: number }[];
  } | null>(null);
  const [attentionData, setAttentionData] = useState<AttentionVisualizationData | null>(null);
  const selectedTrainingRun =
    trainedModels.find((model) => model.id === selectedTrainingSessionId) || null;

  useEffect(() => {
    let isActive = true;

    const loadTrainingSessions = async () => {
      setIsLoadingSessions(true);
      setSessionsError(null);

      try {
        const sessions = await getUserTrainingSessions();

        if (!isActive) {
          return;
        }

        setTrainedModels(sessions);
        setSelectedTrainingSessionId(sessions[0] ? sessions[0].id : "");
      } catch (error) {
        if (!isActive) {
          return;
        }

        setSessionsError(
          error instanceof Error ? error.message : "Failed to load training sessions."
        );
      } finally {
        if (isActive) {
          setIsLoadingSessions(false);
        }
      }
    };

    void loadTrainingSessions();

    return () => {
      isActive = false;
    };
  }, []);

  const handlePredict = async () => {
    if (!selectedTrainingRun) {
      alert("Please select a training session.");
      return;
    }

    const userId = await getCurrentUserId();
    const predictionConfig: PredictionConfig = {
      classifier_config: {
        model_name: "default",
        hidden_neurons: 512,
        dropout: 0.3,
        num_classes: 2,
        classifier_type: "GRU",
      },
      embed_model_config: {
        embed_model: "bert_model",
        fine_tune_mode: "freeze_all",
        unfreeze_last_n_layers: null,
      },
      training_config: {
        learning_rate: 0.001,
        n_epochs: 1,
        batch_size: 256,
        eval_step: 1,
      },
    };

    const res = await predictWithTrainingSession(
      {
        userId,
        trainingSessionId: selectedTrainingRun.id,
      },
      inputText,
      predictionConfig,
    );
    console.log(res);

    const tokens = inputText
      .split(/\s+/)
      .map((token) => token.trim())
      .filter(Boolean);
    const scores = tokens.map((token, index) => {
      const hasSentimentWord = /(love|great|recommend|bad|worst|terrible|hate)/i.test(token);
      if (hasSentimentWord) {
        return 0.9;
      }
      return Math.max(0.15, 0.45 - index * 0.01);
    });
    setAttentionData({
      text: inputText,
      tokens,
      scores,
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <h1 className="text-3xl mb-8">Prediction</h1>

      {/* Model Selector */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Model</label>
        {isLoadingSessions ? (
          <div className="py-3 text-sm text-gray-500">Loading training sessions...</div>
        ) : trainedModels.length > 0 ? (
          <Select.Root
            value={selectedTrainingSessionId}
            onValueChange={setSelectedTrainingSessionId}
          >
            <Select.Trigger className="w-full px-4 py-3 border border-gray-300 rounded-lg flex items-center justify-between bg-white hover:border-gray-400">
              <Select.Value />
              <Select.Icon>
                <ChevronDown className="size-4" />
              </Select.Icon>
            </Select.Trigger>
            <Select.Portal>
              <Select.Content className="bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-50">
                <Select.Viewport className="p-1">
                  {trainedModels.map((model) => (
                    <Select.Item
                      key={model.id}
                      value={model.id}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer rounded outline-none"
                    >
                      <Select.ItemText>{model.name} ({model.accuracy})</Select.ItemText>
                    </Select.Item>
                  ))}
                </Select.Viewport>
              </Select.Content>
            </Select.Portal>
          </Select.Root>
        ) : (
          <div className="text-sm text-gray-500 py-3">
            {sessionsError ?? "No trained models available. Please train a model first."}
          </div>
        )}
      </div>

      {/* Input Panel */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Input Text</label>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={4}
          placeholder="Enter text to classify..."
        />
        <button
          onClick={handlePredict}
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Predict
        </button>
      </div>

      {/* Results */}
      {prediction && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h3 className="font-semibold mb-4">Prediction Result</h3>
            
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <div className="text-sm text-gray-600 mb-1">Prediction</div>
                <div className={`text-2xl font-semibold ${prediction.label === "Positive" ? "text-green-600" : "text-red-600"}`}>
                  {prediction.label}
                </div>
              </div>
              
              <div>
                <div className="text-sm text-gray-600 mb-1">Confidence</div>
                <div className="text-2xl font-semibold">{prediction.confidence.toFixed(2)}</div>
              </div>
            </div>

            <div>
              <div className="text-sm font-medium text-gray-700 mb-3">Probability Distribution</div>
              <div className="space-y-3">
                {prediction.probabilities.map((prob) => (
                  <div key={prob.label}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>{prob.label}</span>
                      <span className="font-medium">{prob.value}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${prob.label === "Positive" ? "bg-green-500" : "bg-red-500"}`}
                        style={{ width: `${prob.value}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Attention Highlight */}
          {attentionData && <AttentionPanel attention={attentionData} />}
        </div>
      )}
    </div>
  );
}
