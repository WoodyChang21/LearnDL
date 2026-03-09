import torch
from data.read_data import read_data
from data_preprocess_pipeline.pipeline import preprocess_pipeline
from model_training_pipeline.embed_model import MODEL_NAMES
from data_preprocess_pipeline.data_config import DataConfig
from torch.utils.data import DataLoader
from tqdm import tqdm
# Define the classifier 
from transformers import AutoModelForSequenceClassification

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

MODEL_CHECKPOITNS = {
    "bert_model": "bert-base-cased",
    "distilbert_model": "distilbert-base-uncased",
}

def evaluate_model(model: AutoModelForSequenceClassification, val_loader: DataLoader):
    model.eval()

    total_loss = 0.0
    correct = 0
    n = 0

    with torch.no_grad():
        for batch in val_loader:
            input_ids = batch["input_ids"].to(DEVICE)
            attention_mask = batch["attention_mask"].to(DEVICE)
            labels = batch["labels"].to(DEVICE)

            outputs = model(
                input_ids=input_ids,
                attention_mask=attention_mask,
                labels=labels,
            )

            loss = outputs.loss
            logits = outputs.logits

            preds = logits.argmax(dim=1)

            total_loss += loss.item() * labels.size(0)
            correct += (preds == labels).sum().item()
            n += labels.size(0)

    val_loss = total_loss / n if n else float("inf")
    val_acc = correct / n if n else 0.0

    return val_loss, val_acc

def test_train(data_path: str, embed_model: str, data_config: DataConfig):
    df, X, y, class_map, num_classes = read_data(data_path)
    classify_model = AutoModelForSequenceClassification.from_pretrained(
        MODEL_CHECKPOITNS[embed_model],
        num_labels=num_classes,
        id2label=class_map["id_to_label"],
        label2id=class_map["label_to_id"],
    ).to(DEVICE)
    train_loader, val_loader, test_loader, num_classes = preprocess_pipeline(bert_model=MODEL_NAMES[embed_model], data_config=data_config)
    try: # Start training
        print("STARTING TRAINING")
        optimizer = torch.optim.AdamW(classify_model.parameters(), lr=0.001)
        best_val_acc = float("-inf")
        best_state_dict = None
        for epoch in range(5):
            print(f"Epoch {epoch + 1}/{5}")
            classify_model.train()

            total_train_loss = 0.0
            n_train = 0
            correct_train = 0

            for batch in tqdm(train_loader, total=len(train_loader)):

                input_ids = batch["input_ids"].to(DEVICE)
                attention_mask = batch["attention_mask"].to(DEVICE)
                labels = batch["labels"].to(DEVICE)

                optimizer.zero_grad()

                outputs = classify_model(
                    input_ids=input_ids,
                    attention_mask=attention_mask,
                    labels=labels,
                )

                loss = outputs.loss
                logits = outputs.logits

                loss.backward()
                torch.nn.utils.clip_grad_norm_(classify_model.parameters(), max_norm=1.0)
                optimizer.step()

                total_train_loss += loss.item() * labels.size(0)
                n_train += labels.size(0)
                correct_train += (logits.argmax(dim=1) == labels).sum().item()

            train_loss = total_train_loss / n_train if n_train else 0.0
            train_acc = correct_train / n_train if n_train else 0.0
            val_loss, val_acc = evaluate_model(classify_model, val_loader)

            print(
                f"Train Loss: {train_loss:.4f}, "
                f"Val Loss: {val_loss:.4f}, "
                f"Train Acc: {train_acc:.4f}, "
                f"Val Acc: {val_acc:.4f}"
            )

        evaluate_metrics = evaluate_model(classify_model, test_loader)

        return {
            "status": "success",
            "metrics": evaluate_metrics,
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
        }

if __name__ == "__main__":
    data_path = "data/News.csv"
    embed_model = "bert_model"
    data_config = DataConfig(
        data_path=data_path,
        train_ratio=0.8,
        test_ratio=0.2,
        stratify=True,
    )
    result = test_train(data_path, embed_model, data_config)
    print(result)