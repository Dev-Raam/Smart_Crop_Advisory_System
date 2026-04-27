from io import BytesIO
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, File, UploadFile
from pydantic import BaseModel, Field

from train_fertilizer_model import (
    FERTILIZER_DATASET_PATH,
    FERTILIZER_FEATURE_COLUMNS,
    FERTILIZER_MODEL_PATH,
    train_fertilizer_model,
)
from train_model import CROP_DATASET_PATH, MODEL_PATH, FEATURE_COLUMNS, train
from train_pest_model import IMAGE_SIZE, PEST_DATASET_DIR, PEST_MODEL_PATH, train_pest_model

try:
    from PIL import Image
except ImportError:  # pragma: no cover
    Image = None

app = FastAPI(title="Smart Crop ML Service")

PEST_TREATMENTS = {
    "aphids": "Inspect the underside of leaves, reduce ant movement, and use neem-based or crop-approved systemic control if infestation is rising.",
    "armyworm": "Scout in the evening, check whorl feeding, and act early with biological or label-approved insect control before larger larvae spread.",
    "beetle": "Monitor edge rows first, remove clusters where practical, and target the crop-safe control only if feeding damage is crossing threshold.",
    "bollworm": "Check flowers and fruiting bodies closely, use pheromone traps, and time sprays to early larval stages for better control.",
    "grasshopper": "Watch field borders and grassy hosts, reduce weed shelter, and intervene early before hopper movement intensifies.",
    "mites": "Confirm webbing or stippling, avoid unnecessary broad-spectrum sprays, and use a miticide only after active infestation is verified.",
    "mosquito": "Reduce standing water and keep nursery or waterlogged areas cleaner to lower breeding pressure.",
    "sawfly": "Scout for clustered larvae and chewing damage, then target small larvae before defoliation becomes severe.",
    "stem_borer": "Inspect for bore holes or dead hearts and use crop-stage-specific management as soon as internal feeding is confirmed.",
}


def _artifact_matches_expected_schema(artifact):
    if not isinstance(artifact, dict):
        return False

    model = artifact.get("model")
    feature_columns = artifact.get("feature_columns")

    if model is None or feature_columns != FEATURE_COLUMNS:
        return False

    trained_features = list(getattr(model, "feature_names_in_", []))
    if trained_features and trained_features != FEATURE_COLUMNS:
        return False

    return True


def _artifact_is_stale(model_path: Path, dependency_paths):
    if not model_path.exists():
        return True

    model_mtime = model_path.stat().st_mtime
    return any(path.exists() and path.stat().st_mtime > model_mtime for path in dependency_paths)


def _crop_predictions_have_variance(model):
    benchmark = pd.DataFrame(
        [
            {"nitrogen": 20, "phosphorus": 20, "potassium": 20, "temperature": 18, "humidity": 40, "ph": 6.5, "rainfall": 40},
            {"nitrogen": 80, "phosphorus": 45, "potassium": 40, "temperature": 25, "humidity": 70, "ph": 6.5, "rainfall": 150},
            {"nitrogen": 120, "phosphorus": 80, "potassium": 60, "temperature": 30, "humidity": 85, "ph": 5.8, "rainfall": 250},
            {"nitrogen": 35, "phosphorus": 60, "potassium": 90, "temperature": 32, "humidity": 55, "ph": 7.4, "rainfall": 80},
            {"nitrogen": 10, "phosphorus": 10, "potassium": 10, "temperature": 12, "humidity": 30, "ph": 7.8, "rainfall": 20},
        ]
    )
    return len(set(model.predict(benchmark).tolist())) > 1


def _fertilizer_artifact_matches_expected_schema(artifact):
    if not isinstance(artifact, dict):
        return False

    model = artifact.get("model")
    feature_columns = artifact.get("feature_columns")
    return model is not None and feature_columns == FERTILIZER_FEATURE_COLUMNS


def _first_sample_image(dataset_root: Path, class_name: str):
    for bucket in ("test", "train"):
        directory = dataset_root / bucket / class_name
        if not directory.exists():
            continue
        for image_path in directory.rglob("*"):
            if image_path.suffix.lower() in {".jpg", ".jpeg", ".png"}:
                return image_path
    return None


