const fs = require("fs");
const path = require("path");

describe("index.html", () => {
  let html;

  beforeEach(() => {
    const filePath = path.resolve(__dirname, "../../public/index.html");
    html = fs.readFileSync(filePath, "utf8");
    document.documentElement.innerHTML = html;
  });

  test("has page title", () => {
    expect(document.title).toBe("PetalPal");
  });

  test("renders main header", () => {
    expect(document.querySelector("header h1").textContent).toBe("PetalPal");
    expect(document.querySelector("header p").textContent).toContain(
      "social mood garden"
    );
  });

  test("renders auth section", () => {
    expect(document.getElementById("authSection")).not.toBeNull();
    expect(document.getElementById("userPickerBlock")).not.toBeNull();
    expect(document.getElementById("userList")).not.toBeNull();
    expect(document.getElementById("signupSection")).not.toBeNull();
    expect(document.getElementById("newUserName")).not.toBeNull();
    expect(document.getElementById("newUserAvatar")).not.toBeNull();
    expect(document.getElementById("createUserBtn")).not.toBeNull();
  });

  test("renders new user avatar options", () => {
    const options = [...document.querySelectorAll("#newUserAvatar option")].map(
      (option) => option.value
    );

    expect(options).toEqual(["🦋", "🐝", "🐦"]);
  });

  test("renders current profile section", () => {
    expect(document.getElementById("currentProfileSection")).not.toBeNull();
    expect(document.getElementById("currentProfileText").textContent).toBe(
      "Not selected"
    );
  });

  test("renders daily check-in section", () => {
    expect(document.querySelector(".checkin-section")).not.toBeNull();
    expect(document.getElementById("eventInput")).not.toBeNull();
    expect(document.getElementById("moodSelect")).not.toBeNull();
    expect(document.getElementById("submitBtn")).not.toBeNull();
  });

  test("renders mood options", () => {
    const options = [...document.querySelectorAll("#moodSelect option")].map(
      (option) => option.value
    );

    expect(options).toEqual([
      "",
      "happy",
      "calm",
      "tired",
      "sad",
      "stressed"
    ]);
  });

  test("renders visitor section", () => {
    expect(document.getElementById("visitorSection")).not.toBeNull();
    expect(document.getElementById("visitorChoices")).not.toBeNull();
    expect(document.getElementById("selectedVisitorText").textContent).toContain(
      "🦋"
    );
  });

  test("renders visitor choice buttons", () => {
    const buttons = [...document.querySelectorAll(".visitor-choice")];
    const avatars = buttons.map((button) => button.dataset.avatar);

    expect(buttons).toHaveLength(3);
    expect(avatars).toEqual(["🐦", "🐝", "🦋"]);
  });

  test("renders friend management section", () => {
    expect(document.getElementById("friendManageSection")).not.toBeNull();
    expect(document.getElementById("addFriendSelect")).not.toBeNull();
    expect(document.getElementById("addFriendBtn")).not.toBeNull();
  });

  test("renders friends and visiting sections", () => {
    expect(document.getElementById("friendsListSection")).not.toBeNull();
    expect(document.getElementById("friendsList")).not.toBeNull();
    expect(document.getElementById("friendSection")).not.toBeNull();
    expect(document.getElementById("backMyGardenBtn")).not.toBeNull();
  });

  test("renders visit records and friend info", () => {
    expect(document.getElementById("visitRecordsSection")).not.toBeNull();
    expect(document.getElementById("visitRecords")).not.toBeNull();

    const friendInfo = document.getElementById("friendInfo");
    expect(friendInfo).not.toBeNull();
    expect(friendInfo.style.display).toBe("none");

    expect(document.getElementById("friendMood").textContent).toContain("Unknown");
    expect(document.getElementById("friendTodayFlower").textContent).toContain("None");
  });

  test("renders today flower section", () => {
    expect(document.getElementById("todayFlower")).not.toBeNull();
    expect(document.querySelector("#todayFlower h2").textContent).toBe(
      "Today's Flower"
    );
  });

  test("renders garden scene structure", () => {
    expect(document.getElementById("gardenTitle").textContent).toBe("Your Garden");
    expect(document.getElementById("garden-scene")).not.toBeNull();
    expect(document.getElementById("decoration-layer")).not.toBeNull();
    expect(document.getElementById("garden")).not.toBeNull();
  });

  test("renders background visual layers", () => {
    expect(document.querySelector(".sky-layer")).not.toBeNull();
    expect(document.querySelector(".background-layer")).not.toBeNull();
    expect(document.querySelector(".backgrass-layer")).not.toBeNull();
    expect(document.querySelector(".frontgrass-left")).not.toBeNull();
    expect(document.querySelector(".frontgrass-right")).not.toBeNull();
  });

  test("includes stylesheet link", () => {
    const stylesheet = document.querySelector('link[rel="stylesheet"]');
    expect(stylesheet).not.toBeNull();
    expect(stylesheet.getAttribute("href")).toBe("/style.css");
  });

  test("includes required script files", () => {
    const scripts = [...document.querySelectorAll("script")].map((script) =>
      script.getAttribute("src")
    );

    expect(scripts).toEqual([
      "/visitors.js",
      "/friends.js",
      "/moodAnalysis.js",
      "/renderGarden.js",
      "/interactions.js",
      "/main.js"
    ]);
  });
});