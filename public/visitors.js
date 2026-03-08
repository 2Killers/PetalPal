const visitors = ["🐦", "🐝", "🦋"];
let selectedVisitorAvatar = "🦋";

function getRandomVisitor() {
  const index = Math.floor(Math.random() * visitors.length);
  return visitors[index];
}

function setVisitorAvatar(avatar) {
  selectedVisitorAvatar = avatar;
}

function getSelectedVisitorAvatar() {
  return selectedVisitorAvatar;
}