let visitorModule;

describe("visitors.js", () => {
  beforeEach(() => {
    jest.resetModules();
    visitorModule = require("../../public/visitors.js");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("getSelectedVisitorAvatar returns default avatar", () => {
    expect(visitorModule.getSelectedVisitorAvatar()).toBe("🦋");
  });

  test("setVisitorAvatar updates selected avatar", () => {
    visitorModule.setVisitorAvatar("🐝");
    expect(visitorModule.getSelectedVisitorAvatar()).toBe("🐝");
  });

  test("getRandomVisitor returns first visitor when Math.random is 0", () => {
    jest.spyOn(Math, "random").mockReturnValue(0);
    expect(visitorModule.getRandomVisitor()).toBe("🐦");
  });

  test("getRandomVisitor returns second visitor when Math.random maps to index 1", () => {
    jest.spyOn(Math, "random").mockReturnValue(0.4);
    expect(visitorModule.getRandomVisitor()).toBe("🐝");
  });

  test("getRandomVisitor returns third visitor when Math.random maps to index 2", () => {
    jest.spyOn(Math, "random").mockReturnValue(0.9);
    expect(visitorModule.getRandomVisitor()).toBe("🦋");
  });

  test("getRandomVisitor always returns one of the allowed visitors", () => {
    jest.spyOn(Math, "random").mockReturnValue(0.2);
    expect(["🐦", "🐝", "🦋"]).toContain(visitorModule.getRandomVisitor());

    Math.random.mockReturnValue(0.5);
    expect(["🐦", "🐝", "🦋"]).toContain(visitorModule.getRandomVisitor());

    Math.random.mockReturnValue(0.99);
    expect(["🐦", "🐝", "🦋"]).toContain(visitorModule.getRandomVisitor());
  });
});