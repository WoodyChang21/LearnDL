import { useState } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { Crosshair, Medal, Target, TrendingUp } from "lucide-react";

type MetricKey = "accuracy_pct" | "precision_pct" | "recall_pct" | "f1_score_pct";
type MetricsData = Record<MetricKey, number>;

type ConfusionMatrixData = {
  labels: [string, string];
  matrix: [[number, number], [number, number]];
  normalize: boolean;
};

type LearningCurvesData = {
  x: number[];
  train_loss: number[];
  val_loss: number[];
  train_acc: number[];
  val_acc: number[];
};

type AttentionVisualizationData = {
  text: string;
  tokens: string[];
  scores: number[];
};

type EmbeddingPoint = {
  x: number;
  y: number;
  label: string;
  text: string;
};

type Embedding2DData = {
  points: EmbeddingPoint[];
  legend: [string, string];
};

export type TrainingVisualizationData = {
  metrics: MetricsData;
  confusion_matrix: ConfusionMatrixData;
  learning_curves: LearningCurvesData;
  attention_visualization: AttentionVisualizationData;
  embedding_2d: Embedding2DData;
};

const metricCards: Array<{
  key: MetricKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  iconClass: string;
}> = [
  { key: "accuracy_pct", label: "Accuracy", icon: TrendingUp, iconClass: "text-blue-500" },
  { key: "precision_pct", label: "Precision", icon: Target, iconClass: "text-green-500" },
  { key: "recall_pct", label: "Recall", icon: Crosshair, iconClass: "text-violet-500" },
  { key: "f1_score_pct", label: "F1-Score", icon: Medal, iconClass: "text-orange-500" },
];

const toPercent = (value: number) => `${value.toFixed(1)}%`;
const lerp = (value: number, min: number, max: number) => (max === min ? 0 : (value - min) / (max - min));

function MetricsPanel({ metrics }: { metrics: MetricsData }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {metricCards.map(({ key, label, icon: Icon, iconClass }) => (
        <div key={key} className="rounded-xl border border-gray-200 bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>{label}</span>
            <Icon className={`h-4 w-4 ${iconClass}`} />
          </div>
          <div className="mt-5 text-4xl font-semibold text-slate-900">{toPercent(metrics[key])}</div>
        </div>
      ))}
    </div>
  );
}

function ConfusionPanel({ confusion }: { confusion: ConfusionMatrixData }) {
  const [negativeLabel, positiveLabel] = confusion.labels;
  const [[tn, fp], [fn, tp]] = confusion.matrix;
  const max = Math.max(tn, fp, fn, tp);
  const alpha = (value: number) => 0.2 + (value / Math.max(1, max)) * 0.75;
  const cellClass = "aspect-square rounded-xl flex items-center justify-center text-3xl font-semibold transition-all duration-200 hover:scale-[1.02]";

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h3 className="mb-5 text-center text-3xl font-semibold text-slate-900">Confusion Matrix</h3>
      <div className="mx-auto grid max-w-3xl grid-cols-[auto_1fr] gap-4">
        <div />
        <div className="grid grid-cols-2 text-center text-sm text-slate-700">
          <div>Predicted {positiveLabel}</div>
          <div>Predicted {negativeLabel}</div>
        </div>
        <div className="grid grid-rows-2 place-items-center gap-4 text-sm text-slate-700">
          <div>Actual {positiveLabel}</div>
          <div>Actual {negativeLabel}</div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className={cellClass} style={{ backgroundColor: `rgba(59,130,246,${alpha(tp)})`, color: tp > max * 0.55 ? "#fff" : "#0f172a" }}>{tp}</div>
          <div className={cellClass} style={{ backgroundColor: `rgba(191,219,254,${alpha(fn)})` }}>{fn}</div>
          <div className={cellClass} style={{ backgroundColor: `rgba(191,219,254,${alpha(fp)})` }}>{fp}</div>
          <div className={cellClass} style={{ backgroundColor: `rgba(59,130,246,${alpha(tn)})`, color: tn > max * 0.55 ? "#fff" : "#0f172a" }}>{tn}</div>
        </div>
      </div>
    </div>
  );
}

