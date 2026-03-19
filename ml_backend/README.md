# ML Backend

This folder contains the Python backend for the LearnDL text-classification workflow. It exposes a FastAPI service for:

- starting asynchronous model training jobs
- tracking training status through Redis
- generating predictions from saved model checkpoints
- returning evaluation artifacts for the frontend

The backend is built around Hugging Face encoder models, a small classifier head, Redis for job state, and DigitalOcean Spaces for checkpoint storage.

## Stack

- FastAPI + Uvicorn
- PyTorch
- Hugging Face Transformers
- Redis
- DigitalOcean Spaces / S3-compatible storage

## Project Structure

```text
ml_backend/
|-- api/                         # FastAPI app and route handlers
|-- cloud_storage/              # Model artifact storage helpers
|-- data/                       # CSV loading utilities
|-- data_preprocess_pipeline/   # Dataset loading and dataloader creation
|-- database/                   # Redis-backed training status storage
|-- model_prediction/           # Inference pipeline
|-- model_training_pipeline/    # Model definition, training, evaluation
|-- Dockerfile
|-- docker-compose.yaml
|-- requirements.txt
`-- start.sh
```

## Supported Models

Embedding backbones:

- `bert_model`
- `distilbert_model`
- `roberta_model`
- `longformer_model`

Classifier types:

- `GRU`
- `LINEAR`

Fine-tuning modes:

- `freeze_all`
- `unfreeze_last_n_layers`
- `unfreeze_all`

## API Endpoints

Base prefix: `/model_api`

- `GET /health_check`
- `POST /train`
- `GET /get_train_status`
- `POST /cancel_train`
- `POST /model_output`

### Health Check

```http
GET /model_api/health_check
```

### Start Training

```http
POST /model_api/train?user_id=<user_id>&training_session_id=<session_id>
Content-Type: application/json
```

Example body:

```json
{
  "training_config": {
    "learning_rate": 0.00002,
    "n_epochs": 5,
    "batch_size": 8,
    "eval_step": 1
  },
  "data_config": {
    "data_path": "https://deep-learning-project.tor1.cdn.digitaloceanspaces.com/projects/public/spam.csv",
    "lowercase": false,
    "remove_punctuation": false,
    "remove_stopwords": false,
    "lemmatization": false,
    "handle_urls": "replace",
    "handle_emails": "replace",
    "train_ratio": 0.8,
    "test_ratio": 0.2,
    "stratify": true
  },
  "embed_model_config": {
    "embed_model": "roberta_model",
    "fine_tune_mode": "freeze_all",
    "unfreeze_last_n_layers": null
  },
  "classifier_config": {
    "model_name": "default",
    "hidden_neurons": 128,
    "dropout": 0.3,
    "num_classes": 2,
    "classifier_type": "LINEAR"
  }
}
```

Notes:

- `user_id` and `training_session_id` are required query parameters and are used as the storage key for training state and checkpoints.
- training runs in the background with `asyncio.to_thread(...)`
- the best checkpoint is uploaded to object storage as `<model_name>.pth`

### Poll Training Status

```http
GET /model_api/get_train_status?user_id=<user_id>&training_session_id=<session_id>
```

Possible status values:

- `queued`
- `running`
- `evaluating`
- `completed`
- `error`
- `cancelled`

When training completes, the response includes:

- aggregate metrics: accuracy, precision, recall, F1
- confusion matrix
- learning curves
- one attention visualization payload
- a 2D embedding projection payload

### Cancel Training

```http
POST /model_api/cancel_train?user_id=<user_id>&training_session_id=<session_id>
```

### Run Prediction

```http
POST /model_api/model_output?user_id=<user_id>&training_session_id=<session_id>
Content-Type: application/json
```

Example body:

```json
{
  "user_input": "This product is excellent and easy to use.",
  "config": {
    "classifier_config": {
      "model_name": "default",
      "hidden_neurons": 128,
      "dropout": 0.3,
      "num_classes": 2,
      "classifier_type": "LINEAR"
    },
    "embed_model_config": {
      "embed_model": "roberta_model",
      "fine_tune_mode": "freeze_all",
      "unfreeze_last_n_layers": null
    },
    "training_config": {
      "learning_rate": 0.00002,
      "n_epochs": 5,
      "batch_size": 8,
      "eval_step": 1
    },
    "data_config": {
      "data_path": "https://deep-learning-project.tor1.cdn.digitaloceanspaces.com/projects/public/spam.csv",
      "lowercase": false,
      "remove_punctuation": false,
      "remove_stopwords": false,
      "lemmatization": false,
      "handle_urls": "replace",
      "handle_emails": "replace",
      "train_ratio": 0.8,
      "test_ratio": 0.2,
      "stratify": true,
      "class_map": {
        "label_to_id": {
          "ham": 0,
          "spam": 1
        },
        "id_to_label": {
          "0": "ham",
          "1": "spam"
        }
      }
    }
  }
}
```

Prediction requires:

- a previously trained checkpoint in object storage
- the same effective config used during training, especially `class_map`, model type, and checkpoint name

## Dataset Format

Training data is loaded from `data_config.data_path`, which can be a local CSV path or a remote CSV URL.

Expected CSV shape:

- two columns
- first column is treated as `input`
- second column is treated as `output`
- rows with missing values are dropped

Example:

```csv
input,output
"I loved this movie",positive
"This was a waste of time",negative
```

If the file has exactly two columns, the loader renames them to `input` and `output` automatically.

## Environment Variables

The backend reads these variables:

- `REDIS_HOST` for Redis connection, default `localhost`
- `DO_REGION`
- `DO_ENDPOINT`
- `DO_ACCESS_KEY`
- `DO_SECRET_KEY`
- `DO_BUCKET_NAME`

Example `.env`:

```env
REDIS_HOST=localhost
DO_REGION=tor1
DO_ENDPOINT=https://<your-space-endpoint>
DO_ACCESS_KEY=<your-access-key>
DO_SECRET_KEY=<your-secret-key>
DO_BUCKET_NAME=<your-bucket-name>
```

Notes:

- Redis is required for training-status APIs.
- DigitalOcean Spaces credentials are required for checkpoint upload/download used by training and prediction.
- Hugging Face model weights are downloaded on first use.

## Local Development

### 1. Create a virtual environment

```bash
python -m venv .venv
```

Activate it:

```bash
# Windows PowerShell
.venv\Scripts\Activate.ps1
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Start Redis

