/**
 * @jest-environment jsdom
 */

const { renderGarden } = require("../../public/renderGarden");

describe("renderGarden", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="garden"></div>
      <div id="todayFlower"></div>
    `;

    const gardenDiv = document.getElementById("garden");

    Object.defineProperty(gardenDiv, "clientWidth", {
      configurable: true,
      value: 700
    });

    Object.defineProperty(gardenDiv, "clientHeight", {
      configurable: true,
      value: 760
    });

    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: 1200
    });

    window.getComputedStyle = jest.fn(() => ({
      paddingLeft: "0",
      paddingRight: "0",
      paddingTop: "0",
      paddingBottom: "0"
    }));

    global.currentGardenView = [
      {
        id: 1,
        name: "Sunny",
        meaning: "Hope",
        mood: "happy",
        date: "2026-03-07",
        event: "Had a good day",
        supportCount: 3,
        left: 100,
        top: 300,
        messages: [{ text: "You got this!" }]
      },
      {
        id: 2,
        name: "Blue",
        meaning: "Peace",
        mood: "calm",
        date: "2026-03-07",
        event: "Relaxing",
        supportCount: 1,
        left: 300,
        top: 400,
        messages: []
      }
    ];

    global.friendMode = false;
    global.viewMode = "own";
    global.selectedFlowerId = null;
    global.avatarEl = document.createElement("div");
    global.currentViewedGardenData = null;

    global.renderTodayFlower = jest.fn();
    global.createVisitorAvatar = jest.fn();
    global.setupGardenClickMove = jest.fn();
    global.checkNearbyFlower = jest.fn();
    global.getCurrentUserId = jest.fn(() => "me");
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("renders flower cards for all flowers", () => {
    renderGarden();

    const cards = document.querySelectorAll(".flower-card");
    expect(cards.length).toBe(2);
  });

  test("renders flower information correctly", () => {
    renderGarden();

    const firstCard = document.querySelector(".flower-card");
    expect(firstCard.textContent).toContain("Sunny");
    expect(firstCard.textContent).toContain("Flower meaning: Hope");
    expect(firstCard.textContent).toContain("Mood: happy");
    expect(firstCard.textContent).toContain("Event: Had a good day");
    expect(firstCard.textContent).toContain("Support: 3");
    expect(firstCard.textContent).toContain("Message: You got this!");
  });

  test('shows "No message yet" when there are no messages', () => {
    renderGarden();

    const cards = document.querySelectorAll(".flower-card");
    expect(cards[1].textContent).toContain("Message: No message yet");
  });

  test("renders correct flower image based on mood", () => {
    renderGarden();

    const imgs = document.querySelectorAll(".flower-img");
    expect(imgs[0].getAttribute("style")).toContain("/assets/sunflower.png");
    expect(imgs[1].getAttribute("style")).toContain("/assets/blue.png");
  });

  test("clicking a flower in own mode sets selectedFlowerId and updates todayFlower", () => {
  renderGarden();

  const firstCard = document.querySelector(".flower-card");
  firstCard.click();

  expect(global.selectedFlowerId).toBe(1);

  const todayFlowerDiv = document.getElementById("todayFlower");
  expect(todayFlowerDiv.textContent).toContain("Today's Flower");
  expect(todayFlowerDiv.textContent).toContain("Sunny");
  expect(todayFlowerDiv.textContent).toContain("Mood: happy");
});

  test("does not render friend buttons in own mode", () => {
    global.friendMode = false;

    renderGarden();

    expect(document.querySelector(".support-btn")).toBeNull();
    expect(document.querySelector(".message-btn")).toBeNull();
  });

  test("renders friend buttons in friend mode", () => {
    global.friendMode = true;
    global.viewMode = "friend";

    renderGarden();

    expect(document.querySelectorAll(".support-btn").length).toBe(2);
    expect(document.querySelectorAll(".message-btn").length).toBe(2);
  });

  test("calls friend mode helper functions in friend mode", () => {
    global.friendMode = true;
    global.viewMode = "friend";

    renderGarden();

    expect(global.createVisitorAvatar).toHaveBeenCalled();
    expect(global.setupGardenClickMove).toHaveBeenCalled();
    expect(global.checkNearbyFlower).toHaveBeenCalled();
  });

  test("renders remote visitors except current user", () => {
    global.friendMode = true;
    global.viewMode = "friend";
    global.currentViewedGardenData = {
      activeVisitors: [
        { visitorId: "me", name: "Me", avatar: "🦋", x: 100, y: 100 },
        { visitorId: "u2", name: "Alex", avatar: "🐝", x: 200, y: 250 }
      ]
    };

    renderGarden();

    const visitors = document.querySelectorAll(".remote-visitor-avatar");
    expect(visitors.length).toBe(1);
    expect(visitors[0].textContent).toBe("🐝");
    expect(visitors[0].title).toBe("Alex is visiting");
  });

  test("clears old garden content before rendering", () => {
    const gardenDiv = document.getElementById("garden");
    gardenDiv.innerHTML = `<p id="old-node">old content</p>`;

    renderGarden();

    expect(document.getElementById("old-node")).toBeNull();
    expect(document.querySelectorAll(".flower-card").length).toBe(2);
  });
});