function LineChart({
  title,
  x,
  a,
  b,
  colorA,
  colorB,
  labelA,
  labelB,
  yLabel,
}: {
  title: string;
  x: number[];
  a: number[];
  b: number[];
  colorA: string;
  colorB: string;
  labelA: string;
  labelB: string;
  yLabel: string;
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const width = 860;
  const height = 260;
  const p = { t: 20, r: 20, b: 45, l: 44 };
  const min = Math.min(...a, ...b);
  const max = Math.max(...a, ...b);
  const innerW = width - p.l - p.r;
  const innerH = height - p.t - p.b;

  const pa = a.map((value, i) => ({ x: p.l + (i / Math.max(1, x.length - 1)) * innerW, y: p.t + (1 - lerp(value, min, max)) * innerH, value }));
  const pb = b.map((value, i) => ({ x: p.l + (i / Math.max(1, x.length - 1)) * innerW, y: p.t + (1 - lerp(value, min, max)) * innerH, value }));

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h4 className="mb-3 text-xl font-semibold text-slate-900">{title}</h4>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
        {[0, 1, 2, 3].map((k) => {
          const y = p.t + (k / 3) * innerH;
          return <line key={`g-y-${k}`} x1={p.l} y1={y} x2={width - p.r} y2={y} stroke="#E5E7EB" strokeDasharray="4 6" />;
        })}
        {x.map((_, i) => {
          const xv = p.l + (i / Math.max(1, x.length - 1)) * innerW;
          return <line key={`g-x-${i}`} x1={xv} y1={p.t} x2={xv} y2={height - p.b} stroke="#F1F5F9" strokeDasharray="3 6" />;
        })}

        <polyline points={pa.map((pt) => `${pt.x},${pt.y}`).join(" ")} fill="none" stroke={colorA} strokeWidth={3} />
        <polyline points={pb.map((pt) => `${pt.x},${pt.y}`).join(" ")} fill="none" stroke={colorB} strokeWidth={3} />

        {pa.map((pt, i) => (
          <circle key={`a-${i}`} cx={pt.x} cy={pt.y} r={hoveredIndex === i ? 6 : 4} fill="#fff" stroke={colorA} strokeWidth={2} onMouseEnter={() => setHoveredIndex(i)} onMouseLeave={() => setHoveredIndex(null)} className="transition-all duration-150" />
        ))}
        {pb.map((pt, i) => (
          <circle key={`b-${i}`} cx={pt.x} cy={pt.y} r={hoveredIndex === i ? 6 : 4} fill="#fff" stroke={colorB} strokeWidth={2} onMouseEnter={() => setHoveredIndex(i)} onMouseLeave={() => setHoveredIndex(null)} className="transition-all duration-150" />
        ))}

        {x.map((epoch, i) => {
          const xv = p.l + (i / Math.max(1, x.length - 1)) * innerW;
          return <text key={`e-${epoch}`} x={xv} y={height - 20} fontSize="12" textAnchor="middle" fill="#475569">{epoch}</text>;
        })}
        <text x={10} y={p.t + innerH / 2} fontSize="12" fill="#475569" transform={`rotate(-90, 10, ${p.t + innerH / 2})`}>{yLabel}</text>
      </svg>
      <div className="mt-2 flex justify-center gap-5 text-sm">
        <span className="flex items-center gap-2 text-blue-600"><span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: colorA }} />{labelA}</span>
        <span className="flex items-center gap-2 text-rose-500"><span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: colorB }} />{labelB}</span>
      </div>
    </div>
  );
}

function AttentionPanel({ attention }: { attention: AttentionVisualizationData }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const maxScore = Math.max(...attention.scores);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 text-center">
      <h3 className="mb-5 text-3xl font-semibold text-slate-900">Attention Visualization</h3>
      <div className="rounded-xl bg-slate-50 p-6">
        <div className="flex flex-wrap justify-center gap-2">
          {attention.tokens.map((token, i) => {
            const intensity = maxScore === 0 ? 0 : attention.scores[i] / maxScore;
            return (
              <button
                type="button"
                key={`${token}-${i}`}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                className="rounded-md px-3 py-2 transition-all duration-150 hover:-translate-y-0.5"
                style={{ backgroundColor: `rgba(59,130,246,${0.2 + intensity * 0.8})` }}
              >
                {token}
              </button>
            );
          })}
        </div>
      </div>
      <p className="mt-4 text-sm text-slate-600">
        {hovered === null
          ? "Higher attention values indicate words that influenced the model prediction."
          : `Token "${attention.tokens[hovered]}" score: ${attention.scores[hovered].toFixed(2)}`}
      </p>
    </div>
  );
}

