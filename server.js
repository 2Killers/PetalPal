const express = require("express");
const cors = require("cors");
const path = require("path");

const { createFlower, addSupport, addMessage } = require("./logic/gardenLogic");
const VisitRecord = require("./models/VisitRecord");
const User = require("./models/User");
const users = require("./data/users");
const { predictMood, loadMoodModel } = require("./moodClassifier");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function getUser(userId) {
  return users[userId] || null;
}

function getFriendList(user) {
  return user
    .getFriendIds()
    .map((friendId) => getUser(friendId))
    .filter(Boolean)
    .map((friend) => ({
      id: friend.id,
      name: friend.name,
      avatar: friend.avatar
    }));
}

function getGardenResponse(user) {
  return {
    owner: {
      id: user.id,
      name: user.name,
      avatar: user.avatar
    },
    flowers: user.getGarden().getFlowers(),
    visitRecords: user.getGarden().getVisitRecords(),
    activeVisitors: user.getGarden().getActiveVisitors()
  };
}

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/users", (req, res) => {
  const result = Object.values(users).map((user) => ({
    id: user.id,
    name: user.name,
    avatar: user.avatar
  }));

  res.json(result);
});

app.get("/users/:userId", (req, res) => {
  const user = getUser(req.params.userId);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  res.json({
    id: user.id,
    name: user.name,
    avatar: user.avatar,
    friends: user.getFriendIds()
  });
});

app.get("/users/:userId/friends", (req, res) => {
  const user = getUser(req.params.userId);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  res.json(getFriendList(user));
});

app.get("/users/:userId/garden", (req, res) => {
  const user = getUser(req.params.userId);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  res.json(getGardenResponse(user));
});

app.post("/users", (req, res) => {
  const { name, avatar } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Name is required" });
  }

  const trimmedName = name.trim();

  const nameExists = Object.values(users).some(
    (user) => user.name.toLowerCase() === trimmedName.toLowerCase()
  );

  if (nameExists) {
    return res.status(400).json({ error: "Name already exists" });
  }

  const newUserId = `user_${Date.now()}`;

  const newUser = new User({
    id: newUserId,
    name: trimmedName,
    avatar: avatar || "🦋",
    friends: []
  });

  users[newUserId] = newUser;

  res.status(201).json({
    id: newUser.id,
    name: newUser.name,
    avatar: newUser.avatar,
    friends: newUser.getFriendIds()
  });
});

app.post("/friends/add", (req, res) => {
  const { userId, friendId } = req.body;

  const user = getUser(userId);
  const friend = getUser(friendId);

  if (!user || !friend) {
    return res.status(404).json({ error: "User not found" });
  }

  if (userId === friendId) {
    return res.status(400).json({ error: "You cannot add yourself" });
  }

  user.addFriend(friendId);
  friend.addFriend(userId);

  res.json({
    success: true,
    message: "Friend added successfully",
    userFriends: user.getFriendIds(),
    friendFriends: friend.getFriendIds()
  });
});

app.post("/friends/remove", (req, res) => {
  const { userId, friendId } = req.body;

  const user = getUser(userId);
  const friend = getUser(friendId);

  if (!user || !friend) {
    return res.status(404).json({ error: "User not found" });
  }

  user.friends = user.friends.filter((id) => id !== friendId);
  friend.friends = friend.friends.filter((id) => id !== userId);

  res.json({
    success: true,
    message: "Friend removed successfully",
    userFriends: user.getFriendIds(),
    friendFriends: friend.getFriendIds()
  });
});

app.post("/users/:userId/flowers", (req, res) => {
  const user = getUser(req.params.userId);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const { mood, event } = req.body;

  if (!mood) {
    return res.status(400).json({ error: "Mood is required" });
  }

  const garden = user.getGarden();
  const flower = createFlower(mood, event, garden.getFlowers());

  garden.addFlower(flower);

  res.status(201).json(flower);
});

app.post("/users/:userId/flowers/:flowerId/support", (req, res) => {
  const user = getUser(req.params.userId);
  const flowerId = Number(req.params.flowerId);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const flower = user.getGarden().getFlowerById(flowerId);

  if (!flower) {
    return res.status(404).json({ error: "Flower not found" });
  }

  addSupport(flower);
  res.json(flower);
});

