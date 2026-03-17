import type { TrainingVisualizationData } from "../components/TrainingVisualizations";
import api from "./axiosClient";
import { getCurrentUserId } from "./session";

export interface TrainingRunConfig {
  epochs: number;
  batchSize: number;
  learningRate: string;
  fineTune: boolean;
  trainSplit: number;
  lowercase: boolean;
  removePunctuation: boolean;
  removeStopwords: boolean;
  lemmatization: boolean;
}

export interface TrainingRun {
  id: string;
  name: string;
  model: string;
  dataset: string;
  accuracy: string;
  date: string;
  config: TrainingRunConfig;
  visualizationData?: TrainingVisualizationData;
}

type BackendTrainingSession = {
  sessionId: string;
  modelName: string;
  createdAt: string;
  dataset: {
    csvName: string;
  };
  hyperParams: null | {
    training_config: {
      n_epochs: number;
      batch_size: number;
      learning_rate: number | string;
    };
    embed_model_config: {
      fine_tune_mode: string;
    };
    data_config: {
      train_ratio: number;
      lowercase: boolean;
      remove_punctuation: boolean;
      remove_stopwords: boolean;
      lemmatization: boolean;
    };
    classifier_config: {
      classifier_type: string;
    };
  };
  metrics: null | {
    accuracy: number;
  };
};

const formatAccuracy = (accuracy: number) => {
  const percentage = accuracy <= 1 ? accuracy * 100 : accuracy;
  return `${percentage.toFixed(1)}%`;
};

const toTrainSplit = (trainRatio: number) => {
  const percentage = trainRatio <= 1 ? trainRatio * 100 : trainRatio;
  return Math.round(percentage);
};

const defaultTrainingRunConfig: TrainingRunConfig = {
  epochs: 1,
  batchSize: 1,
  learningRate: "",
  fineTune: false,
  trainSplit: 80,
  lowercase: false,
  removePunctuation: false,
  removeStopwords: false,
  lemmatization: false,
};

const mapTrainingSession = (session: BackendTrainingSession): TrainingRun => {
  const trainingConfig = session.hyperParams?.training_config;
  const embedModelConfig = session.hyperParams?.embed_model_config;
  const dataConfig = session.hyperParams?.data_config;
  const classifierConfig = session.hyperParams?.classifier_config;

  return {
    id: session.sessionId,
    name: session.modelName,
    model: classifierConfig?.classifier_type || "Unknown",
    dataset: session.dataset.csvName,
    accuracy: session.metrics ? formatAccuracy(session.metrics.accuracy) : "N/A",
    date: new Date(session.createdAt).toLocaleDateString(),
    config: {
      epochs: trainingConfig ? trainingConfig.n_epochs : defaultTrainingRunConfig.epochs,
      batchSize: trainingConfig ? trainingConfig.batch_size : defaultTrainingRunConfig.batchSize,
      learningRate: trainingConfig
        ? String(trainingConfig.learning_rate)
        : defaultTrainingRunConfig.learningRate,
      fineTune: embedModelConfig
        ? embedModelConfig.fine_tune_mode !== "freeze_all"
        : defaultTrainingRunConfig.fineTune,
      trainSplit: dataConfig
        ? toTrainSplit(dataConfig.train_ratio)
        : defaultTrainingRunConfig.trainSplit,
      lowercase: dataConfig ? dataConfig.lowercase : defaultTrainingRunConfig.lowercase,
      removePunctuation: dataConfig
        ? dataConfig.remove_punctuation
        : defaultTrainingRunConfig.removePunctuation,
      removeStopwords: dataConfig
        ? dataConfig.remove_stopwords
        : defaultTrainingRunConfig.removeStopwords,
      lemmatization: dataConfig
        ? dataConfig.lemmatization
        : defaultTrainingRunConfig.lemmatization,
    },
  };
};

export const getUserTrainingSessions = async (): Promise<TrainingRun[]> => {
  const userId = await getCurrentUserId();
  const response = await api.get<{ data: BackendTrainingSession[] } | BackendTrainingSession[]>(
    `/users/${userId}/training_sessions`,
  );
  const sessions = Array.isArray(response.data) ? response.data : null;
  return sessions ? sessions.map(mapTrainingSession) : [];
};