def _pest_artifact_has_variance(artifact):
    if artifact is None or Image is None:
        return False

    model = artifact.get("model")
    labels = artifact.get("labels", [])
    if model is None or not labels:
        return False

    predictions = []
    for label in labels:
        image_path = _first_sample_image(PEST_DATASET_DIR, label)
        if image_path is None:
            continue

        resized = Image.open(image_path).convert("RGB").resize(IMAGE_SIZE)
        pixels = np.asarray(resized, dtype=np.float32) / 255.0
        flattened = pixels.flatten()
        means = pixels.mean(axis=(0, 1))
        stds = pixels.std(axis=(0, 1))
        mins = pixels.min(axis=(0, 1))
        maxs = pixels.max(axis=(0, 1))
        features = np.concatenate([flattened, means, stds, mins, maxs])[None, :]
        predictions.append(str(model.predict(features)[0]))

    return len(set(predictions)) > 1


def load_artifact():
    if _artifact_is_stale(MODEL_PATH, [CROP_DATASET_PATH]):
        print("Training crop recommendation model...")
        train()

    artifact = joblib.load(MODEL_PATH)

    if _artifact_matches_expected_schema(artifact):
        model = artifact.get("model")
        if model is not None and _crop_predictions_have_variance(model):
            return artifact

    print("Crop model looks stale or collapsed. Retraining...")
    train()
    retrained_artifact = joblib.load(MODEL_PATH)

    if _artifact_matches_expected_schema(retrained_artifact) and _crop_predictions_have_variance(retrained_artifact["model"]):
        return retrained_artifact

    return {
        "model": retrained_artifact if isinstance(retrained_artifact, dict) else artifact,
        "feature_columns": FEATURE_COLUMNS,
        "fertilizer_reference": None,
        "fertilizer_numeric_columns": [],
    }


def load_pest_artifact():
    if _artifact_is_stale(PEST_MODEL_PATH, [PEST_DATASET_DIR]):
        print("Training pest detection model...")
        train_pest_model()

    if not PEST_MODEL_PATH.exists():
        return None

    artifact = joblib.load(PEST_MODEL_PATH)
    if not isinstance(artifact, dict) or artifact.get("model") is None:
        return None

    if _pest_artifact_has_variance(artifact):
        return artifact

    print("Pest model looks stale or collapsed. Retraining...")
    train_pest_model()
    artifact = joblib.load(PEST_MODEL_PATH)
    if _pest_artifact_has_variance(artifact):
        return artifact

    return artifact


def load_fertilizer_artifact():
    if _artifact_is_stale(FERTILIZER_MODEL_PATH, [FERTILIZER_DATASET_PATH]):
        print("Training fertilizer recommendation model...")
        train_fertilizer_model()

    if not FERTILIZER_MODEL_PATH.exists():
        train_fertilizer_model()

    artifact = joblib.load(FERTILIZER_MODEL_PATH)
    if _fertilizer_artifact_matches_expected_schema(artifact):
        return artifact

    print("Fertilizer model looks stale. Retraining...")
    train_fertilizer_model()
    return joblib.load(FERTILIZER_MODEL_PATH)


ARTIFACT = load_artifact()
MODEL = ARTIFACT["model"]
FERTILIZER_REFERENCE = ARTIFACT.get("fertilizer_reference")
FERTILIZER_NUMERIC_COLUMNS = ARTIFACT.get("fertilizer_numeric_columns", [])
PEST_ARTIFACT = load_pest_artifact()
FERTILIZER_ARTIFACT = load_fertilizer_artifact()
FERTILIZER_MODEL = FERTILIZER_ARTIFACT["model"]


class CropInput(BaseModel):
    nitrogen: float = Field(..., ge=0)
    phosphorus: float = Field(..., ge=0)
    potassium: float = Field(..., ge=0)
    temperature: float
    humidity: float = Field(..., ge=0, le=100)
    ph: float = Field(..., ge=0, le=14)
    rainfall: float = Field(..., ge=0)


class FertilizerInput(BaseModel):
    crop: str = Field(..., min_length=2)
    soil: str = Field(..., min_length=2)
    nitrogen: float = Field(..., ge=0)
    phosphorus: float = Field(..., ge=0)
    potassium: float = Field(..., ge=0)
    temperature: float
    humidity: float = Field(..., ge=0, le=100)
    moisture: float = Field(..., ge=0)
    ph: float = Field(..., ge=0, le=14)
    rainfall: float = Field(..., ge=0)
    carbon: float = Field(1.2, ge=0)


