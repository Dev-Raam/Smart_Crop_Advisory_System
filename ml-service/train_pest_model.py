from pathlib import Path

import joblib
import numpy as np
from PIL import Image
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

BASE_DIR = Path(__file__).resolve().parent
PEST_DATASET_DIR = BASE_DIR / "pest"
PEST_MODEL_PATH = BASE_DIR / "pest_detection_model.joblib"
IMAGE_SIZE = (64, 64)


def _extract_features(image_path: Path):
    image = Image.open(image_path).convert("RGB").resize(IMAGE_SIZE)
    pixels = np.asarray(image, dtype=np.float32) / 255.0
    flattened = pixels.flatten()

    means = pixels.mean(axis=(0, 1))
    stds = pixels.std(axis=(0, 1))
    mins = pixels.min(axis=(0, 1))
    maxs = pixels.max(axis=(0, 1))

    return np.concatenate([flattened, means, stds, mins, maxs])


def _iter_samples(root: Path):
    for class_dir in sorted(root.iterdir()):
        if not class_dir.is_dir():
            continue

        for image_path in class_dir.rglob("*"):
            if image_path.suffix.lower() not in {".jpg", ".jpeg", ".png"}:
                continue
            yield image_path, class_dir.name


def train_pest_model(dataset_dir: Path = PEST_DATASET_DIR, model_path: Path = PEST_MODEL_PATH):
    train_dir = dataset_dir / "train"
    if not train_dir.exists():
        raise FileNotFoundError(
            f"Pest dataset not found at {train_dir}. Place folders like train/aphids, train/bollworm, ..."
        )

    features = []
    labels = []
    for image_path, label in _iter_samples(train_dir):
        try:
            features.append(_extract_features(image_path))
            labels.append(label)
        except Exception as exc:  # pragma: no cover
            print(f"Skipping {image_path}: {exc}")

    if not features:
        raise RuntimeError("No pest training images were found.")

    X = np.asarray(features, dtype=np.float32)
    y = np.asarray(labels)

    model = Pipeline(
        steps=[
            ("scaler", StandardScaler()),
            (
                "classifier",
                RandomForestClassifier(
                    n_estimators=220,
                    random_state=42,
                    class_weight="balanced",
                    n_jobs=1,
                ),
            ),
        ]
    )
    model.fit(X, y)

    artifact = {
        "model": model,
        "labels": sorted(set(labels)),
        "image_size": IMAGE_SIZE,
        "feature_shape": int(X.shape[1]),
    }
    joblib.dump(artifact, model_path)
    print(f"Pest model saved to {model_path}")


if __name__ == "__main__":
    train_pest_model()
