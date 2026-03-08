const BASE_GARDEN_WIDTH = 700;
const BASE_GARDEN_HEIGHT = 760;
const BASE_FLOWER_WIDTH = 100;
const BASE_FLOWER_HEIGHT = 120;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getResponsiveFlowerSize() {
  const viewportWidth = window.innerWidth;

  if (viewportWidth <= 640) {
    return {
      width: 82,
      height: 100,
      tooltipWidth: 190
    };
  }

  if (viewportWidth <= 900) {
    return {
      width: 90,
      height: 110,
      tooltipWidth: 220
    };
  }

  return {
    width: BASE_FLOWER_WIDTH,
    height: BASE_FLOWER_HEIGHT,
    tooltipWidth: 220
  };
}

function getGardenMetrics(gardenDiv) {
  const styles = window.getComputedStyle(gardenDiv);
  const paddingLeft = parseFloat(styles.paddingLeft) || 0;
  const paddingRight = parseFloat(styles.paddingRight) || 0;
  const paddingTop = parseFloat(styles.paddingTop) || 0;
  const paddingBottom = parseFloat(styles.paddingBottom) || 0;

  const innerWidth = Math.max(
    0,
    gardenDiv.clientWidth - paddingLeft - paddingRight
  );

  const innerHeight = Math.max(
    0,
    gardenDiv.clientHeight - paddingTop - paddingBottom
  );

  const scaleX = innerWidth / BASE_GARDEN_WIDTH;
  const scaleY = innerHeight / BASE_GARDEN_HEIGHT;

  return {
    paddingLeft,
    paddingRight,
    paddingTop,
    paddingBottom,
    innerWidth,
    innerHeight,
    scaleX,
    scaleY
  };
}

function getScaledFlowerPosition(flower, metrics, flowerSize) {
  const scaledLeft = clamp(
    (flower.left || 0) * metrics.scaleX,
    0,
    Math.max(0, metrics.innerWidth - flowerSize.width)
  );

  const scaledTop = clamp(
    (flower.top || 0) * metrics.scaleY,
    0,
    Math.max(0, metrics.innerHeight - flowerSize.height)
  );

  return {
    left: scaledLeft,
    top: scaledTop
  };
}

function getScaledVisitorPosition(visitor, metrics) {
  const x = clamp(
    (visitor.x || 0) * metrics.scaleX,
    0,
    Math.max(0, metrics.innerWidth - 36)
  );

  const y = clamp(
    (visitor.y || 0) * metrics.scaleY,
    0,
    Math.max(0, metrics.innerHeight - 36)
  );

  return { x, y };
}

function renderRemoteVisitors(gardenDiv) {
  if (viewMode !== "friend") {
    return;
  }

  if (!currentViewedGardenData || !currentViewedGardenData.activeVisitors) {
    return;
  }

  const visitors = currentViewedGardenData.activeVisitors;

  visitors.forEach((visitor) => {
    if (visitor.visitorId === getCurrentUserId()) {
      return;
    }

    const visitorEl = document.createElement("div");
    visitorEl.className = "remote-visitor-avatar";
    visitorEl.textContent = visitor.avatar || "🦋";
    visitorEl.style.left = `${visitor.x}px`;
    visitorEl.style.top = `${visitor.y}px`;
    visitorEl.title = `${visitor.name || "Visitor"} is visiting`;

    gardenDiv.appendChild(visitorEl);
  });
}

