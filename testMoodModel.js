const { predictMood } = require("./moodClassifier");

async function run() {
  console.log("I passed the exam ->", await predictMood("I passed the exam"));
  console.log("I feel so lonely today ->", await predictMood("I feel so lonely today"));
  console.log("I have too much homework ->", await predictMood("I have too much homework"));
  console.log("I am exhausted ->", await predictMood("I am exhausted"));
}

run();