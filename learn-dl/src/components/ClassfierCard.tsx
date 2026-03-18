import * as Slider from "@radix-ui/react-slider";
import { InfoTooltip } from "./InfoTooltip";

const CLASSIFIER_OPTIONS: Array<{
    label: string;
    value: string;
}> = [
    { label: "GRU", value: "GRU" },
    { label: "Linear", value: "LINEAR" },
];

const HIDDEN_NEURONS_OPTIONS = [64, 128, 256, 512].map((value) => ({ label: value.toString(), value }));

type ClassifierCardProps = {
    classifierType: string;
    hiddenNeurons: number;
    dropout: number;
    onClassifierTypeChange: (value: string) => void;
    onHiddenNeuronsChange: (value: number) => void;
    onDropoutChange: (value: number) => void;
}

export function ClassfierCard({
    classifierType,
    hiddenNeurons,
    dropout,
    onClassifierTypeChange,
    onHiddenNeuronsChange,
    onDropoutChange,
}: ClassifierCardProps){
    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h3 className="font-semibold mb-4">Classifier Configuration</h3>
            <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                    <label className="text-sm flex items-center gap-1">
                        Classifier Type
                        <InfoTooltip content="Choose model head type (e.g., GRU or Linear)." />
                    </label>
                    <select
                        value={classifierType}
                        onChange={(event) => onClassifierTypeChange(event.target.value)}
                        className="min-w-28 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        {CLASSIFIER_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                        ))}
                    </select>
                </div>


                <div className="flex items-center justify-between">
                    <label className="text-sm flex items-center gap-1">
                        Hidden Neurons
                        <InfoTooltip content="Number of hidden units in the classifier layer." />
                    </label>
                    <select
                        value={hiddenNeurons}
                        onChange={(event) => onHiddenNeuronsChange(Number(event.target.value))}
                        className="min-w-28 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        {HIDDEN_NEURONS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                        ))}
                    </select>
                </div>
                    
                <div>
                    <label className="text-sm text-gray-600 mb-3 flex items-center gap-1">
                    Dropout: {dropout.toFixed(2)}
                    <InfoTooltip content="Regularization rate to reduce overfitting." />
                    </label>
                    <Slider.Root
                    value={[dropout * 100]}
                    onValueChange={(value) => onDropoutChange((value[0] ?? dropout * 100) / 100)}
                    min={10}
                    max={50}
                    step={1}
                    className="relative flex items-center w-full h-5"
                    >
                    <Slider.Track className="relative grow h-1 bg-gray-200 rounded-full">
                        <Slider.Range className="absolute h-full bg-blue-600 rounded-full" />
                    </Slider.Track>
                    <Slider.Thumb className="block size-4 bg-blue-600 rounded-full shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </Slider.Root>
                </div>
            </div>
        </div>
    );
}