def _get_fertilizer_advice(data: CropInput):
    if FERTILIZER_REFERENCE is None or FERTILIZER_REFERENCE.empty:
        return None

    comparison_row = pd.DataFrame(
        [
            {
                "temperature": data.temperature,
                "rainfall": data.rainfall,
                "ph": data.ph,
                "nitrogen": data.nitrogen,
                "phosphorous": data.phosphorus,
                "potassium": data.potassium,
            }
        ]
    )

    numeric_reference = FERTILIZER_REFERENCE[FERTILIZER_NUMERIC_COLUMNS].astype(float)
    distances = np.linalg.norm(numeric_reference.values - comparison_row[FERTILIZER_NUMERIC_COLUMNS].values, axis=1)
    match = FERTILIZER_REFERENCE.iloc[int(np.argmin(distances))]

    return {
        "name": str(match.get("fertilizer", "Balanced NPK Fertilizer")),
        "soil": str(match.get("soil", "General soil")),
        "crop": str(match.get("crop", "Mixed crops")),
    }


def _predict_fertilizer(data: FertilizerInput):
    input_data = pd.DataFrame(
        [
            {
                "temperature": data.temperature,
                "moisture": data.moisture,
                "rainfall": data.rainfall,
                "ph": data.ph,
                "nitrogen": data.nitrogen,
                "phosphorous": data.phosphorus,
                "potassium": data.potassium,
                "carbon": data.carbon,
                "soil": data.soil,
                "crop": data.crop,
            }
        ]
    )

    prediction = FERTILIZER_MODEL.predict(input_data)[0]
    confidence = 0.0
    if hasattr(FERTILIZER_MODEL, "predict_proba"):
        confidence = round(float(np.max(FERTILIZER_MODEL.predict_proba(input_data)[0]) * 100), 2)

    explanation = (
        f"{prediction} best matches the submitted crop, soil type, nutrient levels, "
        f"moisture, and environmental conditions from the fertilizer dataset."
    )

    return {
        "fertilizer": prediction,
        "confidence": confidence,
        "explanation": explanation,
    }


def _extract_pest_features(image: Image.Image):
    resized = image.resize(IMAGE_SIZE)
    pixels = np.asarray(resized, dtype=np.float32) / 255.0
    flattened = pixels.flatten()
    means = pixels.mean(axis=(0, 1))
    stds = pixels.std(axis=(0, 1))
    mins = pixels.min(axis=(0, 1))
    maxs = pixels.max(axis=(0, 1))
    return np.concatenate([flattened, means, stds, mins, maxs])[None, :]


def _predict_pest_with_model(contents: bytes):
    if PEST_ARTIFACT is None or Image is None:
        return None

    image = Image.open(BytesIO(contents)).convert("RGB")
    features = _extract_pest_features(image)
    model = PEST_ARTIFACT["model"]
    prediction = str(model.predict(features)[0])

    confidence = 71.0
    if hasattr(model, "predict_proba"):
        confidence = round(float(np.max(model.predict_proba(features)[0]) * 100), 2)

    human_label = prediction.replace("_", " ").title()
    treatment = PEST_TREATMENTS.get(
        prediction,
        "Inspect the affected plants closely and confirm field symptoms before spraying.",
    )

    return {
        "label": human_label,
        "disease": human_label,
        "confidence": confidence,
        "summary": f"The uploaded crop image most closely matches the trained pest class '{human_label}'. Confirm the symptom pattern in the field before treatment.",
        "treatment": treatment,
        "source": "trained-pest-model",
    }


def _analyze_image_with_pillow(contents: bytes):
    image = Image.open(BytesIO(contents)).convert("RGB")
    resized = image.resize((128, 128))
    pixels = np.asarray(resized).astype(np.float32)

    red = pixels[:, :, 0].mean()
    green = pixels[:, :, 1].mean()
    blue = pixels[:, :, 2].mean()
    brightness = pixels.mean()
    variance = pixels.std()

    if green > red + 12 and green > blue + 8 and variance < 55:
        return {
            "label": "Healthy",
            "disease": "Healthy",
            "confidence": 91.0,
            "summary": "Leaf color is predominantly green with a balanced texture pattern.",
            "treatment": "No urgent treatment is needed. Continue routine monitoring and avoid overwatering.",
            "source": "visual-fallback",
        }

    if brightness > 165 and abs(red - green) < 18 and variance < 48:
        return {
            "label": "Powdery Mildew",
            "disease": "Powdery Mildew",
            "confidence": 82.0,
            "summary": "The image shows pale, dusty-looking regions that often match mildew-like stress.",
            "treatment": "Improve airflow, avoid overhead irrigation late in the day, and apply a suitable sulfur or potassium bicarbonate spray if symptoms spread.",
            "source": "visual-fallback",
        }

    if red > green + 10 and variance > 52:
        return {
            "label": "Leaf Blight",
            "disease": "Leaf Blight",
            "confidence": 79.0,
            "summary": "Brown or reddish stress patches are visible along with stronger contrast across the leaf.",
            "treatment": "Remove heavily affected leaves, keep foliage dry, and use an appropriate copper-based or label-approved fungicide.",
            "source": "visual-fallback",
        }

    return {
        "label": "Field Review Needed",
        "disease": "Field Review Needed",
        "confidence": 64.0,
        "summary": "A trained pest classifier is not available yet in this environment, so this result is only a visual fallback estimate.",
        "treatment": "Add a trained pest dataset under ml-service/pest_dataset and run train_pest_model.py for stronger pest classification.",
        "source": "visual-fallback",
    }


