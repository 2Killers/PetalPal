let friendMode = false;
let avatarEl = null;
let avatarX = 120;
let avatarY = 520;
let activeFlowerId = null;

async function leaveMessage(index) {
  const msg = prompt("Leave a blessing message 🌸");

  if (!msg || !msg.trim()) {
    return;
  }

  const flower = currentGardenView[index];
  if (!flower) {
    return;
  }

  const targetUserId =
    viewMode === "friend" ? currentVisitedFriendId : getCurrentUserId();

  try {
    const me = getCurrentUser();

    await messageFlowerForUser(
      targetUserId,
      flower.id,
      me ? me.name : "Friend",
      msg.trim()
    );

    await refreshCurrentView();
    renderTodayFlower(index);

    if (friendMode) {
      createVisitorAvatar();
      checkNearbyFlower();
    }
  } catch (err) {
    console.error("Message error:", err);
    alert("Failed to leave message");
  }
}

async function supportFlower(index) {
  const flower = currentGardenView[index];
  if (!flower) {
    return;
  }

  const targetUserId =
    viewMode === "friend" ? currentVisitedFriendId : getCurrentUserId();

  try {
    await supportFlowerForUser(targetUserId, flower.id);

    await refreshCurrentView();
    renderTodayFlower(index);

    if (friendMode) {
      createVisitorAvatar();
      checkNearbyFlower();
    }
  } catch (err) {
    console.error("Support error:", err);
    alert("Failed to support flower");
  }
}

async function deleteFlower(index) {
  const flower = currentGardenView[index];
  if (!flower) {
    return;
  }

  if (viewMode === "friend") {
    alert("You can only delete flowers in your own garden 🌱");
    return;
  }

  const confirmed = confirm("Delete this flower? This cannot be undone.");
  if (!confirmed) {
    return;
  }

  try {
    const response = await fetch(
      `/users/${getCurrentUserId()}/flowers/${flower.id}`,
      {
        method: "DELETE"
      }
    );

    if (!response.ok) {
      throw new Error("Failed to delete flower");
    }

    await refreshCurrentView();
    renderTodayFlower();
  } catch (err) {
    console.error("Delete error:", err);
    alert("Failed to delete flower");
  }
}

function createVisitorAvatar() {
  const gardenDiv = document.getElementById("garden");
  if (!gardenDiv) {
    return;
  }

  if (avatarEl) {
    avatarEl.remove();
  }

  avatarEl = document.createElement("div");
  avatarEl.id = "avatar";
  avatarEl.textContent = getSelectedVisitorAvatar();

  avatarEl.style.left = `${avatarX}px`;
  avatarEl.style.top = `${avatarY}px`;

  gardenDiv.appendChild(avatarEl);
}

async function moveAvatar(dx, dy) {
  if (!friendMode || !avatarEl) {
    return;
  }

  const gardenDiv = document.getElementById("garden");
  if (!gardenDiv) {
    return;
  }

  const maxX = gardenDiv.clientWidth - 40;
  const maxY = gardenDiv.clientHeight - 40;

  avatarX = Math.max(0, Math.min(maxX, avatarX + dx));
  avatarY = Math.max(0, Math.min(maxY, avatarY + dy));

  avatarEl.style.left = `${avatarX}px`;
  avatarEl.style.top = `${avatarY}px`;

  if (viewMode === "friend" && currentVisitedFriendId) {
    try {
      await fetch("/visit/move", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          hostUserId: currentVisitedFriendId,
          visitorUserId: getCurrentUserId(),
          visitorAvatar: getSelectedVisitorAvatar(),
          x: avatarX,
          y: avatarY
        })
      });
    } catch (err) {
      console.error("Move visit error:", err);
    }
  }

  checkNearbyFlower();
}

function checkNearbyFlower() {
  if (!friendMode || !avatarEl) {
    return;
  }

  const cards = document.querySelectorAll(".flower-card");
  let nearestCard = null;
  let nearestDistance = Infinity;

  activeFlowerId = null;

  const avatarRect = avatarEl.getBoundingClientRect();
  const avatarCenterX = avatarRect.left + avatarRect.width / 2;
  const avatarCenterY = avatarRect.top + avatarRect.height / 2;

  cards.forEach((card) => {
    card.classList.remove("active");

    const rect = card.getBoundingClientRect();
    const cardCenterX = rect.left + rect.width / 2;
    const cardCenterY = rect.top + rect.height / 2;

    const dx = avatarCenterX - cardCenterX;
    const dy = avatarCenterY - cardCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestCard = card;
    }
  });

  if (nearestCard && nearestDistance < 110) {
    nearestCard.classList.add("active");
    activeFlowerId = Number(nearestCard.dataset.id);
  }
}

function setupGardenClickMove() {
  const gardenDiv = document.getElementById("garden");
  if (!gardenDiv) {
    return;
  }

  gardenDiv.addEventListener("click", async (e) => {
    if (!friendMode || !avatarEl) {
      return;
    }

    const clickedButton = e.target.closest("button");
    if (clickedButton) {
      return;
    }

    const clickedCard = e.target.closest(".flower-card");
    if (clickedCard) {
      return;
    }

    const rect = gardenDiv.getBoundingClientRect();
    avatarX = e.clientX - rect.left - 16;
    avatarY = e.clientY - rect.top - 16;

    const maxX = gardenDiv.clientWidth - 40;
    const maxY = gardenDiv.clientHeight - 40;

    avatarX = Math.max(0, Math.min(maxX, avatarX));
    avatarY = Math.max(0, Math.min(maxY, avatarY));

    avatarEl.style.left = `${avatarX}px`;
    avatarEl.style.top = `${avatarY}px`;

    if (viewMode === "friend" && currentVisitedFriendId) {
      try {
        await fetch("/visit/move", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            hostUserId: currentVisitedFriendId,
            visitorUserId: getCurrentUserId(),
            visitorAvatar: getSelectedVisitorAvatar(),
            x: avatarX,
            y: avatarY
          })
        });
      } catch (err) {
        console.error("Click move error:", err);
      }
    }

    checkNearbyFlower();
  });
}

function setupFriendFlowerActions() {
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("support-btn")) {
      e.stopPropagation();
      const flowerIndex = Number(e.target.dataset.index);
      if (!Number.isNaN(flowerIndex)) {
        supportFlower(flowerIndex);
      }
    }

    if (e.target.classList.contains("message-btn")) {
      e.stopPropagation();
      const flowerIndex = Number(e.target.dataset.index);
      if (!Number.isNaN(flowerIndex)) {
        leaveMessage(flowerIndex);
      }
    }
  });
}

document.addEventListener("keydown", (e) => {
  if (!friendMode) {
    return;
  }

  if (e.key === "ArrowUp") moveAvatar(0, -20);
  if (e.key === "ArrowDown") moveAvatar(0, 20);
  if (e.key === "ArrowLeft") moveAvatar(-20, 0);
  if (e.key === "ArrowRight") moveAvatar(20, 0);
});
if (typeof module !== "undefined") {
  module.exports = {
    leaveMessage,
    supportFlower,
    deleteFlower,
    createVisitorAvatar,
    moveAvatar,
    checkNearbyFlower,
    setupGardenClickMove,
    setupFriendFlowerActions
  };
}