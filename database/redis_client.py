# redis_client.py
from typing import Literal
from pydantic import BaseModel
import json
import os
import redis
from model_training_pipeline.model_config import ModelConfig

REDIS_HOST = os.getenv("REDIS_HOST", "localhost")

# For model state: keep bytes (required for torch.save/load)
r_bytes = redis.Redis(host=REDIS_HOST, port=6379, db=0, decode_responses=False)

# --- Learning curves (keyed by user_id and training_session_id) ---

def _curves_key(user_id: str, training_session_id: str) -> str:
    return f"curves:{user_id}:{training_session_id}"


def save_learning_curves(
    user_id: str,
    training_session_id: str,
    curves: dict,
) -> None:
    """
    Store learning curves as JSON for plotting.
    curves should have keys like: train_err, val_err, train_acc, val_acc (lists of floats per epoch).
    """
    r_bytes.set(_curves_key(user_id, training_session_id), json.dumps(curves).encode("utf-8"))


def get_learning_curves(user_id: str, training_session_id: str) -> dict | None:
    """Return stored learning curves dict (train_err, val_err, train_acc, val_acc), or None if not found."""
    data = r_bytes.get(_curves_key(user_id, training_session_id))
    if data is None:
        return None
    return json.loads(data.decode("utf-8"))


def delete_learning_curves(user_id: str, training_session_id: str) -> None:
    """Remove stored learning curves for this user/session."""
    r_bytes.delete(_curves_key(user_id, training_session_id))


# --- Training status (keyed by user_id and training_session_id) ---


class TrainingStatus(BaseModel):
    status: Literal["ready", "running", "completed"]
    config: ModelConfig
    progress: float
    result: dict



def _training_status_key(user_id: str, training_session_id: str) -> str:
    return f"training_status:{user_id}:{training_session_id}"


def save_training_status(user_id: str, training_session_id: str, status: bool) -> None:
    """Store training status as a boolean (True = training, False = idle/done)."""
    r_bytes.set(_training_status_key(user_id, training_session_id), json.dumps(status).encode("utf-8"))


def get_training_status(user_id: str, training_session_id: str) -> bool | None:
    """Return stored training status (True/False), or None if not set."""
    data = r_bytes.get(_training_status_key(user_id, training_session_id))
    if data is None:
        return None
    return json.loads(data.decode("utf-8"))


def delete_training_status(user_id: str, training_session_id: str) -> None:
    """Remove stored training status for this user/session."""
    r_bytes.delete(_training_status_key(user_id, training_session_id))


if __name__ == "__main__":
    print(save_training_status("test_user", "test_session", False))