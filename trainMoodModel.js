const fs = require("fs");
const natural = require("natural");

const raw = fs.readFileSync("./data/moodTrainingData.json", "utf8");
const trainingData = JSON.parse(raw);

const classifier = new natural.BayesClassifier();

for (const item of trainingData) {
  if (item.text && item.label) {
    classifier.addDocument(item.text, item.label);
  }
}

classifier.train();

classifier.save("./data/mood-model.json", (err) => {
  if (err) {
    console.error("Failed to save model:", err);
    return;
  }
  console.log("Mood model trained and saved to data/mood-model.json");
});