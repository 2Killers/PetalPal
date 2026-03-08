function normalizeText(text) {
  return (text || "").toLowerCase().trim();
}

function includesAny(text, keywords) {
  return keywords.some((word) => text.includes(word));
}

function analyzeMoodFromText(eventText) {
  const text = normalizeText(eventText);

  if (!text) {
    return "";
  }

  const moodRules = [
    {
      mood: "stressed",
      keywords: [
        "stress",
        "stressed",
        "busy",
        "deadline",
        "deadlines",
        "anxious",
        "anxiety",
        "worried",
        "worry",
        "panic",
        "panicked",
        "pressure",
        "overwhelmed",
        "exam",
        "midterm",
        "midterms",
        "final",
        "finals",
        "assignment",
        "assignments",
        "quiz",
        "quizzes"
      ]
    },
    {
      mood: "tired",
      keywords: [
        "tired",
        "sleepy",
        "exhausted",
        "drained",
        "worn out",
        "no energy",
        "fatigue",
        "fatigued",
        "burnt out",
        "burned out"
      ]
    },
    {
      mood: "sad",
      keywords: [
        "sad",
        "cry",
        "cried",
        "crying",
        "upset",
        "lonely",
        "miss",
        "missed",
        "hurt",
        "heartbroken",
        "depressed",
        "down",
        "bad day",
        "unhappy",
        "miserable"
      ]
    },
    {
      mood: "happy",
      keywords: [
        "happy",
        "excited",
        "great",
        "good",
        "fun",
        "love",
        "loved",
        "amazing",
        "awesome",
        "wonderful",
        "celebrate",
        "celebrated",
        "success",
        "successful",
        "interview",
        "interview went well"
      ]
    },
    {
      mood: "calm",
      keywords: [
        "calm",
        "peace",
        "peaceful",
        "quiet",
        "relaxed",
        "relaxing",
        "gentle",
        "comfortable",
        "restful",
        "rested",
        "stable"
      ]
    }
  ];

  for (const rule of moodRules) {
    if (includesAny(text, rule.keywords)) {
      return rule.mood;
    }
  }

  return "calm";
}
if (typeof module !== "undefined") {
  module.exports = {
    normalizeText,
    includesAny,
    analyzeMoodFromText
  };
}