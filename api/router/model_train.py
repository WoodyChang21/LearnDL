"""
Train model API. Each user/session gets its own model; multiple users can train concurrently.
"""

import asyncio
from fastapi import APIRouter, HTTPException, Query
from typing import Optional

from data_preprocess_pipeline.pipeline import preprocess_pipeline
from model_training_pipeline.model_config import TrainingConfig
from model_training_pipeline.embed_model import MODEL_NAMES
from model_training_pipeline.train import run_training
from database.redis_client import save_training_config

router = APIRouter(tags=["train"])


def _get_loaders(config: TrainingConfig, data_path: str | None = None):
    """Build data loaders using the embed model from config."""
    embd_model = MODEL_NAMES[config.embed_model]
    train_loader, val_loader, test_loader = preprocess_pipeline(
        bert_model=embd_model, data_path=data_path
    )
    return train_loader, val_loader, test_loader


@router.post("/train")
async def train_model(
    config: TrainingConfig,
    data_path: Optional[str] = Query(None, description="Data path (CSV link)"),
    user_id: str = Query(..., description="User ID for storing the model state"),
    training_session_id: str = Query(..., description="Training session ID for storing the model state"),
):
    """
    Create a new model, train it, and save the best checkpoint (by validation loss)
    to Redis for this user_id and training_session_id. Multiple users can train at once.
    Request body: TrainingConfig (learning_rate, n_epochs, hidden_neurons, dropout, num_layers, num_classes, embed_model).
    """
    try:
        train_loader, val_loader, test_loader = _get_loaders(config, data_path)
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"Data pipeline not available: {e!s}",
        ) from e

    save_training_config(user_id, training_session_id, config)
    result = await asyncio.to_thread(
        run_training,
        train_loader,
        val_loader,
        test_loader,
        user_id,
        training_session_id,
        config,
    )
    return result
