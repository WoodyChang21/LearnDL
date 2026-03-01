"""
Train model API. Each user/session gets its own model; multiple users can train concurrently.
"""

import asyncio
from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from api.router.model_config import SentimentConfigBody
from data_preprocess_pipeline.dataloader import datapreprocess_dataloader

router = APIRouter(tags=["train"])


def _get_loaders(data_path: str = None):
    """Lazy-load data loaders (same as model_output pipeline)."""
    train_loader, val_loader, test_loader = datapreprocess_dataloader(data_path=data_path).split_data()
    return train_loader, val_loader, test_loader


@router.post("/train")
async def train_model(
    body: SentimentConfigBody,
    data_path: Optional[str] = Query(None, description="Data path (CSV link)"),
    user_id: str = Query(..., description="User ID for storing the model state"),
    training_session_id: str = Query(..., description="Training session ID for storing the model state"),
):
    """
    Create a new model, train it, and save the best checkpoint (by validation loss)
    to Redis for this user_id and training_session_id. Multiple users can train at once.
    """
    try:
        train_loader, val_loader, test_loader = _get_loaders(data_path)
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"Data pipeline not available: {e!s}",
        ) from e

    from model_training_pipeline.train import run_training

    config = body.model_dump()
    result = await asyncio.to_thread(
        run_training,
        train_loader,
        val_loader,
        test_loader,
        user_id,
        training_session_id,
        config,
    )

    if result.get("status") == "error":
        raise HTTPException(status_code=500, detail=result.get("error", "Training failed"))

    return result