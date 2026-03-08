const BASE_GARDEN_WIDTH = 700;
const BASE_GARDEN_HEIGHT = 760;
const BASE_FLOWER_WIDTH = 150;
const BASE_FLOWER_HEIGHT = 180;

const flowerMap = {
  happy: "/assets/sunflower.png",
  calm: "/assets/blue.png",
  tired: "/assets/purple.png",
  sad: "/assets/tulip.png",
  stressed: "/assets/pink.png",
  default: "/assets/pink.png"
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getResponsiveFlowerSize() {
  const viewportWidth = window.innerWidth;

  if (viewportWidth <= 640) {
    return {
      width: 125,
      height: 150,
      tooltipWidth: 190
    };
  }

  if (viewportWidth <= 900) {
    return {
      width: 145,
      height: 175,
      tooltipWidth: 220
    };
  }

  return {
    width: 170,
    height: 205,
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

// 只允许花出现在图片下方 2/3 的区域里
function getGrassBounds(metrics, flowerSize) {
  const leftPadding = 24;
  const rightPadding = 24;
  const topPadding = 18;
  const bottomPadding = 26;

  const topMin = Math.round(metrics.innerHeight / 3); // 从 1/3 高度以下开始
  const topMax = Math.round(
    metrics.innerHeight - flowerSize.height - bottomPadding
  );

  return {
    leftMin: leftPadding,
    leftMax: Math.max(
      leftPadding,
      metrics.innerWidth - flowerSize.width - rightPadding
    ),
    topMin: Math.max(topPadding, topMin),
    topMax: Math.max(Math.max(topPadding, topMin), topMax)
  };
}

function boxesOverlap(a, b, flowerSize) {
  const horizontalGap = flowerSize.width * 0.78;
  const verticalGap = flowerSize.height * 0.72;

  return !(
    a.left + horizontalGap <= b.left ||
    b.left + horizontalGap <= a.left ||
    a.top + verticalGap <= b.top ||
    b.top + verticalGap <= a.top
  );
}

// 用 flower.id 生成稳定随机数，这样同一朵花每次位置都固定
function seededRandom(seed) {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function getFlowerSeed(flower, fallbackIndex = 0) {
  const raw = String(flower?.id ?? fallbackIndex + 1);
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = (hash * 31 + raw.charCodeAt(i)) >>> 0;
  }
  return hash || fallbackIndex + 1;
}

function isPositionInsideBounds(position, bounds) {
  return (
    typeof position.left === "number" &&
    typeof position.top === "number" &&
    position.left >= bounds.leftMin &&
    position.left <= bounds.leftMax &&
    position.top >= bounds.topMin &&
    position.top <= bounds.topMax
  );
}

function generateStableFlowerPosition(flower, existingFlowers = [], fallbackIndex = 0) {
  const baseMetrics = {
    innerWidth: BASE_GARDEN_WIDTH,
    innerHeight: BASE_GARDEN_HEIGHT
  };

  const baseFlowerSize = {
    width: BASE_FLOWER_WIDTH,
    height: BASE_FLOWER_HEIGHT
  };

  const bounds = getGrassBounds(baseMetrics, baseFlowerSize);
  const seedBase = getFlowerSeed(flower, fallbackIndex);

  for (let attempt = 0; attempt < 800; attempt++) {
    const randX = seededRandom(seedBase + attempt * 17.371);
    const randY = seededRandom(seedBase + attempt * 41.913);

    const candidate = {
      left: Math.round(
        bounds.leftMin + randX * (bounds.leftMax - bounds.leftMin)
      ),
      top: Math.round(
        bounds.topMin + randY * (bounds.topMax - bounds.topMin)
      )
    };

    const overlapsExisting = existingFlowers.some((placedFlower) =>
      boxesOverlap(candidate, placedFlower, baseFlowerSize)
    );

    if (!overlapsExisting) {
      return candidate;
    }
  }

  return {
    left: bounds.leftMin,
    top: bounds.topMin
  };
}

// 重点：不是“有坐标就保留”
// 而是“有合法坐标才保留，不合法就重新算”
function prepareFlowersOnce(flowers) {
  if (!Array.isArray(flowers)) return [];

  const positionedFlowers = [];
  const baseBounds = getGrassBounds(
    {
      innerWidth: BASE_GARDEN_WIDTH,
      innerHeight: BASE_GARDEN_HEIGHT
    },
    {
      width: BASE_FLOWER_WIDTH,
      height: BASE_FLOWER_HEIGHT
    }
  );

  return flowers.map((flower, index) => {
    const currentPosition = {
      left: flower.left,
      top: flower.top
    };

    const hasValidPosition =
      isPositionInsideBounds(currentPosition, baseBounds) &&
      !positionedFlowers.some((placedFlower) =>
        boxesOverlap(currentPosition, placedFlower, {
          width: BASE_FLOWER_WIDTH,
          height: BASE_FLOWER_HEIGHT
        })
      );

    if (hasValidPosition) {
      const fixedFlower = {
        ...flower,
        left: Math.round(flower.left),
        top: Math.round(flower.top)
      };
      positionedFlowers.push(fixedFlower);
      return fixedFlower;
    }

    const stablePosition = generateStableFlowerPosition(
      flower,
      positionedFlowers,
      index
    );

    const updatedFlower = {
      ...flower,
      left: stablePosition.left,
      top: stablePosition.top
    };

    positionedFlowers.push(updatedFlower);
    return updatedFlower;
  });
}

function getScaledFlowerPosition(flower, metrics, flowerSize) {
  const bounds = getGrassBounds(metrics, flowerSize);

  const scaledLeft = clamp(
    flower.left * metrics.scaleX,
    bounds.leftMin,
    bounds.leftMax
  );

  const scaledTop = clamp(
    flower.top * metrics.scaleY,
    bounds.topMin,
    bounds.topMax
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

function getFlowerImage(flower) {
  const mood = (flower.mood || "").toLowerCase();
  return flowerMap[mood] || flowerMap.default;
}

function renderDecorations() {
  const layer = document.getElementById("decoration-layer");
  if (!layer) return;

  layer.innerHTML = "";

  const items = [
    { left: "5%", bottom: "6%", width: 170, height: 120, img: "/assets/decoration1.JPEG" },
    { left: "22%", bottom: "8%", width: 180, height: 125, img: "/assets/decoration2.JPEG" },
    { left: "42%", bottom: "7%", width: 175, height: 120, img: "/assets/decoration3.JPEG" },
    { left: "62%", bottom: "8%", width: 170, height: 118, img: "/assets/decoration1.JPEG" },
    { left: "78%", bottom: "6%", width: 175, height: 120, img: "/assets/decoration2.JPEG" }
  ];

  items.forEach((item) => {
    const el = document.createElement("div");
    el.style.position = "absolute";
    el.style.left = item.left;
    el.style.bottom = item.bottom;
    el.style.width = `${item.width}px`;
    el.style.height = `${item.height}px`;
    el.style.backgroundImage = `url("${item.img}")`;
    el.style.backgroundSize = "contain";
    el.style.backgroundRepeat = "no-repeat";
    el.style.backgroundPosition = "bottom center";
    el.style.mixBlendMode = "multiply";
    el.style.opacity = "0.95";
    el.style.pointerEvents = "none";
    layer.appendChild(el);
  });
}

function renderRemoteVisitors(gardenDiv, metrics) {
  if (viewMode !== "friend") return;
  if (!currentViewedGardenData || !currentViewedGardenData.activeVisitors) return;

  const visitors = currentViewedGardenData.activeVisitors;

  visitors.forEach((visitor) => {
    if (visitor.visitorId === getCurrentUserId()) return;

    const visitorEl = document.createElement("div");
    visitorEl.className = "remote-visitor-avatar";
    visitorEl.textContent = visitor.avatar || "🦋";

    const position = getScaledVisitorPosition(visitor, metrics);
    visitorEl.style.left = `${position.x}px`;
    visitorEl.style.top = `${position.y}px`;

    visitorEl.title = `${visitor.name || "Visitor"} is visiting`;
    gardenDiv.appendChild(visitorEl);
  });
}

function renderGarden() {
  const gardenDiv = document.getElementById("garden");
  if (!gardenDiv) return;

  gardenDiv.innerHTML = "";

  const metrics = getGardenMetrics(gardenDiv);
  const flowerSize = getResponsiveFlowerSize();

  currentGardenView = prepareFlowersOnce(
    Array.isArray(currentGardenView) ? currentGardenView : []
  );

  const flowersToRender = currentGardenView;

  flowersToRender.forEach((flower, index) => {
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

      <div
        class="flower-img"
        style="
          width: ${flowerSize.width}px;
          height: ${flowerSize.height}px;
          background-image: url('${getFlowerImage(flower)}');
        "
      ></div>

      <div class="flower-tooltip ${friendMode ? "friend-tooltip" : "own-tooltip"}">
        <p><strong>${flower.name || "Flower"}</strong></p>
        <p>Flower meaning: ${flower.meaning || "Unknown"}</p>
        <p>Mood: ${flower.mood || "Unknown"}</p>
        <p>Date: ${flower.date || "Unknown"}</p>
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

    card.style.position = "absolute";
    card.style.left = `${position.left}px`;
    card.style.top = `${position.top}px`;
    card.style.width = `${flowerSize.width}px`;
    card.style.height = `${flowerSize.height + 30}px`;
    card.style.zIndex = String(100 + Math.round(position.top));

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

  if (friendMode) {
  if (typeof createVisitorAvatar === "function") {
    createVisitorAvatar();
  } else if (avatarEl) {
    gardenDiv.appendChild(avatarEl);
  }

  if (typeof setupGardenClickMove === "function") {
    setupGardenClickMove();
  }

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
      <div class="today-flower-emoji">${flower.img || "🌸"}</div>
      <p><strong>${flower.name || "Flower"}</strong></p>
      <p>${flower.meaning || "Unknown"}</p>
      <p>Mood: ${flower.mood || "Unknown"}</p>
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
  renderDecorations();
  renderGarden();
  renderTodayFlower();
});