from pathlib import Path

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split

from train_fertilizer_model import (
    FERTILIZER_DATASET_PATH,
    FERTILIZER_NUMERIC_FEATURES,
    load_fertilizer_dataset,
)

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "crop_recommendation_model.joblib"
CROP_DATASET_PATH = BASE_DIR / "crop_recommendation_dataset.csv"

FEATURE_COLUMNS = [
    "nitrogen",
    "phosphorus",
    "potassium",
    "temperature",
    "humidity",
    "ph",
    "rainfall",
]

FERTILIZER_NUMERIC_COLUMNS = [
    feature for feature in FERTILIZER_NUMERIC_FEATURES if feature != "moisture" and feature != "carbon"
]


def _load_crop_dataset():
    df = pd.read_csv(CROP_DATASET_PATH)
    df = df.rename(columns={"N": "nitrogen", "P": "phosphorus", "K": "potassium"})
    return df


def train():
    crop_df = _load_crop_dataset()
    fertilizer_df = load_fertilizer_dataset()

    X = crop_df[FEATURE_COLUMNS]
    y = crop_df["label"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    model = RandomForestClassifier(
        n_estimators=180,
        random_state=42,
        class_weight="balanced",
        n_jobs=1,
    )
    model.fit(X_train, y_train)

    accuracy = model.score(X_test, y_test)
    print(f"Crop recommendation model accuracy: {accuracy:.2f}")

    artifact = {
        "model": model,
        "feature_columns": FEATURE_COLUMNS,
        "fertilizer_reference": fertilizer_df,
        "fertilizer_numeric_columns": FERTILIZER_NUMERIC_COLUMNS,
    }
    joblib.dump(artifact, MODEL_PATH)
    print(f"Model saved to {MODEL_PATH}")


if __name__ == "__main__":
    train()
