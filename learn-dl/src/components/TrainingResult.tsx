import { TrainingVisualizations, type TrainingVisualizationData } from "./TrainingVisualizations";

type TrainingResultProps = {
  hasResults: boolean;
  visualizationData: TrainingVisualizationData | null;
};

export function TrainingResult({ hasResults, visualizationData }: TrainingResultProps) {
  if (!hasResults || !visualizationData) return null;
  return <TrainingVisualizations data={visualizationData} />;
}