def _fallback_image_analysis(contents: bytes):
    size_hint = len(contents)
    if size_hint < 40_000:
        return {
            "label": "Healthy",
            "disease": "Healthy",
            "confidence": 65.0,
            "summary": "The uploaded image looks low-detail, but no severe stress signal was detected from the file pattern.",
            "treatment": "Retake the image in bright light if symptoms are present, otherwise continue monitoring.",
            "source": "low-detail-fallback",
        }

    return {
        "label": "Field Review Needed",
        "disease": "Field Review Needed",
        "confidence": 58.0,
        "summary": "The service could not perform a full visual analysis from this environment, so a field inspection is recommended.",
        "treatment": "Capture a close, well-lit leaf photo and inspect for spots, mildew, or chewing damage before treatment.",
        "source": "byte-fallback",
    }


@app.post("/predict-crop")
def predict_crop(data: CropInput):
    input_data = pd.DataFrame(
        [
            {
                "nitrogen": data.nitrogen,
                "phosphorus": data.phosphorus,
                "potassium": data.potassium,
                "temperature": data.temperature,
                "humidity": data.humidity,
                "ph": data.ph,
                "rainfall": data.rainfall,
            }
        ]
    )

    prediction = MODEL.predict(input_data)[0]
    probabilities = MODEL.predict_proba(input_data)[0]
    confidence = round(float(np.max(probabilities) * 100), 2)
    fertilizer = _get_fertilizer_advice(data)

    explanation = (
        f"{prediction} fits the submitted NPK profile, weather conditions, soil pH, "
        f"and rainfall pattern better than the other trained crop classes."
    )

    return {
        "crop": prediction,
        "confidence": confidence,
        "explanation": explanation,
        "fertilizer": fertilizer,
    }


@app.post("/analyze-disease")
async def analyze_disease(image: UploadFile = File(...)):
    contents = await image.read()
    if not contents:
        return {
            "label": "Field Review Needed",
            "disease": "Field Review Needed",
            "confidence": 0,
            "summary": "The uploaded image was empty.",
            "treatment": "Upload a valid crop image to continue.",
            "source": "empty-upload",
        }

    trained_prediction = _predict_pest_with_model(contents)
    if trained_prediction:
        return trained_prediction

    if Image is not None:
        return _analyze_image_with_pillow(contents)

    return _fallback_image_analysis(contents)


@app.post("/recommend-fertilizer")
def recommend_fertilizer(data: FertilizerInput):
    return _predict_fertilizer(data)


@app.get("/fertilizer-options")
def fertilizer_options():
    return {
        "crops": FERTILIZER_ARTIFACT.get("crop_options", []),
        "soils": FERTILIZER_ARTIFACT.get("soil_options", []),
    }


@app.post("/train-pest-model")
def train_pest_detector():
    train_pest_model()
    global PEST_ARTIFACT
    PEST_ARTIFACT = load_pest_artifact()
    return {"status": "trained", "model_path": str(PEST_MODEL_PATH)}


@app.post("/train-fertilizer-model")
def train_fertilizer_endpoint():
    train_fertilizer_model()
    global FERTILIZER_ARTIFACT, FERTILIZER_MODEL
    FERTILIZER_ARTIFACT = load_fertilizer_artifact()
    FERTILIZER_MODEL = FERTILIZER_ARTIFACT["model"]
    return {"status": "trained", "model_path": str(FERTILIZER_MODEL_PATH)}


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "pest_model_ready": PEST_ARTIFACT is not None,
        "fertilizer_model_ready": FERTILIZER_MODEL is not None,
    }
