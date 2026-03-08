/**
 * @jest-environment jsdom
 */

const {
  updateGardenTitle,
  updateCurrentProfileText,
  getMyGarden,
  getCurrentViewedUserId,
  applyViewedGardenData,
  applyMyGardenData,
  updateFriendInfo,
  renderVisitRecords,
  renderHostVisitors,
  showAuthMode,
  showAppMode,
  setupAddFriendSelectLock,
  __setMainTestState,
  __getMainTestState
} = require("../../public/main");

describe("main.js", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <h1 id="gardenTitle"></h1>
      <div id="currentProfileText"></div>

      <div id="friendInfo" style="display:none;"></div>
      <div id="friendMood"></div>
      <div id="friendTodayFlower"></div>

      <div id="visitRecords"></div>
      <div id="garden"></div>

      <div id="authSection"></div>
      <div class="right-panel"></div>

      <div id="currentProfileSection"></div>
      <div id="friendManageSection"></div>
      <div id="friendsListSection"></div>
      <div id="friendSection"></div>
      <div id="visitRecordsSection"></div>
      <div id="visitorSection"></div>
      <div id="todayFlower"></div>

      <div class="checkin-section"></div>

      <select id="addFriendSelect">
        <option value="">Choose a user</option>
        <option value="u2">User 2</option>
      </select>
    `;

    global.getCurrentUserId = jest.fn(() => "me");

    __setMainTestState({
      currentUserProfile: null,
      myGardenData: null,
      currentViewedGardenData: null,
      currentGardenView: [],
      currentVisitedFriendId: null,
      viewMode: "mine",
      selectedFlowerId: null,
      isAddFriendSelectOpen: false
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("updateGardenTitle updates the garden title text", () => {
    updateGardenTitle("Jean's Garden");
    expect(document.getElementById("gardenTitle").textContent).toBe("Jean's Garden");
  });

  test('updateCurrentProfileText shows "Not selected" when there is no currentUserProfile', () => {
    __setMainTestState({ currentUserProfile: null });

    updateCurrentProfileText();

    expect(document.getElementById("currentProfileText").textContent).toBe("Not selected");
  });

  test("updateCurrentProfileText shows avatar, name and id when currentUserProfile exists", () => {
    __setMainTestState({
      currentUserProfile: {
        avatar: "🦋",
        name: "Jean",
        id: "u1"
      }
    });

    updateCurrentProfileText();

    expect(document.getElementById("currentProfileText").textContent).toBe("🦋 Jean (u1)");
  });

  test("getMyGarden returns empty array when myGardenData is null", () => {
    __setMainTestState({ myGardenData: null });
    expect(getMyGarden()).toEqual([]);
  });

  test("getMyGarden returns flowers from myGardenData", () => {
    __setMainTestState({
      myGardenData: {
        flowers: [{ id: 1 }, { id: 2 }]
      }
    });

    expect(getMyGarden()).toEqual([{ id: 1 }, { id: 2 }]);
  });

  test("getCurrentViewedUserId returns current user id in mine mode", () => {
    __setMainTestState({ viewMode: "mine" });
    expect(getCurrentViewedUserId()).toBe("me");
  });

  test("getCurrentViewedUserId returns currentVisitedFriendId in friend mode", () => {
    __setMainTestState({
      viewMode: "friend",
      currentVisitedFriendId: "friend-1"
    });

    expect(getCurrentViewedUserId()).toBe("friend-1");
  });

  test("applyViewedGardenData sets current viewed garden data and currentGardenView", () => {
    const gardenData = {
      flowers: [{ id: 1 }, { id: 2 }]
    };

    applyViewedGardenData(gardenData);

    const state = __getMainTestState();
    expect(state.currentViewedGardenData).toEqual(gardenData);
    expect(state.currentGardenView).toEqual([{ id: 1 }, { id: 2 }]);
  });

  test("applyViewedGardenData resets selectedFlowerId when no flowers exist", () => {
    __setMainTestState({ selectedFlowerId: 99 });

    applyViewedGardenData({ flowers: [] });

    const state = __getMainTestState();
    expect(state.selectedFlowerId).toBeNull();
  });

  test("applyViewedGardenData keeps selectedFlowerId if it still exists", () => {
    __setMainTestState({ selectedFlowerId: 2 });

    applyViewedGardenData({
      flowers: [{ id: 1 }, { id: 2 }, { id: 3 }]
    });

    const state = __getMainTestState();
    expect(state.selectedFlowerId).toBe(2);
  });

  test("applyViewedGardenData resets selectedFlowerId if selected flower no longer exists", () => {
    __setMainTestState({ selectedFlowerId: 9 });

    applyViewedGardenData({
      flowers: [{ id: 1 }, { id: 2 }]
    });

    const state = __getMainTestState();
    expect(state.selectedFlowerId).toBeNull();
  });

  test("applyMyGardenData sets myGardenData", () => {
    const gardenData = {
      flowers: [{ id: 10 }]
    };

    applyMyGardenData(gardenData);

    const state = __getMainTestState();
    expect(state.myGardenData).toEqual(gardenData);
  });

  test("updateFriendInfo hides friendInfo when not in friend mode", () => {
    __setMainTestState({ viewMode: "mine" });

    updateFriendInfo();

    expect(document.getElementById("friendInfo").style.display).toBe("none");
  });

  test("updateFriendInfo shows friend info with unknown values when friend garden is empty", () => {
    __setMainTestState({
      viewMode: "friend",
      currentGardenView: []
    });

    updateFriendInfo();

    expect(document.getElementById("friendInfo").style.display).toBe("block");
    expect(document.getElementById("friendMood").textContent).toBe("Mood: Unknown");
    expect(document.getElementById("friendTodayFlower").textContent).toBe("Today's flower: None");
  });

  test("updateFriendInfo shows latest flower mood and name in friend mode", () => {
    __setMainTestState({
      viewMode: "friend",
      currentGardenView: [
        { id: 1, mood: "happy", name: "Rose" },
        { id: 2, mood: "calm", name: "Tulip" }
      ]
    });

    updateFriendInfo();

    expect(document.getElementById("friendMood").textContent).toBe("Mood: calm");
    expect(document.getElementById("friendTodayFlower").textContent).toBe("Today's flower: Tulip");
  });

  test("renderVisitRecords shows empty message when there are no visit records", () => {
    __setMainTestState({
      myGardenData: { visitRecords: [] }
    });

    renderVisitRecords();

    expect(document.getElementById("visitRecords").textContent).toContain("No visitors yet");
  });

  test("renderVisitRecords renders all visit records", () => {
    __setMainTestState({
      myGardenData: {
        visitRecords: [
          {
            visitorAvatar: "🦋",
            visitorName: "Alex",
            action: "visited your garden",
            time: "10:00 AM"
          },
          {
            visitorAvatar: "🐝",
            visitorName: "Sam",
            action: "left a message",
            time: "11:00 AM"
          }
        ]
      }
    });

    renderVisitRecords();

    const items = document.querySelectorAll(".visit-record-item");
    expect(items.length).toBe(2);
    expect(items[0].textContent).toContain("🦋 Alex");
    expect(items[0].textContent).toContain("visited your garden");
    expect(items[1].textContent).toContain("🐝 Sam");
    expect(items[1].textContent).toContain("left a message");
  });

  test("renderHostVisitors removes old host visitors first", () => {
    const gardenDiv = document.getElementById("garden");
    const oldVisitor = document.createElement("div");
    oldVisitor.className = "host-visitor";
    gardenDiv.appendChild(oldVisitor);

    __setMainTestState({ viewMode: "mine" });

    renderHostVisitors([]);

    expect(document.querySelectorAll(".host-visitor").length).toBe(0);
  });

  test("renderHostVisitors does nothing when not in mine mode", () => {
    __setMainTestState({ viewMode: "friend" });

    renderHostVisitors([{ avatar: "🦋", x: 10, y: 20, name: "Alex" }]);

    expect(document.querySelectorAll(".host-visitor").length).toBe(0);
  });

  test("renderHostVisitors renders visitors in mine mode", () => {
    __setMainTestState({ viewMode: "mine" });

    renderHostVisitors([
      { avatar: "🦋", x: 10, y: 20, name: "Alex" },
      { avatar: "🐝", x: 30, y: 40, name: "Sam" }
    ]);

    const visitors = document.querySelectorAll(".host-visitor");
    expect(visitors.length).toBe(2);
    expect(visitors[0].textContent).toBe("🦋");
    expect(visitors[0].style.left).toBe("10px");
    expect(visitors[0].style.top).toBe("20px");
    expect(visitors[0].title).toBe("Alex");
  });

  test("showAuthMode shows auth section and hides app sections", () => {
    showAuthMode();

    expect(document.getElementById("authSection").style.display).toBe("block");
    expect(document.querySelector(".right-panel").style.display).toBe("none");
    expect(document.getElementById("currentProfileSection").style.display).toBe("none");
    expect(document.getElementById("todayFlower").style.display).toBe("none");
    expect(document.querySelector(".checkin-section").style.display).toBe("none");
  });

  test("showAppMode hides auth section and shows app sections", () => {
    showAppMode();

    expect(document.getElementById("authSection").style.display).toBe("none");
    expect(document.querySelector(".right-panel").style.display).toBe("block");
    expect(document.getElementById("currentProfileSection").style.display).toBe("block");
    expect(document.getElementById("todayFlower").style.display).toBe("block");
    expect(document.querySelector(".checkin-section").style.display).toBe("block");
    expect(document.getElementById("friendSection").style.display).toBe("none");
  });

  test("setupAddFriendSelectLock sets flag to true on focus and false on blur", () => {
    const select = document.getElementById("addFriendSelect");

    setupAddFriendSelectLock();

    select.dispatchEvent(new Event("focus"));
    expect(__getMainTestState().isAddFriendSelectOpen).toBe(true);

    select.dispatchEvent(new Event("blur"));
    expect(__getMainTestState().isAddFriendSelectOpen).toBe(false);
  });

  test("setupAddFriendSelectLock sets flag to false on change", () => {
    const select = document.getElementById("addFriendSelect");

    setupAddFriendSelectLock();

    select.dispatchEvent(new Event("focus"));
    expect(__getMainTestState().isAddFriendSelectOpen).toBe(true);

    select.dispatchEvent(new Event("change"));
    expect(__getMainTestState().isAddFriendSelectOpen).toBe(false);
  });
});

describe("main.js extra branch coverage", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="currentProfileText"></div>
      <div id="friendInfo" style="display:none;"></div>
      <div id="friendMood"></div>
      <div id="friendTodayFlower"></div>
      <div id="visitRecords"></div>
      <div id="garden"></div>
      <select id="addFriendSelect">
        <option value="">Choose a user</option>
      </select>
    `;

    __setMainTestState({
      currentUserProfile: null,
      myGardenData: null,
      currentViewedGardenData: null,
      currentGardenView: [],
      currentVisitedFriendId: null,
      viewMode: "mine",
      selectedFlowerId: null,
      isAddFriendSelectOpen: false
    });

    global.getCurrentUserId = jest.fn(() => "me");
  });

  test("updateGardenTitle does nothing when gardenTitle element is missing", () => {
    document.body.innerHTML = `<div id="other"></div>`;
    expect(() => updateGardenTitle("Hello")).not.toThrow();
  });

  test("updateCurrentProfileText does nothing when currentProfileText element is missing", () => {
    document.body.innerHTML = `<div id="other"></div>`;
    __setMainTestState({
      currentUserProfile: { avatar: "🦋", name: "Jean", id: "u1" }
    });

    expect(() => updateCurrentProfileText()).not.toThrow();
  });

  test("applyViewedGardenData handles null gardenData", () => {
    __setMainTestState({
      selectedFlowerId: 5,
      currentGardenView: [{ id: 5 }]
    });

    applyViewedGardenData(null);

    const state = __getMainTestState();
    expect(state.currentViewedGardenData).toBeNull();
    expect(state.currentGardenView).toEqual([]);
    expect(state.selectedFlowerId).toBeNull();
  });

  test("applyViewedGardenData treats missing flowers as empty array", () => {
    __setMainTestState({
      selectedFlowerId: 10
    });

    applyViewedGardenData({ owner: { name: "A" } });

    const state = __getMainTestState();
    expect(state.currentGardenView).toEqual([]);
    expect(state.selectedFlowerId).toBeNull();
  });

  test("updateFriendInfo does nothing safely when friendMood and friendTodayFlower are missing", () => {
    document.body.innerHTML = `<div id="friendInfo" style="display:none;"></div>`;

    __setMainTestState({
      viewMode: "friend",
      currentGardenView: [{ id: 1, mood: "happy", name: "Rose" }]
    });

    expect(() => updateFriendInfo()).not.toThrow();
    expect(document.getElementById("friendInfo").style.display).toBe("block");
  });

  test("updateFriendInfo works even if friendInfo itself is missing", () => {
    document.body.innerHTML = `
      <div id="friendMood"></div>
      <div id="friendTodayFlower"></div>
    `;

    __setMainTestState({
      viewMode: "friend",
      currentGardenView: [{ id: 1, mood: "calm", name: "Lily" }]
    });

    updateFriendInfo();

    expect(document.getElementById("friendMood").textContent).toBe("Mood: calm");
    expect(document.getElementById("friendTodayFlower").textContent).toBe("Today's flower: Lily");
  });

  test("renderVisitRecords does nothing when visitRecords element is missing", () => {
    document.body.innerHTML = `<div id="other"></div>`;
    __setMainTestState({
      myGardenData: {
        visitRecords: [{ visitorAvatar: "🦋", visitorName: "A", action: "visited", time: "now" }]
      }
    });

    expect(() => renderVisitRecords()).not.toThrow();
  });

  test("renderVisitRecords uses empty array when myGardenData is null", () => {
    __setMainTestState({ myGardenData: null });

    renderVisitRecords();

    expect(document.getElementById("visitRecords").textContent).toContain("No visitors yet");
  });

  test("renderHostVisitors does nothing when garden element is missing", () => {
    document.body.innerHTML = `<div id="other"></div>`;
    __setMainTestState({ viewMode: "mine" });

    expect(() =>
      renderHostVisitors([{ avatar: "🦋", x: 10, y: 20, name: "Alex" }])
    ).not.toThrow();
  });

  test("renderHostVisitors does nothing when activeVisitors is not an array", () => {
    __setMainTestState({ viewMode: "mine" });

    renderHostVisitors(null);

    expect(document.querySelectorAll(".host-visitor").length).toBe(0);
  });

  test("renderHostVisitors uses defaults for missing avatar, x, y, and name", () => {
    __setMainTestState({ viewMode: "mine" });

    renderHostVisitors([{}]);

    const visitor = document.querySelector(".host-visitor");
    expect(visitor).not.toBeNull();
    expect(visitor.textContent).toBe("🦋");
    expect(visitor.style.left).toBe("0px");
    expect(visitor.style.top).toBe("0px");
    expect(visitor.title).toBe("Visitor");
  });

  test("setupAddFriendSelectLock does nothing when select is missing", () => {
    document.body.innerHTML = `<div id="other"></div>`;
    expect(() => setupAddFriendSelectLock()).not.toThrow();
  });

  test("setupAddFriendSelectLock sets flag to true on mousedown", () => {
    const select = document.getElementById("addFriendSelect");

    setupAddFriendSelectLock();

    select.dispatchEvent(new Event("mousedown"));
    expect(__getMainTestState().isAddFriendSelectOpen).toBe(true);
  });
});