function renderGarden() {
  const gardenDiv = document.getElementById("garden");
  if (!gardenDiv) {
    return;
  }

  gardenDiv.innerHTML = "";

  const metrics = getGardenMetrics(gardenDiv);
  const flowerSize = getResponsiveFlowerSize();

  currentGardenView.forEach((flower, index) => {
    const card = document.createElement("div");
    card.className = "flower-card";
    card.dataset.id = flower.id;
    card.dataset.index = index;

    const latestMessage =
      flower.messages && flower.messages.length > 0
        ? flower.messages[flower.messages.length - 1].text
        : "No message yet";

    card.innerHTML = `
      <div class="flower-shadow"></div>
      <div class="flower-emoji">${flower.img}</div>

      <div class="flower-tooltip ${friendMode ? "friend-tooltip" : "own-tooltip"}">
        <p><strong>${flower.name}</strong></p>
        <p>Flower meaning: ${flower.meaning}</p>
        <p>Mood: ${flower.mood}</p>
        <p>Date: ${flower.date}</p>
        <p>Event: ${flower.event || "No event recorded"}</p>
        <p>Support: ${flower.supportCount || 0}</p>
        <p>Message: ${latestMessage}</p>

        ${
          friendMode
            ? `
          <div class="flower-actions-inline">
            <button class="support-btn" data-index="${index}">Support ✨</button>
            <button class="message-btn" data-index="${index}">Leave Message 🏷️</button>
          </div>
        `
            : ""
        }
      </div>
    `;

    const position = getScaledFlowerPosition(flower, metrics, flowerSize);
    card.style.left = `${position.left}px`;
    card.style.top = `${position.top}px`;

    const tooltip = card.querySelector(".flower-tooltip");
    const tooltipOffset = 18;
    const tooltipRightEdge =
      position.left + tooltipOffset + flowerSize.tooltipWidth;

    if (tooltipRightEdge > metrics.innerWidth - 20) {
      tooltip.style.right = `${tooltipOffset}px`;
      tooltip.style.left = "auto";
      tooltip.classList.add("tooltip-left");
      tooltip.classList.remove("tooltip-right");
    } else {
      tooltip.style.left = `${tooltipOffset}px`;
      tooltip.style.right = "auto";
      tooltip.classList.add("tooltip-right");
      tooltip.classList.remove("tooltip-left");
    }

    if (!friendMode) {
      card.addEventListener("click", () => {
        selectedFlowerId = flower.id;
        renderTodayFlower();
      });
    }

    gardenDiv.appendChild(card);
  });

  renderRemoteVisitors(gardenDiv, metrics);

  if (friendMode && avatarEl) {
    gardenDiv.appendChild(avatarEl);

    if (typeof checkNearbyFlower === "function") {
      checkNearbyFlower();
    }
  }
}

function renderTodayFlower() {
  const todayFlowerDiv = document.getElementById("todayFlower");
  if (!todayFlowerDiv) {
    return;
  }

  todayFlowerDiv.innerHTML = "<h2>Today's Flower</h2>";

  if (!currentGardenView || currentGardenView.length === 0) {
    todayFlowerDiv.innerHTML += `
      <p class="empty-message">No flower yet today 🌱</p>
    `;
    return;
  }

  if (selectedFlowerId === null) {
    todayFlowerDiv.innerHTML += `
      <p class="empty-message">Click a flower to view and manage it 🌸</p>
    `;
    return;
  }

  const flower =
    currentGardenView.find((f) => f.id === selectedFlowerId) || null;

  if (!flower) {
    selectedFlowerId = null;
    todayFlowerDiv.innerHTML += `
      <p class="empty-message">Click a flower to view and manage it 🌸</p>
    `;
    return;
  }

  const flowerIndex = currentGardenView.findIndex((f) => f.id === flower.id);

  const latestMessage =
    flower.messages && flower.messages.length > 0
      ? flower.messages[flower.messages.length - 1].text
      : "No message yet";

  todayFlowerDiv.innerHTML += `
    <div class="today-flower-card">
      <div class="today-flower-emoji">${flower.img}</div>
      <p><strong>${flower.name}</strong></p>
      <p>${flower.meaning}</p>
      <p>Mood: ${flower.mood}</p>
      <p>Event: ${flower.event || "No event recorded"}</p>
      <p>Support: ${flower.supportCount || 0}</p>
      <p>Message: ${latestMessage}</p>
    </div>
  `;

  if (!friendMode) {
    const actions = document.createElement("div");
    actions.className = "today-actions";

    const supportBtn = document.createElement("button");
    supportBtn.textContent = "Support ✨";

    const messageBtn = document.createElement("button");
    messageBtn.textContent = "Leave Message 🏷️";

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete 🗑️";

    supportBtn.addEventListener("click", () => {
      if (flowerIndex !== -1) {
        supportFlower(flowerIndex);
      }
    });

    messageBtn.addEventListener("click", () => {
      if (flowerIndex !== -1) {
        leaveMessage(flowerIndex);
      }
    });

    deleteBtn.addEventListener("click", () => {
      if (flowerIndex !== -1) {
        deleteFlower(flowerIndex);
      }
    });

    actions.appendChild(supportBtn);
    actions.appendChild(messageBtn);
    actions.appendChild(deleteBtn);
    todayFlowerDiv.appendChild(actions);
  }
}

window.addEventListener("resize", () => {
  renderGarden();
  renderTodayFlower();
});