const main = require("../../public/friends");

describe("main.js request helpers", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("set/get/clear current user id", () => {
    main.setCurrentUserId("u1");
    expect(main.getCurrentUserId()).toBe("u1");

    main.clearCurrentUserId();
    expect(main.getCurrentUserId()).toBeNull();
  });

  test("apiGet success", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true })
    });

    const result = await main.apiGet("/users");
    expect(global.fetch).toHaveBeenCalledWith("/users");
    expect(result).toEqual({ success: true });
  });

  test("apiGet failure", async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      json: async () => ({})
    });

    await expect(main.apiGet("/users")).rejects.toThrow("GET /users failed");
  });

  test("apiPost success", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ id: "u1" })
    });

    const result = await main.apiPost("/users", { name: "Alice" });

    expect(global.fetch).toHaveBeenCalledWith("/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name: "Alice" })
    });

    expect(result).toEqual({ id: "u1" });
  });

  test("apiPost failure with backend error", async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Bad request" })
    });

    await expect(main.apiPost("/users", {})).rejects.toThrow("Bad request");
  });

  test("apiDelete success", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ deleted: true })
    });

    const result = await main.apiDelete("/users/u1/flowers/f1");

    expect(global.fetch).toHaveBeenCalledWith("/users/u1/flowers/f1", {
      method: "DELETE"
    });

    expect(result).toEqual({ deleted: true });
  });

  test("apiDelete failure", async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Delete failed" })
    });

    await expect(main.apiDelete("/bad")).rejects.toThrow("Delete failed");
  });

  test("fetchAllUsers hits /users", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => []
    });

    await main.fetchAllUsers();
    expect(global.fetch).toHaveBeenCalledWith("/users");
  });

  test("fetchUser hits correct endpoint", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ id: "u1" })
    });

    await main.fetchUser("u1");
    expect(global.fetch).toHaveBeenCalledWith("/users/u1");
  });

  test("fetchFriends hits correct endpoint", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => []
    });

    await main.fetchFriends("u1");
    expect(global.fetch).toHaveBeenCalledWith("/users/u1/friends");
  });

  test("fetchGarden hits correct endpoint", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ flowers: [] })
    });

    await main.fetchGarden("u1");
    expect(global.fetch).toHaveBeenCalledWith("/users/u1/garden");
  });

  test("createUser hits correct endpoint", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ id: "u1" })
    });

    await main.createUser("Alice", "🦋");

    expect(global.fetch).toHaveBeenCalledWith("/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name: "Alice", avatar: "🦋" })
    });
  });

  test("addFriend hits correct endpoint", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true })
    });

    await main.addFriend("u1", "u2");

    expect(global.fetch).toHaveBeenCalledWith("/friends/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ userId: "u1", friendId: "u2" })
    });
  });

  test("removeFriend hits correct endpoint", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true })
    });

    await main.removeFriend("u1", "u2");

    expect(global.fetch).toHaveBeenCalledWith("/friends/remove", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ userId: "u1", friendId: "u2" })
    });
  });

  test("createFlowerForUser hits correct endpoint", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ id: "f1" })
    });

    await main.createFlowerForUser("u1", "happy", "great day");

    expect(global.fetch).toHaveBeenCalledWith("/users/u1/flowers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ mood: "happy", event: "great day" })
    });
  });

  test("supportFlowerForUser hits correct endpoint", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true })
    });

    await main.supportFlowerForUser("u1", "f1");

    expect(global.fetch).toHaveBeenCalledWith("/users/u1/flowers/f1/support", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({})
    });
  });

  test("messageFlowerForUser hits correct endpoint", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true })
    });

    await main.messageFlowerForUser("u1", "f1", "Alice", "hi");

    expect(global.fetch).toHaveBeenCalledWith("/users/u1/flowers/f1/message", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        author: "Alice",
        text: "hi"
      })
    });
  });

  test("deleteFlowerForUser hits correct endpoint", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ deleted: true })
    });

    await main.deleteFlowerForUser("u1", "f1");

    expect(global.fetch).toHaveBeenCalledWith("/users/u1/flowers/f1", {
      method: "DELETE"
    });
  });

  test("startVisit uses selected visitor avatar", async () => {
    global.getSelectedVisitorAvatar = jest.fn(() => "🐝");
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true })
    });

    await main.startVisit("host1", "visitor1", 10, 20);

    expect(global.fetch).toHaveBeenCalledWith("/visit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        hostUserId: "host1",
        visitorUserId: "visitor1",
        visitorAvatar: "🐝",
        x: 10,
        y: 20
      })
    });
  });

  test("moveVisit falls back to butterfly", async () => {
    delete global.getSelectedVisitorAvatar;
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true })
    });

    await main.moveVisit("host1", "visitor1", 30, 40);

    expect(global.fetch).toHaveBeenCalledWith("/visit/move", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        hostUserId: "host1",
        visitorUserId: "visitor1",
        visitorAvatar: "🦋",
        x: 30,
        y: 40
      })
    });
  });

  test("leaveVisit falls back to butterfly", async () => {
    delete global.getSelectedVisitorAvatar;
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true })
    });

    await main.leaveVisit("host1", "visitor1");

    expect(global.fetch).toHaveBeenCalledWith("/leave", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        hostUserId: "host1",
        visitorUserId: "visitor1",
        visitorAvatar: "🦋"
      })
    });
  });
});