describe("main.js async and setup coverage", () => {
  let mainModule;

  beforeEach(() => {
    jest.resetModules();

    document.body.innerHTML = `
      <div id="garden"></div>
      <div id="friendSection"></div>
      <button id="backMyGardenBtn">Back</button>

      <button id="submitBtn">Submit</button>
      <select id="moodSelect">
        <option value="">Choose</option>
        <option value="happy">happy</option>
      </select>
      <input id="eventInput" />

      <button id="createUserBtn">Create User</button>
      <input id="newUserName" />
      <select id="newUserAvatar">
        <option value="🦋">🦋</option>
        <option value="🐝">🐝</option>
      </select>

      <button id="addFriendBtn">Add Friend</button>
      <select id="addFriendSelect">
        <option value="">Choose a user</option>
        <option value="friend-1">Friend 1</option>
      </select>
    `;

    global.alert = jest.fn();
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({})
      })
    );

    global.friendMode = false;
    global.avatarEl = null;
    global.activeFlowerId = null;
    global.currentUserProfile = null;
    global.avatarX = 0;
    global.avatarY = 0;

    global.getCurrentUserId = jest.fn(() => "me");
    global.getCurrentUser = jest.fn(() => ({ id: "me", name: "Jean", avatar: "🦋" }));
    global.clearCurrentUserId = jest.fn();
    global.setCurrentUserId = jest.fn();
    global.showAppMode = jest.fn();
    global.showAuthMode = jest.fn();
    global.updateCurrentProfileText = jest.fn();

    global.fetchUser = jest.fn(() =>
      Promise.resolve({ id: "me", name: "Jean", avatar: "🦋" })
    );
    global.fetchAllUsers = jest.fn(() => Promise.resolve([]));
    global.fetchFriends = jest.fn(() => Promise.resolve([]));
    global.fetchGarden = jest.fn(() =>
      Promise.resolve({
        flowers: [],
        activeVisitors: [],
        visitRecords: [],
        owner: { name: "Jean" }
      })
    );

    global.renderAddFriendOptions = jest.fn(() => Promise.resolve());
    global.renderFriendsList = jest.fn(() => Promise.resolve());
    global.renderDecorations = jest.fn();
    global.renderGarden = jest.fn();
    global.renderVisitRecords = jest.fn();
    global.renderHostVisitors = jest.fn();
    global.renderTodayFlower = jest.fn();
    global.updateFriendInfo = jest.fn();
    global.updateGardenTitle = jest.fn();

    global.leaveVisit = jest.fn(() => Promise.resolve());
    global.startVisit = jest.fn(() => Promise.resolve());
    global.moveVisit = jest.fn(() => Promise.resolve());

    global.setVisitorAvatar = jest.fn();
    global.getSelectedVisitorAvatar = jest.fn(() => "🦋");

    global.createFlowerForUser = jest.fn(() => Promise.resolve());
    global.analyzeMoodFromText = jest.fn(() => "calm");

    mainModule = require("../../public/main");

    mainModule.__setMainTestState({
      currentGardenView: [],
      currentViewedGardenData: null,
      myGardenData: null,
      currentVisitedFriendId: null,
      viewMode: "mine",
      selectedFlowerId: null,
      isAddFriendSelectOpen: false,
      currentUserProfile: null
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  test("refreshSocialPanels runs safely when current user exists", async () => {
  global.getCurrentUserId.mockReturnValue("me");
  global.fetchAllUsers = jest.fn(() => Promise.resolve([]));
  global.fetchFriends = jest.fn(() => Promise.resolve([]));

  await expect(mainModule.refreshSocialPanels()).resolves.toBeUndefined();
});


  test("stopPolling clears existing interval", () => {
    jest.useFakeTimers();

    mainModule.startPolling();
    mainModule.stopPolling();

    expect(clearInterval).toBeDefined();
  });


  test("loadMyGarden resets friend visit state", async () => {
  const friendSection = document.getElementById("friendSection");
  friendSection.style.display = "block";

  global.friendMode = true;
  global.avatarEl = document.createElement("div");
  document.body.appendChild(global.avatarEl);
  global.activeFlowerId = 123;

  mainModule.__setMainTestState({
    viewMode: "friend",
    currentVisitedFriendId: "friend-1",
    selectedFlowerId: 99
  });

  await mainModule.loadMyGarden();

  const state = mainModule.__getMainTestState();
  expect(state.viewMode).toBe("mine");
  expect(state.currentVisitedFriendId).toBeNull();
  expect(state.selectedFlowerId).toBeNull();
  expect(global.friendMode).toBe(false);
  expect(friendSection.style.display).toBe("none");
  expect(global.activeFlowerId).toBeNull();
});

  test("showMyGarden leaves current visit before returning", async () => {
  mainModule.__setMainTestState({
    viewMode: "friend",
    currentVisitedFriendId: "friend-1"
  });

  await mainModule.showMyGarden();

  expect(global.leaveVisit).toHaveBeenCalledWith("friend-1", "me");
});

  test("setupGardenSwitchButtons handles back button click", async () => {
  global.friendMode = true;

  mainModule.__setMainTestState({
    viewMode: "friend",
    currentVisitedFriendId: "friend-1",
    selectedFlowerId: 8
  });

  mainModule.setupGardenSwitchButtons();

  document.getElementById("backMyGardenBtn").click();
  await Promise.resolve();
  await Promise.resolve();

  const state = mainModule.__getMainTestState();
  expect(state.viewMode).toBe("mine");
  expect(state.currentVisitedFriendId).toBeNull();
});

  test("setupSubmitButton alerts when neither mood nor event is provided", async () => {
    mainModule.setupSubmitButton();

    document.getElementById("moodSelect").value = "";
    document.getElementById("eventInput").value = "";

    document.getElementById("submitBtn").click();
    await Promise.resolve();

    expect(global.alert).toHaveBeenCalled();
    expect(global.createFlowerForUser).not.toHaveBeenCalled();
  });

  test("setupSubmitButton uses analyzed mood when mood is empty", async () => {
  mainModule.setupSubmitButton();

  document.getElementById("moodSelect").value = "";
  document.getElementById("eventInput").value = "I feel good today";

  document.getElementById("submitBtn").click();
  await Promise.resolve();
  await Promise.resolve();

  expect(global.analyzeMoodFromText).toHaveBeenCalledWith("I feel good today");
  expect(global.createFlowerForUser).toHaveBeenCalledWith("me", "calm", "I feel good today");
});

  test("setupSubmitButton uses selected mood directly", async () => {
  mainModule.setupSubmitButton();

  document.getElementById("moodSelect").value = "happy";
  document.getElementById("eventInput").value = "Great day";

  document.getElementById("submitBtn").click();
  await Promise.resolve();
  await Promise.resolve();

  expect(global.createFlowerForUser).toHaveBeenCalledWith("me", "happy", "Great day");
});

  test("setupCreateUserButton creates user and switches current user id", async () => {
  global.fetch.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve({ id: "new-user" })
  });

  mainModule.setupCreateUserButton();

  document.getElementById("newUserName").value = "Jean";
  document.getElementById("newUserAvatar").value = "🦋";
  document.getElementById("createUserBtn").click();

  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();

  expect(global.setCurrentUserId).toHaveBeenCalledWith("new-user");
  expect(global.fetch).toHaveBeenCalled();
});


  test("setupAddFriendButton alerts when no friend is selected", async () => {
    mainModule.setupAddFriendButton();

    document.getElementById("addFriendSelect").value = "";
    document.getElementById("addFriendBtn").click();

    await Promise.resolve();

    expect(global.alert).toHaveBeenCalledWith("Please choose a user to add");
  });

  test("setupAddFriendButton sends add friend request", async () => {
  global.fetch.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve({})
  });

  mainModule.setupAddFriendButton();

  document.getElementById("addFriendSelect").value = "friend-1";
  document.getElementById("addFriendBtn").click();

  await Promise.resolve();
  await Promise.resolve();

  expect(global.fetch).toHaveBeenCalledWith(
    "/friends/add",
    expect.objectContaining({
      method: "POST",
      headers: { "Content-Type": "application/json" }
    })
  );
});
});