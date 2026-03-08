const User = require("../models/User");

const userA = new User({
  id: "userA",
  name: "Star",
  avatar: "🦋",
  friends: ["userB"]
});

const userB = new User({
  id: "userB",
  name: "Jean",
  avatar: "🐝",
  friends: ["userA"]
});

const users = {
  userA,
  userB
};

module.exports = users;