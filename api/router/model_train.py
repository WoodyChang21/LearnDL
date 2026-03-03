"""
Train model API. Each user/session gets its own model; multiple users can train concurrently.
"""

import asyncio
from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from data_preprocess_pipeline.pipeline import preprocess_pipeline
from model_training_pipeline.train import run_training
from pydantic import BaseModel, Field

router = APIRouter(tags=["train"])


def _get_loaders(data_path: str = None):
    """Lazy-load data loaders (same as model_output pipeline)."""
    train_loader, val_loader, test_loader = preprocess_pipeline(data_path=data_path)
    return train_loader, val_loader, test_loader



class ModelConfigBody(BaseModel):
    learning_rate: float = Field(0.001, description="Learning rate")
    n_epochs: int = Field(5, ge=1, le=100, description="Number of epochs")
    hidden_neurons: int = Field(512, ge=1, le=2048, description="Hidden layer size")
    dropout: float = Field(0.3, ge=0.0, le=1.0, description="Dropout rate")
    num_layers: int = Field(1, ge=1, le=4, description="Number of RNN/GRU layers")

class DataPreprocessBody(BaseModel):
    lowercase: bool = Field(False, description="Lowercase the text")
    remove_stopwords: bool = Field(False, description="Remove stopwords")
    remove_punctuation: bool = Field(False, description="Remove punctuation")
    lemmeatization: bool = Field(False, description="Lemmeatization")
    min_word_length: int = Field(3, ge=1, le=10, description="Minimum word length")
    max_word_length: int = Field(10, ge=1, le=20, description="Maximum word length")
    train_test_split: float = Field(0.8, ge=0.0, le=1.0, description="Train test split")

@router.post("/train")
async def train_model(
    model_config_body: ModelConfigBody,
    data_preprocess_body: DataPreprocessBody,
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

    model_config = model_config_body.model_dump()
    result = await asyncio.to_thread(
        run_training,
        train_loader,
        val_loader,
        test_loader,
        user_id,
        training_session_id,
        model_config,
    )


    return result