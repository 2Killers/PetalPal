const mood = require("../../public/moodAnalysis");

describe("moodAnalysis.js", () => {
  test("normalizeText lowercases and trims", () => {
    expect(mood.normalizeText("  HeLLo  ")).toBe("hello");
    expect(mood.normalizeText("")).toBe("");
    expect(mood.normalizeText(null)).toBe("");
  });

  test("includesAny returns true when keyword exists", () => {
    expect(mood.includesAny("i am stressed today", ["happy", "stressed"])).toBe(true);
  });

  test("includesAny returns false when no keyword exists", () => {
    expect(mood.includesAny("i am calm today", ["happy", "stressed"])).toBe(false);
  });

  test("analyzeMoodFromText returns empty string for empty input", () => {
    expect(mood.analyzeMoodFromText("")).toBe("");
  });

  test("detects stressed mood", () => {
    expect(
      mood.analyzeMoodFromText("I am overwhelmed by deadlines and quizzes")
    ).toBe("stressed");
  });

  test("detects tired mood", () => {
    expect(
      mood.analyzeMoodFromText("I feel sleepy and exhausted")
    ).toBe("tired");
  });

  test("detects sad mood", () => {
    expect(
      mood.analyzeMoodFromText("I cried and felt lonely")
    ).toBe("sad");
  });

  test("detects happy mood", () => {
    expect(
      mood.analyzeMoodFromText("I had an amazing successful day")
    ).toBe("happy");
  });

  test("detects calm mood", () => {
    expect(
      mood.analyzeMoodFromText("It was a peaceful and quiet afternoon")
    ).toBe("calm");
  });

  test("defaults to calm when no keywords match", () => {
    expect(
      mood.analyzeMoodFromText("I walked outside and ate noodles")
    ).toBe("calm");
  });
});