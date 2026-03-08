const interactions = require("../../public/interactions");

describe("interactions.js", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="garden"></div>
      <div class="flower-card" data-id="101" data-index="0"></div>
      <button class="support-btn" data-index="0">Support</button>
      <button class="message-btn" data-index="0">Message</button>
    `;

    global.currentGardenView = [
      {
        id: 101,
        name: "Sunflower",
        messages: []
      }
    ];

    global.viewMode = "mine";
    global.currentVisitedFriendId = "friend1";

    global.getCurrentUserId = jest.fn(() => "u1");
    global.getCurrentUser = jest.fn(() => ({ name: "Alice" }));

    global.messageFlowerForUser = jest.fn(() => Promise.resolve());
    global.supportFlowerForUser = jest.fn(() => Promise.resolve());

    global.refreshCurrentView = jest.fn(() => Promise.resolve());
    global.renderTodayFlower = jest.fn();

    global.getSelectedVisitorAvatar = jest.fn(() => "🦋");

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ success: true })
      })
    );

    global.alert = jest.fn();
    global.prompt = jest.fn();
    global.confirm = jest.fn();

    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  test("leaveMessage returns when prompt is empty", async () => {
    global.prompt.mockReturnValue("");

    await interactions.leaveMessage(0);

    expect(global.messageFlowerForUser).not.toHaveBeenCalled();
  });

  test("leaveMessage returns when prompt is only spaces", async () => {
    global.prompt.mockReturnValue("   ");

    await interactions.leaveMessage(0);

    expect(global.messageFlowerForUser).not.toHaveBeenCalled();
  });

  test("leaveMessage returns when flower does not exist", async () => {
    global.prompt.mockReturnValue("hello");

    await interactions.leaveMessage(99);

    expect(global.messageFlowerForUser).not.toHaveBeenCalled();
  });

  test("leaveMessage sends message in mine mode", async () => {
    global.prompt.mockReturnValue("Be happy");

    await interactions.leaveMessage(0);

    expect(global.messageFlowerForUser).toHaveBeenCalledWith(
      "u1",
      101,
      "Alice",
      "Be happy"
    );
    expect(global.refreshCurrentView).toHaveBeenCalled();
    expect(global.renderTodayFlower).toHaveBeenCalledWith(0);
  });

  test("leaveMessage uses Friend when current user missing", async () => {
    global.prompt.mockReturnValue("Good luck");
    global.getCurrentUser.mockReturnValue(null);

    await interactions.leaveMessage(0);

    expect(global.messageFlowerForUser).toHaveBeenCalledWith(
      "u1",
      101,
      "Friend",
      "Good luck"
    );
  });

  test("leaveMessage uses visited friend id in friend mode", async () => {
    global.viewMode = "friend";
    global.prompt.mockReturnValue("Good luck");

    await interactions.leaveMessage(0);

    expect(global.messageFlowerForUser).toHaveBeenCalledWith(
      "friend1",
      101,
      "Alice",
      "Good luck"
    );
  });

  test("leaveMessage alerts on failure", async () => {
    global.prompt.mockReturnValue("hello");
    global.messageFlowerForUser.mockRejectedValue(new Error("fail"));

    await interactions.leaveMessage(0);

    expect(global.alert).toHaveBeenCalledWith("Failed to leave message");
    expect(console.error).toHaveBeenCalled();
  });

  test("supportFlower returns when flower does not exist", async () => {
    await interactions.supportFlower(99);

    expect(global.supportFlowerForUser).not.toHaveBeenCalled();
  });

  test("supportFlower supports flower in mine mode", async () => {
    await interactions.supportFlower(0);

    expect(global.supportFlowerForUser).toHaveBeenCalledWith("u1", 101);
    expect(global.refreshCurrentView).toHaveBeenCalled();
    expect(global.renderTodayFlower).toHaveBeenCalledWith(0);
  });

  test("supportFlower supports flower in friend mode", async () => {
    global.viewMode = "friend";

    await interactions.supportFlower(0);

    expect(global.supportFlowerForUser).toHaveBeenCalledWith("friend1", 101);
  });

  test("supportFlower alerts on failure", async () => {
    global.supportFlowerForUser.mockRejectedValue(new Error("fail"));

    await interactions.supportFlower(0);

    expect(global.alert).toHaveBeenCalledWith("Failed to support flower");
    expect(console.error).toHaveBeenCalled();
  });

  test("deleteFlower returns when flower does not exist", async () => {
    await interactions.deleteFlower(99);

    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("deleteFlower blocks in friend mode", async () => {
    global.viewMode = "friend";

    await interactions.deleteFlower(0);

    expect(global.alert).toHaveBeenCalledWith(
      "You can only delete flowers in your own garden 🌱"
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("deleteFlower returns when confirm is false", async () => {
    global.confirm.mockReturnValue(false);

    await interactions.deleteFlower(0);

    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("deleteFlower deletes successfully", async () => {
    global.confirm.mockReturnValue(true);

    await interactions.deleteFlower(0);

    expect(global.fetch).toHaveBeenCalledWith("/users/u1/flowers/101", {
      method: "DELETE"
    });
    expect(global.refreshCurrentView).toHaveBeenCalled();
    expect(global.renderTodayFlower).toHaveBeenCalled();
  });

  test("deleteFlower alerts on failed response", async () => {
    global.confirm.mockReturnValue(true);
    global.fetch.mockResolvedValue({ ok: false });

    await interactions.deleteFlower(0);

    expect(global.alert).toHaveBeenCalledWith("Failed to delete flower");
    expect(console.error).toHaveBeenCalled();
  });

  test("createVisitorAvatar creates avatar in garden", () => {
    interactions.createVisitorAvatar();

    const avatar = document.getElementById("avatar");
    expect(avatar).not.toBeNull();
    expect(avatar.textContent).toBe("🦋");
    expect(avatar.style.left).toBe("120px");
    expect(avatar.style.top).toBe("520px");
  });

  test("createVisitorAvatar replaces previous avatar", () => {
    interactions.createVisitorAvatar();
    interactions.createVisitorAvatar();

    const avatars = document.querySelectorAll("#avatar");
    expect(avatars.length).toBe(1);
  });

  test("createVisitorAvatar does nothing when garden missing", () => {
    document.body.innerHTML = "";

    expect(() => interactions.createVisitorAvatar()).not.toThrow();
    expect(document.getElementById("avatar")).toBeNull();
  });

  test("moveAvatar returns early when not in friend mode", async () => {
    await expect(interactions.moveAvatar(10, 20)).resolves.toBeUndefined();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("checkNearbyFlower returns early when not in friend mode", () => {
    expect(() => interactions.checkNearbyFlower()).not.toThrow();

    const card = document.querySelector(".flower-card");
    expect(card.classList.contains("active")).toBe(false);
  });

  test("setupGardenClickMove returns if garden missing", () => {
    document.body.innerHTML = "";

    expect(() => interactions.setupGardenClickMove()).not.toThrow();
  });

  test("setupGardenClickMove attaches click listener without crashing", () => {
    expect(() => interactions.setupGardenClickMove()).not.toThrow();

    const garden = document.getElementById("garden");
    garden.click();

    expect(garden).not.toBeNull();
  });

  test("setupFriendFlowerActions message button click triggers message flow", async () => {
    global.prompt.mockReturnValue("Hello");
  
    interactions.setupFriendFlowerActions();
  
    document.querySelector(".message-btn").click();
  
    await Promise.resolve();
  
    expect(global.messageFlowerForUser).toHaveBeenCalledWith(
      "u1",
      101,
      "Alice",
      "Hello"
    );
  });
  
  test("setupFriendFlowerActions support button click triggers support flow", async () => {
    interactions.setupFriendFlowerActions();
  
    document.querySelector(".support-btn").click();
  
    await Promise.resolve();
  
    expect(global.supportFlowerForUser).toHaveBeenCalledWith("u1", 101);
  });
});
