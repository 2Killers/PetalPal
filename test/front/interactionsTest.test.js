let interactions;

function flushPromises() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe("interactions.js", () => {
  beforeEach(() => {
    jest.resetModules();
    document.body.innerHTML = "";

    global.currentGardenView = [
      { id: 11, name: "Rose" },
      { id: 22, name: "Lily" }
    ];

    global.viewMode = "mine";
    global.currentVisitedFriendId = null;

    global.getCurrentUserId = jest.fn(() => "me-1");
    global.getCurrentUser = jest.fn(() => ({ name: "Jean" }));
    global.messageFlowerForUser = jest.fn().mockResolvedValue(undefined);
    global.supportFlowerForUser = jest.fn().mockResolvedValue(undefined);
    global.refreshCurrentView = jest.fn().mockResolvedValue(undefined);
    global.renderTodayFlower = jest.fn();
    global.getSelectedVisitorAvatar = jest.fn(() => "🐝");

    global.fetch = jest.fn().mockResolvedValue({ ok: true });
    global.alert = jest.fn();
    global.confirm = jest.fn(() => true);
    global.prompt = jest.fn(() => "Hello flower");

    jest.spyOn(console, "error").mockImplementation(() => {});

    interactions = require("../../public/interactions.js");

    interactions.__setTestState({
      friendMode: false,
      avatarEl: null,
      avatarX: 120,
      avatarY: 520,
      activeFlowerId: null
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("leaveMessage returns when prompt is empty", async () => {
    prompt.mockReturnValue("");

    await interactions.leaveMessage(0);

    expect(messageFlowerForUser).not.toHaveBeenCalled();
    expect(refreshCurrentView).not.toHaveBeenCalled();
  });

  test("leaveMessage returns when prompt is only spaces", async () => {
    prompt.mockReturnValue("   ");

    await interactions.leaveMessage(0);

    expect(messageFlowerForUser).not.toHaveBeenCalled();
  });

  test("leaveMessage returns when flower does not exist", async () => {
    await interactions.leaveMessage(99);

    expect(messageFlowerForUser).not.toHaveBeenCalled();
  });

  test("leaveMessage sends message in mine mode", async () => {
    prompt.mockReturnValue("  good luck  ");

    await interactions.leaveMessage(0);

    expect(messageFlowerForUser).toHaveBeenCalledWith(
      "me-1",
      11,
      "Jean",
      "good luck"
    );
    expect(refreshCurrentView).toHaveBeenCalled();
    expect(renderTodayFlower).toHaveBeenCalledWith(0);
  });

  test("leaveMessage uses Friend when current user missing", async () => {
    getCurrentUser.mockReturnValue(null);
    prompt.mockReturnValue("hello");

    await interactions.leaveMessage(0);

    expect(messageFlowerForUser).toHaveBeenCalledWith(
      "me-1",
      11,
      "Friend",
      "hello"
    );
  });

  test("leaveMessage uses visited friend id in friend mode", async () => {
    viewMode = "friend";
    currentVisitedFriendId = "friend-7";
    prompt.mockReturnValue("blessing");

    await interactions.leaveMessage(0);

    expect(messageFlowerForUser).toHaveBeenCalledWith(
      "friend-7",
      11,
      "Jean",
      "blessing"
    );
  });

  test("leaveMessage alerts on failure", async () => {
    messageFlowerForUser.mockRejectedValue(new Error("boom"));

    await interactions.leaveMessage(0);

    expect(alert).toHaveBeenCalledWith("Failed to leave message");
    expect(console.error).toHaveBeenCalled();
  });

  test("supportFlower returns when flower does not exist", async () => {
    await interactions.supportFlower(99);

    expect(supportFlowerForUser).not.toHaveBeenCalled();
  });

  test("supportFlower supports flower in mine mode", async () => {
    await interactions.supportFlower(0);

    expect(supportFlowerForUser).toHaveBeenCalledWith("me-1", 11);
    expect(refreshCurrentView).toHaveBeenCalled();
    expect(renderTodayFlower).toHaveBeenCalledWith(0);
  });

  test("supportFlower supports flower in friend mode", async () => {
    viewMode = "friend";
    currentVisitedFriendId = "friend-5";

    await interactions.supportFlower(1);

    expect(supportFlowerForUser).toHaveBeenCalledWith("friend-5", 22);
  });

  test("supportFlower alerts on failure", async () => {
    supportFlowerForUser.mockRejectedValue(new Error("boom"));

    await interactions.supportFlower(0);

    expect(alert).toHaveBeenCalledWith("Failed to support flower");
    expect(console.error).toHaveBeenCalled();
  });

  test("deleteFlower returns when flower does not exist", async () => {
    await interactions.deleteFlower(99);

    expect(fetch).not.toHaveBeenCalled();
  });

  test("deleteFlower blocks in friend mode", async () => {
    viewMode = "friend";

    await interactions.deleteFlower(0);

    expect(alert).toHaveBeenCalledWith("You can only delete flowers in your own garden 🌱");
    expect(fetch).not.toHaveBeenCalled();
  });

  test("deleteFlower returns when confirm is false", async () => {
    confirm.mockReturnValue(false);

    await interactions.deleteFlower(0);

    expect(fetch).not.toHaveBeenCalled();
  });

  test("deleteFlower deletes successfully", async () => {
    fetch.mockResolvedValue({ ok: true });

    await interactions.deleteFlower(0);

    expect(fetch).toHaveBeenCalledWith("/users/me-1/flowers/11", {
      method: "DELETE"
    });
    expect(refreshCurrentView).toHaveBeenCalled();
    expect(renderTodayFlower).toHaveBeenCalledWith();
  });

  test("deleteFlower alerts on failed response", async () => {
    fetch.mockResolvedValue({ ok: false });

    await interactions.deleteFlower(0);

    expect(alert).toHaveBeenCalledWith("Failed to delete flower");
    expect(console.error).toHaveBeenCalled();
  });

  test("createVisitorAvatar creates avatar in garden", () => {
    document.body.innerHTML = `<div id="garden"></div>`;

    interactions.createVisitorAvatar();

    const avatar = document.getElementById("avatar");
    expect(avatar).not.toBeNull();
    expect(avatar.textContent).toBe("🐝");
    expect(avatar.style.left).toBe("120px");
    expect(avatar.style.top).toBe("520px");
  });

  test("createVisitorAvatar replaces previous avatar", () => {
    document.body.innerHTML = `<div id="garden"></div>`;

    interactions.createVisitorAvatar();
    const first = document.getElementById("avatar");

    interactions.createVisitorAvatar();
    const avatars = document.querySelectorAll("#avatar");

    expect(avatars).toHaveLength(1);
    expect(document.getElementById("avatar")).not.toBe(first);
  });

  test("createVisitorAvatar does nothing when garden missing", () => {
    interactions.createVisitorAvatar();

    expect(document.getElementById("avatar")).toBeNull();
  });

  test("moveAvatar returns early when not in friend mode", async () => {
    document.body.innerHTML = `<div id="garden"></div>`;
    const avatar = document.createElement("div");

    interactions.__setTestState({
      friendMode: false,
      avatarEl: avatar
    });

    await interactions.moveAvatar(20, 20);

    expect(fetch).not.toHaveBeenCalled();
  });

  test("moveAvatar returns early when avatar missing", async () => {
    document.body.innerHTML = `<div id="garden"></div>`;

    interactions.__setTestState({
      friendMode: true,
      avatarEl: null
    });

    await interactions.moveAvatar(20, 20);

    expect(fetch).not.toHaveBeenCalled();
  });

  test("moveAvatar returns when garden missing", async () => {
    const avatar = document.createElement("div");

    interactions.__setTestState({
      friendMode: true,
      avatarEl: avatar
    });

    await interactions.moveAvatar(20, 20);

    expect(fetch).not.toHaveBeenCalled();
  });

  test("moveAvatar updates avatar position and posts visit move", async () => {
    document.body.innerHTML = `<div id="garden"></div>`;
    const garden = document.getElementById("garden");

    Object.defineProperty(garden, "clientWidth", {
      value: 400,
      configurable: true
    });
    Object.defineProperty(garden, "clientHeight", {
      value: 300,
      configurable: true
    });

    const avatar = document.createElement("div");
    garden.appendChild(avatar);

    viewMode = "friend";
    currentVisitedFriendId = "host-1";

    interactions.__setTestState({
      friendMode: true,
      avatarEl: avatar,
      avatarX: 100,
      avatarY: 100
    });

    await interactions.moveAvatar(20, -10);

    expect(avatar.style.left).toBe("120px");
    expect(avatar.style.top).toBe("90px");
    expect(fetch).toHaveBeenCalledWith(
      "/visit/move",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" }
      })
    );
  });

  test("moveAvatar clamps position inside garden", async () => {
    document.body.innerHTML = `<div id="garden"></div>`;
    const garden = document.getElementById("garden");

    Object.defineProperty(garden, "clientWidth", {
      value: 200,
      configurable: true
    });
    Object.defineProperty(garden, "clientHeight", {
      value: 150,
      configurable: true
    });

    const avatar = document.createElement("div");
    garden.appendChild(avatar);

    interactions.__setTestState({
      friendMode: true,
      avatarEl: avatar,
      avatarX: 190,
      avatarY: 140
    });

    await interactions.moveAvatar(100, 100);

    expect(avatar.style.left).toBe("160px");
    expect(avatar.style.top).toBe("110px");
  });

  test("moveAvatar handles fetch failure", async () => {
    document.body.innerHTML = `<div id="garden"></div>`;
    const garden = document.getElementById("garden");

    Object.defineProperty(garden, "clientWidth", {
      value: 400,
      configurable: true
    });
    Object.defineProperty(garden, "clientHeight", {
      value: 300,
      configurable: true
    });

    const avatar = document.createElement("div");
    garden.appendChild(avatar);

    viewMode = "friend";
    currentVisitedFriendId = "host-1";
    fetch.mockRejectedValue(new Error("network"));

    interactions.__setTestState({
      friendMode: true,
      avatarEl: avatar,
      avatarX: 50,
      avatarY: 50
    });

    await interactions.moveAvatar(10, 10);

    expect(console.error).toHaveBeenCalled();
  });

  test("checkNearbyFlower returns early when not in friend mode", () => {
    const avatar = document.createElement("div");

    interactions.__setTestState({
      friendMode: false,
      avatarEl: avatar
    });

    interactions.checkNearbyFlower();

    expect(interactions.__getTestState().activeFlowerId).toBeNull();
  });

  test("checkNearbyFlower returns early when avatar missing", () => {
    interactions.__setTestState({
      friendMode: true,
      avatarEl: null
    });

    interactions.checkNearbyFlower();

    expect(interactions.__getTestState().activeFlowerId).toBeNull();
  });

  test("checkNearbyFlower marks nearest flower active when close enough", () => {
    document.body.innerHTML = `
      <div id="garden">
        <div class="flower-card" data-id="101"></div>
        <div class="flower-card" data-id="202"></div>
      </div>
    `;

    const avatar = document.createElement("div");
    avatar.getBoundingClientRect = jest.fn(() => ({
      left: 100,
      top: 100,
      width: 20,
      height: 20
    }));

    const cards = document.querySelectorAll(".flower-card");

    cards[0].getBoundingClientRect = jest.fn(() => ({
      left: 110,
      top: 110,
      width: 40,
      height: 40
    }));

    cards[1].getBoundingClientRect = jest.fn(() => ({
      left: 400,
      top: 400,
      width: 40,
      height: 40
    }));

    interactions.__setTestState({
      friendMode: true,
      avatarEl: avatar,
      activeFlowerId: null
    });

    interactions.checkNearbyFlower();

    expect(cards[0].classList.contains("active")).toBe(true);
    expect(cards[1].classList.contains("active")).toBe(false);
    expect(interactions.__getTestState().activeFlowerId).toBe(101);
  });

  test("checkNearbyFlower leaves all flowers inactive when none close enough", () => {
    document.body.innerHTML = `
      <div id="garden">
        <div class="flower-card active" data-id="101"></div>
      </div>
    `;

    const avatar = document.createElement("div");
    avatar.getBoundingClientRect = jest.fn(() => ({
      left: 0,
      top: 0,
      width: 20,
      height: 20
    }));

    const card = document.querySelector(".flower-card");
    card.getBoundingClientRect = jest.fn(() => ({
      left: 500,
      top: 500,
      width: 40,
      height: 40
    }));

    interactions.__setTestState({
      friendMode: true,
      avatarEl: avatar,
      activeFlowerId: 101
    });

    interactions.checkNearbyFlower();

    expect(card.classList.contains("active")).toBe(false);
    expect(interactions.__getTestState().activeFlowerId).toBeNull();
  });

  test("setupGardenClickMove returns if garden missing", () => {
    expect(() => interactions.setupGardenClickMove()).not.toThrow();
  });

  test("setupGardenClickMove attaches click listener without crashing", () => {
    document.body.innerHTML = `<div id="garden"></div>`;

    expect(() => interactions.setupGardenClickMove()).not.toThrow();
  });

  test("setupGardenClickMove ignores click when not in friend mode", async () => {
    document.body.innerHTML = `<div id="garden"></div>`;
    const garden = document.getElementById("garden");
    const avatar = document.createElement("div");
    garden.appendChild(avatar);

    interactions.__setTestState({
      friendMode: false,
      avatarEl: avatar
    });

    interactions.setupGardenClickMove();

    garden.dispatchEvent(
      new MouseEvent("click", { bubbles: true, clientX: 50, clientY: 50 })
    );

    await flushPromises();
    expect(fetch).not.toHaveBeenCalled();
  });

  test("setupGardenClickMove ignores click on button", async () => {
    document.body.innerHTML = `
      <div id="garden">
        <button id="btn">click</button>
      </div>
    `;

    const garden = document.getElementById("garden");
    Object.defineProperty(garden, "clientWidth", {
      value: 400,
      configurable: true
    });
    Object.defineProperty(garden, "clientHeight", {
      value: 300,
      configurable: true
    });
    garden.getBoundingClientRect = jest.fn(() => ({
      left: 0,
      top: 0,
      width: 400,
      height: 300
    }));

    const avatar = document.createElement("div");
    garden.appendChild(avatar);

    interactions.__setTestState({
      friendMode: true,
      avatarEl: avatar
    });

    interactions.setupGardenClickMove();

    document.getElementById("btn").dispatchEvent(
      new MouseEvent("click", { bubbles: true, clientX: 80, clientY: 90 })
    );

    await flushPromises();
    expect(fetch).not.toHaveBeenCalled();
  });

  test("setupGardenClickMove ignores click on flower card", async () => {
    document.body.innerHTML = `
      <div id="garden">
        <div class="flower-card" id="flower"></div>
      </div>
    `;

    const garden = document.getElementById("garden");
    Object.defineProperty(garden, "clientWidth", {
      value: 400,
      configurable: true
    });
    Object.defineProperty(garden, "clientHeight", {
      value: 300,
      configurable: true
    });
    garden.getBoundingClientRect = jest.fn(() => ({
      left: 0,
      top: 0,
      width: 400,
      height: 300
    }));

    const avatar = document.createElement("div");
    garden.appendChild(avatar);

    interactions.__setTestState({
      friendMode: true,
      avatarEl: avatar
    });

    interactions.setupGardenClickMove();

    document.getElementById("flower").dispatchEvent(
      new MouseEvent("click", { bubbles: true, clientX: 50, clientY: 50 })
    );

    await flushPromises();
    expect(fetch).not.toHaveBeenCalled();
  });

  test("setupGardenClickMove moves avatar on empty garden click", async () => {
    document.body.innerHTML = `<div id="garden"></div>`;
    const garden = document.getElementById("garden");

    Object.defineProperty(garden, "clientWidth", {
      value: 400,
      configurable: true
    });
    Object.defineProperty(garden, "clientHeight", {
      value: 300,
      configurable: true
    });
    garden.getBoundingClientRect = jest.fn(() => ({
      left: 10,
      top: 20,
      width: 400,
      height: 300
    }));

    const avatar = document.createElement("div");
    garden.appendChild(avatar);

    viewMode = "friend";
    currentVisitedFriendId = "host-1";

    interactions.__setTestState({
      friendMode: true,
      avatarEl: avatar
    });

    interactions.setupGardenClickMove();

    garden.dispatchEvent(
      new MouseEvent("click", {
        bubbles: true,
        clientX: 100,
        clientY: 120
      })
    );

    await flushPromises();

    expect(avatar.style.left).toBe("74px");
    expect(avatar.style.top).toBe("84px");
    expect(fetch).toHaveBeenCalled();
  });

  test("setupGardenClickMove handles fetch failure", async () => {
    document.body.innerHTML = `<div id="garden"></div>`;
    const garden = document.getElementById("garden");

    Object.defineProperty(garden, "clientWidth", {
      value: 400,
      configurable: true
    });
    Object.defineProperty(garden, "clientHeight", {
      value: 300,
      configurable: true
    });
    garden.getBoundingClientRect = jest.fn(() => ({
      left: 0,
      top: 0,
      width: 400,
      height: 300
    }));

    const avatar = document.createElement("div");
    garden.appendChild(avatar);

    viewMode = "friend";
    currentVisitedFriendId = "host-1";
    fetch.mockRejectedValue(new Error("network"));

    interactions.__setTestState({
      friendMode: true,
      avatarEl: avatar
    });

    interactions.setupGardenClickMove();

    garden.dispatchEvent(
      new MouseEvent("click", {
        bubbles: true,
        clientX: 100,
        clientY: 100
      })
    );

    await flushPromises();

    expect(console.error).toHaveBeenCalled();
  });

  test("setupFriendFlowerActions support button click triggers support flow", async () => {
    document.body.innerHTML = `<button class="support-btn" data-index="1">support</button>`;

    interactions.setupFriendFlowerActions();
    document.querySelector(".support-btn").click();

    await flushPromises();

    expect(supportFlowerForUser).toHaveBeenCalledWith("me-1", 22);
  });

  test("setupFriendFlowerActions message button click triggers message flow", async () => {
    document.body.innerHTML = `<button class="message-btn" data-index="0">message</button>`;
    prompt.mockReturnValue("hello");

    interactions.setupFriendFlowerActions();
    document.querySelector(".message-btn").click();

    await flushPromises();

    expect(messageFlowerForUser).toHaveBeenCalledWith("me-1", 11, "Jean", "hello");
  });

  test("setupFriendFlowerActions ignores invalid support index", async () => {
    document.body.innerHTML = `<button class="support-btn" data-index="abc">support</button>`;

    interactions.setupFriendFlowerActions();
    document.querySelector(".support-btn").click();

    await flushPromises();

    expect(supportFlowerForUser).not.toHaveBeenCalled();
  });

  test("setupFriendFlowerActions ignores invalid message index", async () => {
    document.body.innerHTML = `<button class="message-btn" data-index="abc">message</button>`;

    interactions.setupFriendFlowerActions();
    document.querySelector(".message-btn").click();

    await flushPromises();

    expect(messageFlowerForUser).not.toHaveBeenCalled();
  });

  test("handleKeydown returns when not in friend mode", async () => {
    document.body.innerHTML = `<div id="garden"></div>`;
    const garden = document.getElementById("garden");

    Object.defineProperty(garden, "clientWidth", {
      value: 400,
      configurable: true
    });
    Object.defineProperty(garden, "clientHeight", {
      value: 300,
      configurable: true
    });

    const avatar = document.createElement("div");
    garden.appendChild(avatar);

    interactions.__setTestState({
      friendMode: false,
      avatarEl: avatar,
      avatarX: 100,
      avatarY: 100
    });

    await interactions.handleKeydown({ key: "ArrowUp" });

    expect(avatar.style.left).toBe("");
    expect(avatar.style.top).toBe("");
  });

  test("handleKeydown handles all arrow keys", async () => {
    document.body.innerHTML = `<div id="garden"></div>`;
    const garden = document.getElementById("garden");

    Object.defineProperty(garden, "clientWidth", {
      value: 400,
      configurable: true
    });
    Object.defineProperty(garden, "clientHeight", {
      value: 300,
      configurable: true
    });

    const avatar = document.createElement("div");
    garden.appendChild(avatar);

    interactions.__setTestState({
      friendMode: true,
      avatarEl: avatar,
      avatarX: 100,
      avatarY: 100
    });

    await interactions.handleKeydown({ key: "ArrowUp" });
    expect(avatar.style.left).toBe("100px");
    expect(avatar.style.top).toBe("80px");

    await interactions.handleKeydown({ key: "ArrowDown" });
    expect(avatar.style.left).toBe("100px");
    expect(avatar.style.top).toBe("100px");

    await interactions.handleKeydown({ key: "ArrowLeft" });
    expect(avatar.style.left).toBe("80px");
    expect(avatar.style.top).toBe("100px");

    await interactions.handleKeydown({ key: "ArrowRight" });
    expect(avatar.style.left).toBe("100px");
    expect(avatar.style.top).toBe("100px");
  });
});