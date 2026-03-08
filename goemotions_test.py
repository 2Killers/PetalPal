from datasets import load_dataset

ds = load_dataset("google-research-datasets/go_emotions", "simplified")

print(ds)
print(ds["train"][0])
print(ds["train"].features)