You need a Redis server available at `REDIS_HOST:6379`.

### 4. Run the API

```bash
python -m api.main
```

Or:

```bash
uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
```

The service will be available at:

- `http://localhost:8000`
- Swagger UI: `http://localhost:8000/docs`

## Docker

Build and run:

```bash
docker compose up --build
```

Container behavior:

- installs Python dependencies with `uv`
- starts a local Redis server inside the container
- starts Uvicorn on port `8000`

## Training Flow

1. Client calls `POST /model_api/train`
2. Backend loads and splits the dataset
3. Selected embedding model and classifier are built
4. Training progress is written to Redis
5. Best checkpoint is uploaded to object storage
6. Test metrics and visualization payloads are generated
7. Final status is stored in Redis as `completed`

## Important Implementation Notes

- CORS is currently open to all origins.
- Training is asynchronous, but status retrieval is polling-based.
- The preprocessing config fields exist in the request schema, but the current data loader mainly depends on `data_path`, split ratios, and `stratify`.
- Prediction lazy-loads the inference pipeline so the API can still boot even if model assets are unavailable.

## Known Setup Assumptions

- Redis must be reachable before training-related endpoints are used.
- Object storage must be configured before training or inference, otherwise checkpoint reads/writes will fail.
- GPU is optional; the code falls back to CPU when CUDA is unavailable.
