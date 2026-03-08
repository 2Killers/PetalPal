const natural = require("natural");
const path = require("path");

let classifierPromise = null;

function loadMoodModel() {
  if (classifierPromise) {
    return classifierPromise;
  }

  classifierPromise = new Promise((resolve, reject) => {
    natural.BayesClassifier.load(
      path.join(__dirname, "data", "mood-model.json"),
      null,
      (err, classifier) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(classifier);
      }
    );
  });

  return classifierPromise;
}

async function predictMood(text) {
  if (!text || !text.trim()) {
    return "calm";
  }

  const classifier = await loadMoodModel();
  return classifier.classify(text.trim());
}

module.exports = {
  predictMood,
  loadMoodModel
};