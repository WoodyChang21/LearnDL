import { useEffect, useMemo, useRef, useState } from "react";
import * as Progress from "@radix-ui/react-progress";
import { Upload } from "lucide-react";
import Papa from "papaparse";

import mlClient from "../api/mlClient";
import { ClassfierCard } from "../components/ClassfierCard";
import { ModelParamsCard } from "../components/ModelParamsCard";
import { PreprocessingCard } from "../components/PreprocessingCard";
import { SelectedCard, type SelectedCardOption } from "../components/SelectedCard";
import { TrainingResult } from "../components/TrainingResult";
import type { Dataset, TextHandlingMode } from "../type";

type PreviewRow = {
  text: string;
  label: string;
};

const PREVIEW_TEXT_LIMIT = 200;

const DEFAULT_DATASETS: Dataset[] = [
  {
    id: "imdb",
    label: "IMDB Sentiment",
    type: "default",
    url: import.meta.env.VITE_IMDB_DATASET_URL,
  },
  {
    id: "sms",
    label: "SMS Spam",
    type: "default",
    url: import.meta.env.VITE_SMS_DATASET_URL,
  },
  {
    id: "agnews",
    label: "AG News",
    type: "default",
    url: import.meta.env.VITE_AGNEWS_DATASET_URL,
  },
  {
    id: "upload",
    label: "Upload CSV",
    type: "upload",
  },
];

const getUploadedFile = (dataset: Dataset | null) =>
  dataset?.type === "uploaded" ? dataset.file ?? null : null;

const getDatasetUrl = (dataset: Dataset | null) =>
  dataset?.type === "default" ? dataset.url ?? null : null;

