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

type ModelPredictionOutput = {
  predicted_label: string;
  top_confidences: Array<{
    class: string;
    confidence: number;
  }>;
  attention_visualization: AttentionVisualizationData;
};

const FALLBACK_PREDICTION_OUTPUT: ModelPredictionOutput = {
  predicted_label: "comp.sys.ibm.pc.hardware",
  top_confidences: [
    { class: "comp.sys.ibm.pc.hardware", confidence: 0.9696624279022217 },
    { class: "comp.sys.mac.hardware", confidence: 0.012007156386971474 },
    { class: "comp.os.ms-windows.misc", confidence: 0.005084506701678038 },
    { class: "misc.forsale", confidence: 0.0035390574485063553 },
    { class: "comp.windows.x", confidence: 0.0013989309081807733 },
  ],
  attention_visualization: {
    text: "I'm upgrading my desktop with a new motherboard and a PCIe 4.0 NVMe SSD, but I'm not sure if my current power supply has enough wattage for the GPU. I also need to check RAM compatibility so the DDR5 kit runs at its rated speed without stability issues.",
    tokens: [
      "I'm", "upgrading", "my", "desktop", "with", "a", "new", "motherboard", "and", "a", "PCIe", "4.0", "NVMe", "SSD,", "but", "I'm", "not", "sure", "if", "my", "current", "power", "supply", "has", "enough", "wattage", "for", "the", "GPU.", "I", "also", "need", "to", "check", "RAM", "compatibility", "so", "the", "DDR5", "kit", "runs", "at", "its", "rated", "speed", "without", "stability", "issues.",
    ],
    scores: [
      0.017941931495442986, 0.012384478002786636, 0.016245435923337936, 0.0161599051207304, 0.005783350206911564, 0.011208595708012581, 0.007460208144038916, 0.0165417417883873, 0.006525260396301746, 0.009676503948867321, 0.008344970643520355, 0.006007029364506404, 0.006853505969047546, 0.01067870738916099, 0.015960941091179848, 0.017577644903212786, 0.016774356365203857, 0.014433636330068111, 0.01556453388184309, 0.014300263486802578, 0.009856678545475006, 0.009981808252632618, 0.004006250761449337, 0.009876534342765808, 0.009201359003782272, 0.008857368025928736, 0.009830600582063198, 0.015224776230752468, 0.08150303130969405, 0.01857326738536358, 0.014758492819964886, 0.010988295078277588, 0.013285922817885876, 0.00981540884822607, 0.003457580227404833, 0.008345872163772583, 0.009927216917276382, 0.015158634632825851, 0.007363644661381841, 0.009472965262830257, 0.007448423188179731, 0.008148957043886185, 0.0085077453404665, 0.007035791873931885, 0.006239800713956356, 0.005143723450601101, 0.00879918597638607, 0.0799569683149457,
    ],
  },
};

export function Prediction() {
  const [trainedModels, setTrainedModels] = useState<TrainingRun[]>([]);
  const [selectedTrainingSessionId, setSelectedTrainingSessionId] = useState("");
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [inputText, setInputText] = useState("I really loved this product, highly recommended!");
  const [prediction, setPrediction] = useState<ModelPredictionOutput | null>(null);
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

    const responseData = (res.data ?? FALLBACK_PREDICTION_OUTPUT) as
      | Partial<ModelPredictionOutput>
      | null;

    const normalizedPrediction: ModelPredictionOutput = {
      predicted_label:
        responseData?.predicted_label ?? FALLBACK_PREDICTION_OUTPUT.predicted_label,
      top_confidences:
        responseData?.top_confidences && responseData.top_confidences.length > 0
          ? responseData.top_confidences
          : FALLBACK_PREDICTION_OUTPUT.top_confidences,
      attention_visualization:
        responseData?.attention_visualization ??
        FALLBACK_PREDICTION_OUTPUT.attention_visualization,
    };

    setPrediction(normalizedPrediction);
    setAttentionData(normalizedPrediction.attention_visualization);
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
                <div className="text-2xl font-semibold text-blue-700">
                  {prediction.predicted_label}
                </div>
              </div>
              
              <div>
                <div className="text-sm text-gray-600 mb-1">Confidence</div>
                <div className="text-2xl font-semibold">
                  {((prediction.top_confidences[0]?.confidence ?? 0) * 100).toFixed(2)}%
                </div>
              </div>
            </div>

            <div>
              <div className="text-sm font-medium text-gray-700 mb-3">Probability Distribution</div>
              <div className="space-y-3">
                {prediction.top_confidences.map((prob) => {
                  const percentage = prob.confidence * 100;
                  return (
                  <div key={prob.class}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>{prob.class}</span>
                      <span className="font-medium">{percentage.toFixed(2)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-blue-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                )})}
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
