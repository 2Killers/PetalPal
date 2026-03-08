import json
from datasets import load_dataset

ds = load_dataset("google-research-datasets/go_emotions", "simplified")

label_names = ds["train"].features["labels"].feature.names

petalpal_map = {
    "admiration": "happy",
    "amusement": "happy",
    "approval": "happy",
    "excitement": "happy",
    "gratitude": "happy",
    "joy": "happy",
    "love": "happy",
    "optimism": "happy",
    "pride": "happy",
    "surprise": "happy",

    "caring": "calm",
    "curiosity": "calm",
    "desire": "calm",
    "relief": "calm",
    "neutral": "calm",

    "realization": "tired",
    "confusion": "tired",
    "embarrassment": "tired",

    "disappointment": "sad",
    "grief": "sad",
    "remorse": "sad",
    "sadness": "sad",

    "anger": "stressed",
    "annoyance": "stressed",
    "disapproval": "stressed",
    "disgust": "stressed",
    "fear": "stressed",
    "nervousness": "stressed"
}

result = []

for item in ds["train"]:
    if len(item["labels"]) != 1:
        continue

    original_label = label_names[item["labels"][0]]

    if original_label not in petalpal_map:
        continue

    result.append({
        "text": item["text"],
        "label": petalpal_map[original_label]
    })

with open("data/moodTrainingData.json", "w", encoding="utf-8") as f:
    json.dump(result, f, ensure_ascii=False, indent=2)

print(f"Saved {len(result)} examples to data/moodTrainingData.json")