export function Training() {
  const [isTraining, setIsTraining] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hasResults] = useState(false);

  const [modelName, setModelName] = useState("");

  const [datasets, setDatasets] = useState<Dataset[]>(DEFAULT_DATASETS);
  const [selectedDatasetId, setSelectedDatasetId] = useState(DEFAULT_DATASETS[0].id);
  const [previewData, setPreviewData] = useState<PreviewRow[]>([]);

  const [lowercase, setLowercase] = useState(true);
  const [removePunctuation, setRemovePunctuation] = useState(true);
  const [removeStopwords, setRemoveStopwords] = useState(false);
  const [lemmatization, setLemmatization] = useState(false);
  const [trainSplit, setTrainSplit] = useState([80]);
  const [stratifiedSplut, setStratifiedSplit] = useState(false);
  const [handleURLs, setHandleURLs] = useState<TextHandlingMode>("keep");
  const [handleEmails, setHandleEmails] = useState<TextHandlingMode>("keep");

  const [model, setModel] = useState("distilbert");
  const [epochs, setEpochs] = useState(4);
  const [batchSize, setBatchSize] = useState(32);
  const [learningRate, setLearningRate] = useState("2e-5");
  const [evaluationFrequency, setEvaluationFrequency] = useState("1");
  const [fineTune, setFineTune] = useState(true);
  const [classifierType, setClassifierType] = useState("GRU");
  const [hiddenNeurons, setHiddenNeurons] = useState(512);
  const [classifierDropout, setClassifierDropout] = useState([30]);

  const [isCanceling, setIsCanceling] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const datasetOptions = useMemo<SelectedCardOption[]>(
    () => datasets.map((dataset) => ({ value: dataset.id, label: dataset.label })),
    [datasets],
  );

  const selectedDataset = useMemo(
    () => datasets.find((dataset) => dataset.id === selectedDatasetId) ?? null,
    [datasets, selectedDatasetId],
  );

  const canStartTraining =
    !!selectedDataset &&
    selectedDataset.type !== "upload" &&
    (selectedDataset.type !== "uploaded" || !!selectedDataset.file);

  const formatPreviewText = (text: string) => {
    const compactText = text.replace(/\s+/g, " ").trim();

    if (compactText.length <= PREVIEW_TEXT_LIMIT) {
      return compactText;
    }

    return `${compactText.slice(0, PREVIEW_TEXT_LIMIT)}......`;
  };

  const normalizePreviewRows = (rows: unknown[]): PreviewRow[] => {
    const textKeys = ["text", "review", "input", "message", "content", "sentence"];
    const labelKeys = ["label", "sentiment", "output", "class", "category", "target"];

    return rows
      .map((row) => {
        if (!row || typeof row !== "object" || Array.isArray(row)) {
          return null;
        }

        const entries = Object.entries(row as Record<string, unknown>);
        if (entries.length === 0) {
          return null;
        }

        const normalizedEntries = entries.map(([key, value]) => ({
          normalizedKey: key.trim().toLowerCase().replace(/[\s_-]+/g, ""),
          value,
        }));

        const primitiveEntries = normalizedEntries.filter(
          (entry) => typeof entry.value === "string" || typeof entry.value === "number",
        );

        const findPreferredEntry = (preferredKeys: string[]) =>
          normalizedEntries.find((entry) => preferredKeys.includes(entry.normalizedKey));

        const textEntry = findPreferredEntry(textKeys) ?? primitiveEntries[0];
        const labelEntry =
          findPreferredEntry(labelKeys) ??
          primitiveEntries.find((entry) => entry !== textEntry);

        const text = textEntry ? String(textEntry.value ?? "").trim() : "";
        const label = labelEntry ? String(labelEntry.value ?? "").trim() : "";

        if (!text && !label) {
          return null;
        }

        return { text, label };
      })
      .filter((row): row is PreviewRow => row !== null);
  };

  const parsePreview = (source: File | string) =>
    new Promise<PreviewRow[]>((resolve, reject) => {
      Papa.parse(source, {
        header: true,
        preview: 5,
        complete: (results) => {
          resolve(normalizePreviewRows(Array.isArray(results.data) ? results.data : []));
        },
        error: reject,
      });
    });

  const loadPreview = async (dataset: Dataset): Promise<PreviewRow[]> => {
    if (dataset.type === "default") {
      if (!dataset.url) {
        return [];
      }

      const response = await fetch(dataset.url);
      if (!response.ok) {
        throw new Error(`Failed to fetch dataset preview (${response.status})`);
      }

      const csvText = await response.text();
      return parsePreview(csvText);
    }

    if (dataset.type === "uploaded" && dataset.file) {
      return parsePreview(dataset.file);
    }

    return [];
  };

  useEffect(() => {
    if (!selectedDataset || selectedDataset.type === "upload") {
      setPreviewData([]);
      return;
    }

    let isActive = true;

    const loadSelectedDatasetPreview = async () => {
      try {
        const nextPreviewRows = await loadPreview(selectedDataset);
        if (isActive) {
          setPreviewData(nextPreviewRows);
        }
      } catch (error) {
        console.error("Failed to load dataset preview", error);
        if (isActive) {
          setPreviewData([]);
        }
      }
    };

    void loadSelectedDatasetPreview();

    return () => {
      isActive = false;
    };
  }, [selectedDataset]);

  const handleDatasetSelection = (datasetId: string) => {
    const dataset = datasets.find((item) => item.id === datasetId);
    if (!dataset) {
      return;
    }

    if (dataset.type === "upload") {
      setSelectedDatasetId(dataset.id);
      setPreviewData([]);
      fileInputRef.current?.click();
      return;
    }

    setSelectedDatasetId(dataset.id);
  };

  const handleFileUpload = (file: File) => {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      alert("Please upload a CSV file.");
      return;
    }

    const uploadedDataset: Dataset = {
      id: crypto.randomUUID(),
      label: file.name,
      type: "uploaded",
      file,
    };

    setDatasets((previousDatasets) => {
      const uploadOptionIndex = previousDatasets.findIndex(
        (dataset) => dataset.type === "upload",
      );

      if (uploadOptionIndex === -1) {
        return [...previousDatasets, uploadedDataset];
      }

      return [
        ...previousDatasets.slice(0, uploadOptionIndex),
        uploadedDataset,
        ...previousDatasets.slice(uploadOptionIndex),
      ];
    });

    setSelectedDatasetId(uploadedDataset.id);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    handleFileUpload(file);
  };

  const uploadDatasetFile = async (file: File) => {
    const uploadUrl = import.meta.env.VITE_DATASET_UPLOAD_URL;

    if (!uploadUrl) {
      throw new Error("Missing VITE_DATASET_UPLOAD_URL for CSV upload testing.");
    }

    const response = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type || "text/csv",
      },
      body: file,
    });
    console.log("Upload response:", response);
    if (!response.ok) {
      throw new Error(`Failed to upload CSV (${response.status})`);
    }

    return uploadUrl.split("?")[0];
  };

  const startTraining = async () => {
    if (!selectedDataset || selectedDataset.type === "upload") {
      alert("Please select a dataset.");
      return;
    }

    setIsTraining(true);
    setProgress(0);

    try {
      const uploadedFile = getUploadedFile(selectedDataset);
      const datasetUrl = getDatasetUrl(selectedDataset);

      const trainingDatasetUrl = uploadedFile
        ? await uploadDatasetFile(uploadedFile)
        : datasetUrl;

      if (!trainingDatasetUrl) {
        throw new Error("Dataset URL is missing.");
      }

      setProgress(10);

      console.log("Dataset ready for training:", trainingDatasetUrl);

      // Continue with the training API call here after the upload succeeds.
      // Example: include `trainingDatasetUrl` in the payload sent to your backend.
      //
      // await mlClient.post("/train", {
      //   csv_url: trainingDatasetUrl,
      //   model_name: modelName,
      //   ...
      // });

      // Reset the temporary uploading state until the real training request is added.
      setProgress(100);
      setIsTraining(false);
    } catch (error) {
      console.error("Failed to start training", error);
      alert(error instanceof Error ? error.message : "Failed to start training.");
      setIsTraining(false);
      setProgress(0);
      return;
    }
  };

  const cancelTraining = async () => {
    setIsCanceling(true);

    try {
      const res = await mlClient.post("/cancel_train", null, {
        params: {
          user_id: 0,
          training_session_id: 3,
        },
      });

      console.log(res.data);
      setIsTraining(false);
    } finally {
      setIsCanceling(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-8">
        <h1 className="mb-6 text-3xl">Training</h1>

        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <label className="mb-2 block text-sm font-medium text-gray-700">Model Name</label>
          <input
            type="text"
            value={modelName}
            onChange={(event) => setModelName(event.target.value)}
            placeholder="e.g., IMDB-DistilBERT-v1"
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            Give your model a unique name for easy identification
          </p>
        </div>

        <div className="mb-6 space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <SelectedCard
              title="Dataset"
              selectLabel="Select Dataset"
              options={datasetOptions}
              selectedValue={selectedDatasetId}
              onSelectedValueChange={handleDatasetSelection}
              placeholder="Choose a dataset"
            >
              {() => (
                <>
                  <input
                    type="file"
                    accept=".csv"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileChange}
                  />

                  {(selectedDataset?.type === "upload" ||
                    selectedDataset?.type === "uploaded") && (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="mb-4 cursor-pointer rounded-lg border-2 border-dashed border-gray-300 p-6 text-center hover:border-gray-400"
                    >
                      <Upload className="mx-auto mb-2 size-8 text-gray-400" />
                      <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                    </div>
                  )}

                  <div>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <label className="block text-sm text-gray-600">Sample Preview</label>
                    </div>
                    <div className="overflow-hidden rounded-lg border border-gray-200">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left">Text</th>
                            <th className="px-3 py-2 text-left">Label</th>
                          </tr>
                        </thead>
                        <tbody>
                          {previewData.length > 0 ? (
                            previewData.map((row, index) => (
                              <tr className="border-t border-gray-200" key={index}>
                                <td className="px-3 py-2 text-xs" title={row.text}>
                                  {formatPreviewText(row.text)}
                                </td>
                                <td className="px-3 py-2 text-xs">{row.label}</td>
                              </tr>
                            ))
                          ) : (
                            <>
                              <tr>
                                <td className="px-3 py-2 text-xs">
                                  This is an amazing sample text
                                </td>
                                <td className="px-3 py-2 text-xs">Positive</td>
                              </tr>
                              <tr className="border-t border-gray-200">
                                <td className="px-3 py-2 text-xs">Worst sample text ever</td>
                                <td className="px-3 py-2 text-xs">Negative</td>
                              </tr>
                            </>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </SelectedCard>

            <PreprocessingCard
              lowercase={lowercase}
              removePunctuation={removePunctuation}
              removeStopwords={removeStopwords}
              lemmatization={lemmatization}
              trainSplit={trainSplit}
              stratifiedSplit={stratifiedSplut}
              handleURLs={handleURLs}
              handleEmails={handleEmails}
              onLowercaseSwitchChange={setLowercase}
              onPunctuationSwitchChange={setRemovePunctuation}
              onStopwordsSwitchChange={setRemoveStopwords}
              onLemmatizationSwitchChange={setLemmatization}
              onTrainSplitChange={setTrainSplit}
              onStratifiedSplitChange={setStratifiedSplit}
              onHandleURLsChange={setHandleURLs}
              onHandleEmailsChange={setHandleEmails}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ClassfierCard
              classifierType={classifierType}
              hiddenNeurons={hiddenNeurons}
              dropout={classifierDropout}
              onClassifierTypeChange={setClassifierType}
              onHiddenNeuronsChange={setHiddenNeurons}
              onDropoutChange={setClassifierDropout}
            />

            <ModelParamsCard
              model={model}
              epochs={epochs}
              batchSize={batchSize}
              learningRate={learningRate}
              evaluationFrequency={evaluationFrequency}
              fineTune={fineTune}
              onModelChange={setModel}
              onEpochsChange={setEpochs}
              onBatchSizeChange={setBatchSize}
              onLearningRateChange={setLearningRate}
              onEvaluationFrequencyChange={setEvaluationFrequency}
              onFineTuneSwitchChange={setFineTune}
            />
          </div>
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => {
                void startTraining();
              }}
              disabled={isTraining || !canStartTraining}
              className="rounded-lg bg-blue-600 px-8 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {isTraining ? "Training..." : "Start Training"}
            </button>

            {isTraining && (
              <button
                onClick={() => {
                  void cancelTraining();
                }}
                disabled={isCanceling}
                className="rounded-lg bg-red-600 px-8 py-3 font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                {isCanceling ? "Canceling..." : "Cancel Training"}
              </button>
            )}
          </div>

          {isTraining && (
            <div className="w-full max-w-md">
              <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm">Training Progress</span>
                  <span className="text-sm font-medium">{progress}%</span>
                </div>
                <Progress.Root className="relative h-2 overflow-hidden rounded-full bg-gray-200">
                  <Progress.Indicator
                    className="h-full bg-blue-600 transition-transform duration-300 ease-in-out"
                    style={{ transform: `translateX(-${100 - progress}%)` }}
                  />
                </Progress.Root>
              </div>
            </div>
          )}
        </div>
      </div>

      <TrainingResult hasResults={hasResults} />
    </div>
  );
}