function EmbeddingPanel({ embedding }: { embedding: Embedding2DData }) {
  const [hoveredText, setHoveredText] = useState<string | null>(null);
  const width = 860;
  const height = 520;
  const p = { t: 24, r: 24, b: 64, l: 44 };
  const xs = embedding.points.map((point) => point.x);
  const ys = embedding.points.map((point) => point.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const [positiveLabel] = embedding.legend;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h3 className="mb-5 text-center text-3xl font-semibold text-slate-900">2D Embedding Visualization</h3>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
        {[0, 1, 2, 3, 4].map((k) => {
          const y = p.t + (k / 4) * (height - p.t - p.b);
          return <line key={`gy-${k}`} x1={p.l} y1={y} x2={width - p.r} y2={y} stroke="#E5E7EB" strokeDasharray="4 8" />;
        })}
        {[0, 1, 2, 3, 4].map((k) => {
          const x = p.l + (k / 4) * (width - p.l - p.r);
          return <line key={`gx-${k}`} x1={x} y1={p.t} x2={x} y2={height - p.b} stroke="#E5E7EB" strokeDasharray="4 8" />;
        })}

        {embedding.points.map((point, i) => {
          const cx = p.l + lerp(point.x, minX, maxX) * (width - p.l - p.r);
          const cy = height - p.b - lerp(point.y, minY, maxY) * (height - p.t - p.b);
          const isHovered = hoveredText === point.text;
          const fill = point.label === positiveLabel ? "#3B82F6" : "#EF4444";
          return (
            <circle
              key={`${point.text}-${i}`}
              cx={cx}
              cy={cy}
              r={isHovered ? 8 : 6}
              fill={fill}
              opacity={isHovered ? 1 : 0.7}
              onMouseEnter={() => setHoveredText(point.text)}
              onMouseLeave={() => setHoveredText(null)}
              className="transition-all duration-150"
            />
          );
        })}
      </svg>
      <div className="mt-3 flex justify-center gap-8 text-sm">
        <span className="flex items-center gap-2 text-blue-600"><span className="inline-block h-4 w-4 rounded-full bg-blue-500" />Positive samples</span>
        <span className="flex items-center gap-2 text-red-500"><span className="inline-block h-4 w-4 rounded-full bg-red-500" />Negative samples</span>
      </div>
      <p className="mt-3 text-center text-sm text-slate-600">{hoveredText ?? "Hover over points to see sample text."}</p>
    </div>
  );
}

export function TrainingVisualizations({ data }: { data: TrainingVisualizationData }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-5 text-2xl font-semibold text-slate-900">Training Visualizations</h2>
      <Tabs.Root defaultValue="metrics">
        <Tabs.List className="mb-6 grid grid-cols-5 gap-1 rounded-full bg-slate-100 p-1">
          <Tabs.Trigger value="metrics" className="rounded-full px-4 py-2 text-sm data-[state=active]:bg-white data-[state=active]:shadow">Metrics</Tabs.Trigger>
          <Tabs.Trigger value="confusion" className="rounded-full px-4 py-2 text-sm data-[state=active]:bg-white data-[state=active]:shadow">Confusion</Tabs.Trigger>
          <Tabs.Trigger value="learning" className="rounded-full px-4 py-2 text-sm data-[state=active]:bg-white data-[state=active]:shadow">Learning</Tabs.Trigger>
          <Tabs.Trigger value="attention" className="rounded-full px-4 py-2 text-sm data-[state=active]:bg-white data-[state=active]:shadow">Attention</Tabs.Trigger>
          <Tabs.Trigger value="embedding" className="rounded-full px-4 py-2 text-sm data-[state=active]:bg-white data-[state=active]:shadow">Embedding</Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="metrics"><MetricsPanel metrics={data.metrics} /></Tabs.Content>
        <Tabs.Content value="confusion"><ConfusionPanel confusion={data.confusion_matrix} /></Tabs.Content>
        <Tabs.Content value="learning">
          <div className="space-y-5">
            <LineChart
              title="Training & Validation Loss"
              x={data.learning_curves.x}
              a={data.learning_curves.train_loss}
              b={data.learning_curves.val_loss}
              colorA="#3B82F6"
              colorB="#EF4444"
              labelA="Training Loss"
              labelB="Validation Loss"
              yLabel="Loss"
            />
            <LineChart
              title="Training & Validation Accuracy"
              x={data.learning_curves.x}
              a={data.learning_curves.train_acc.map((item) => item * 100)}
              b={data.learning_curves.val_acc.map((item) => item * 100)}
              colorA="#10B981"
              colorB="#8B5CF6"
              labelA="Training Accuracy"
              labelB="Validation Accuracy"
              yLabel="Accuracy (%)"
            />
          </div>
        </Tabs.Content>
        <Tabs.Content value="attention"><AttentionPanel attention={data.attention_visualization} /></Tabs.Content>
        <Tabs.Content value="embedding"><EmbeddingPanel embedding={data.embedding_2d} /></Tabs.Content>
      </Tabs.Root>
    </div>
  );
}