app.post("/users/:userId/flowers/:flowerId/message", (req, res) => {
  const user = getUser(req.params.userId);
  const flowerId = Number(req.params.flowerId);
  const { author, text } = req.body;

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const flower = user.getGarden().getFlowerById(flowerId);

  if (!flower) {
    return res.status(404).json({ error: "Flower not found" });
  }

  if (!text || !text.trim()) {
    return res.status(400).json({ error: "Message cannot be empty" });
  }

  addMessage(flower, author || "Friend", text.trim());
  res.json(flower);
});

app.delete("/users/:userId/flowers/:flowerId", (req, res) => {
  const user = getUser(req.params.userId);
  const flowerId = Number(req.params.flowerId);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const garden = user.getGarden();
  const flower = garden.getFlowerById(flowerId);

  if (!flower) {
    return res.status(404).json({ error: "Flower not found" });
  }

  const removedFlower = garden.removeFlowerById(flowerId);

  res.json({
    success: true,
    message: "Flower deleted successfully",
    deletedFlower: removedFlower
  });
});

app.post("/visit", (req, res) => {
  const {
    hostUserId,
    visitorUserId,
    visitorAvatar,
    x = 120,
    y = 520
  } = req.body;

  const host = getUser(hostUserId);
  const visitor = getUser(visitorUserId);

  if (!host || !visitor) {
    return res.status(404).json({ error: "User not found" });
  }

  const hostGarden = host.getGarden();

  hostGarden.startActiveVisit({
    visitorId: visitor.id,
    name: visitor.name,
    avatar: visitorAvatar || visitor.avatar,
    x,
    y
  });

  const record = new VisitRecord({
    visitorId: visitor.id,
    visitorName: visitor.name,
    visitorAvatar: visitorAvatar || visitor.avatar,
    action: "started visiting your garden"
  });

  hostGarden.addVisitRecord(record);

  res.json({
    success: true,
    activeVisitors: hostGarden.getActiveVisitors(),
    visitRecords: hostGarden.getVisitRecords()
  });
});

app.post("/visit/move", (req, res) => {
  const { hostUserId, visitorUserId, x, y, visitorAvatar } = req.body;

  const host = getUser(hostUserId);
  const visitor = getUser(visitorUserId);

  if (!host || !visitor) {
    return res.status(404).json({ error: "User not found" });
  }

  if (typeof x !== "number" || typeof y !== "number") {
    return res.status(400).json({ error: "x and y must be numbers" });
  }

  const moved = host.getGarden().moveActiveVisit(visitorUserId, x, y);

  if (!moved) {
    return res.status(404).json({ error: "Visitor not active in this garden" });
  }

  const activeVisitor = host
    .getGarden()
    .getActiveVisitors()
    .find((item) => item.visitorId === visitorUserId);

  if (activeVisitor && visitorAvatar) {
    activeVisitor.avatar = visitorAvatar;
  }

  res.json({
    success: true,
    activeVisitors: host.getGarden().getActiveVisitors()
  });
});

app.post("/leave", (req, res) => {
  const { hostUserId, visitorUserId, visitorAvatar } = req.body;

  const host = getUser(hostUserId);
  const visitor = getUser(visitorUserId);

  if (!host || !visitor) {
    return res.status(404).json({ error: "User not found" });
  }

  const hostGarden = host.getGarden();

  hostGarden.endActiveVisit(visitor.id);

  const record = new VisitRecord({
    visitorId: visitor.id,
    visitorName: visitor.name,
    visitorAvatar: visitorAvatar || visitor.avatar,
    action: "left your garden"
  });

  hostGarden.addVisitRecord(record);

  res.json({
    success: true,
    activeVisitors: hostGarden.getActiveVisitors(),
    visitRecords: hostGarden.getVisitRecords()
  });
});

app.post("/analyze-mood", async (req, res) => {
  try {
    const { text } = req.body;

    if (typeof text !== "string" || !text.trim()) {
      return res.status(400).json({ error: "Text is required" });
    }

    const mood = await predictMood(text);
    res.json({ mood });
  } catch (err) {
    console.error("Mood analysis error:", err);
    res.status(500).json({ error: "Failed to analyze mood" });
  }
});

loadMoodModel()
  .then(() => {
    console.log("Mood model loaded.");
  })
  .catch((err) => {
    console.error("Failed to load mood model:", err);
  });

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
});