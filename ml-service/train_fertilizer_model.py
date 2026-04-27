from pathlib import Path

import joblib
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

BASE_DIR = Path(__file__).resolve().parent
FERTILIZER_DATASET_PATH = BASE_DIR / "fertlizer_recommendation_dataset.csv"
FERTILIZER_MODEL_PATH = BASE_DIR / "fertilizer_recommendation_model.joblib"

FERTILIZER_NUMERIC_FEATURES = [
    "temperature",
    "moisture",
    "rainfall",
    "ph",
    "nitrogen",
    "phosphorous",
    "potassium",
    "carbon",
]
FERTILIZER_CATEGORICAL_FEATURES = ["soil", "crop"]
FERTILIZER_FEATURE_COLUMNS = FERTILIZER_NUMERIC_FEATURES + FERTILIZER_CATEGORICAL_FEATURES
FERTILIZER_TARGET_COLUMN = "fertilizer"


def load_fertilizer_dataset():
    df = pd.read_csv(FERTILIZER_DATASET_PATH)
    df.columns = [column.strip().lower() for column in df.columns]
    return df


def train_fertilizer_model():
    fertilizer_df = load_fertilizer_dataset()

    X = fertilizer_df[FERTILIZER_FEATURE_COLUMNS].copy()
    y = fertilizer_df[FERTILIZER_TARGET_COLUMN].copy()

    for column in FERTILIZER_NUMERIC_FEATURES:
        X[column] = pd.to_numeric(X[column], errors="coerce")

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y,
    )

    preprocessor = ColumnTransformer(
        transformers=[
            ("categorical", OneHotEncoder(handle_unknown="ignore"), FERTILIZER_CATEGORICAL_FEATURES),
        ],
        remainder="passthrough",
    )

    model = Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            (
                "classifier",
                RandomForestClassifier(
                    n_estimators=260,
                    random_state=42,
                    class_weight="balanced_subsample",
                    n_jobs=1,
                ),
            ),
        ]
    )
    model.fit(X_train, y_train)

    accuracy = model.score(X_test, y_test)
    print(f"Fertilizer recommendation model accuracy: {accuracy:.2f}")

    artifact = {
        "model": model,
        "feature_columns": FERTILIZER_FEATURE_COLUMNS,
        "numeric_features": FERTILIZER_NUMERIC_FEATURES,
        "categorical_features": FERTILIZER_CATEGORICAL_FEATURES,
        "crop_options": sorted(fertilizer_df["crop"].dropna().astype(str).unique().tolist()),
        "soil_options": sorted(fertilizer_df["soil"].dropna().astype(str).unique().tolist()),
    }
    joblib.dump(artifact, FERTILIZER_MODEL_PATH)
    print(f"Fertilizer model saved to {FERTILIZER_MODEL_PATH}")


if __name__ == "__main__":
    train_fertilizer_model()
