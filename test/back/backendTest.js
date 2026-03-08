const assert = require("assert");

const Flower = require("../../models/Flower");
const Garden = require("../../models/Garden");
const User = require("../../models/User");
const Message = require("../../models/Message");
const VisitRecord = require("../../models/VisitRecord");

function testFlowerClass() {
  console.log("Testing Flower class...");

  const flower = new Flower({
    mood: "happy",
    event: "I finished my homework",
    chosen: {
      name: "Sunflower",
      meaning: "Hope and positivity",
      img: "🌻"
    },
    position: {
      left: 120,
      top: 240
    }
  });

  assert.ok(flower.id);
  assert.strictEqual(flower.mood, "happy");
  assert.strictEqual(flower.event, "I finished my homework");
  assert.strictEqual(flower.name, "Sunflower");
  assert.strictEqual(flower.meaning, "Hope and positivity");
  assert.strictEqual(flower.img, "🌻");
  assert.ok(flower.date);

  assert.strictEqual(flower.left, 120);
  assert.strictEqual(flower.top, 240);

  assert.strictEqual(flower.supportCount, 0);
  assert.deepStrictEqual(flower.messages, []);

  flower.addSupport();
  assert.strictEqual(flower.supportCount, 1);

  flower.addSupport();
  assert.strictEqual(flower.supportCount, 2);

  const message = new Message("friend1", "You are doing great!");
  flower.addMessage(message);

  assert.strictEqual(flower.messages.length, 1);
  assert.strictEqual(flower.messages[0], message);

  console.log("Flower class passed.");
}

function testMessageClass() {
    console.log("Testing Message class...");

    const message = new Message("alice", "Hope you feel better soon!");

    assert.ok(message.id);
    assert.strictEqual(message.author, "alice");
    assert.strictEqual(message.text, "Hope you feel better soon!");
    assert.ok(message.date);
    console.log("Message class passed.");

  }

  function testGardenClass() {
    console.log("Testing Garden class...");
  
    const garden = new Garden("xingran");
  
    assert.strictEqual(garden.owner, "xingran");
    assert.ok(Array.isArray(garden.flowers));
    assert.strictEqual(garden.flowers.length, 0);
    assert.strictEqual(garden.year, new Date().getFullYear());
  
    assert.ok(Array.isArray(garden.visitRecords));
    assert.strictEqual(garden.visitRecords.length, 0);
  
    assert.ok(Array.isArray(garden.activeVisitors));
    assert.strictEqual(garden.activeVisitors.length, 0);
  
    const flower1 = new Flower({
      mood: "happy",
      event: "Got coffee",
      chosen: {
        name: "Tulip",
        meaning: "Warmth",
        img: "🌷"
      },
      position: {
        left: 100,
        top: 200
      }
    });
  
    const flower2 = new Flower({
      mood: "sad",
      event: "Bad quiz",
      chosen: {
        name: "Blue Rose",
        meaning: "Silent sadness",
        img: "🥀"
      },
      position: {
        left: 300,
        top: 180
      }
    });
  
    garden.addFlower(flower1);
    garden.addFlower(flower2);
  
    assert.strictEqual(garden.flowers.length, 2);
  
    const flowers = garden.getFlowers();
    assert.strictEqual(flowers.length, 2);
    assert.strictEqual(flowers[0].name, "Tulip");
    assert.strictEqual(flowers[1].name, "Blue Rose");
  
    const foundFlower = garden.getFlowerById(flower1.id);
    assert.strictEqual(foundFlower.id, flower1.id);
  
    const notFoundFlower = garden.getFlowerById(999999999);
    assert.strictEqual(notFoundFlower, null);
  
    const removedFlower = garden.removeFlowerById(flower1.id);
    assert.strictEqual(removedFlower.id, flower1.id);
    assert.strictEqual(garden.flowers.length, 1);
  
    const removeMissing = garden.removeFlowerById(999999999);
    assert.strictEqual(removeMissing, null);
    assert.strictEqual(garden.flowers.length, 1);
  
    const record1 = {
      visitorId: "u1",
      visitorName: "Alice",
      visitorAvatar: "🐝",
      action: "visited"
    };
  
    garden.addVisitRecord(record1);
    assert.strictEqual(garden.visitRecords.length, 1);
    assert.deepStrictEqual(garden.getVisitRecords()[0], record1);
  
    for (let i = 2; i <= 35; i++) {
      garden.addVisitRecord({
        visitorId: `u${i}`,
        visitorName: `User${i}`,
        visitorAvatar: "🦋",
        action: "visited"
      });
    }
  
    assert.strictEqual(garden.visitRecords.length, 30);
  
    const visitor1 = {
      visitorId: "v1",
      name: "Bob",
      avatar: "🐦",
      x: 10,
      y: 20
    };
  
    garden.startActiveVisit(visitor1);
    assert.strictEqual(garden.activeVisitors.length, 1);
    assert.strictEqual(garden.activeVisitors[0].visitorId, "v1");
    assert.strictEqual(garden.activeVisitors[0].x, 10);
    assert.strictEqual(garden.activeVisitors[0].y, 20);
  
    garden.startActiveVisit({
      visitorId: "v1",
      name: "Bob Updated",
      avatar: "🦅",
      x: 50,
      y: 60
    });
  
    assert.strictEqual(garden.activeVisitors.length, 1);
    assert.strictEqual(garden.activeVisitors[0].name, "Bob Updated");
    assert.strictEqual(garden.activeVisitors[0].avatar, "🦅");
    assert.strictEqual(garden.activeVisitors[0].x, 50);
    assert.strictEqual(garden.activeVisitors[0].y, 60);
  
    garden.startActiveVisit({
      visitorId: "v2",
      name: "Carol",
      avatar: "🐝",
      x: 100,
      y: 120
    });
  
    assert.strictEqual(garden.activeVisitors.length, 2);
  
    const moved = garden.moveActiveVisit("v2", 130, 160);
    assert.strictEqual(moved, true);
    assert.strictEqual(garden.activeVisitors[1].x, 130);
    assert.strictEqual(garden.activeVisitors[1].y, 160);
  
    const notMoved = garden.moveActiveVisit("missing", 1, 1);
    assert.strictEqual(notMoved, false);
  
    const activeVisitors = garden.getActiveVisitors();
    assert.strictEqual(activeVisitors.length, 2);
  
    garden.endActiveVisit("v1");
    assert.strictEqual(garden.activeVisitors.length, 1);
    assert.strictEqual(garden.activeVisitors[0].visitorId, "v2");
  
    garden.endActiveVisit("missing");
    assert.strictEqual(garden.activeVisitors.length, 1);
  
    console.log("Garden class passed.");
  }

  function testUserClass() {
    console.log("Testing User class...");
  
    const user = new User({
      id: "u1",
      name: "xingran",
      avatar: "🦋",
      friends: []
    });
  
    assert.strictEqual(user.id, "u1");
    assert.strictEqual(user.name, "xingran");
    assert.strictEqual(user.avatar, "🦋");
  
    assert.ok(Array.isArray(user.friends));
    assert.strictEqual(user.friends.length, 0);
  
    assert.ok(user.garden);
  
    user.addFriend("alice");
    assert.strictEqual(user.friends.length, 1);
    assert.strictEqual(user.friends[0], "alice");
  
    user.addFriend("bob");
    assert.strictEqual(user.friends.length, 2);
    assert.strictEqual(user.friends[1], "bob");
  
    user.addFriend("alice");
    assert.strictEqual(user.friends.length, 2);
  
    if (typeof user.getFriendIds === "function") {
      assert.deepStrictEqual(user.getFriendIds(), ["alice", "bob"]);
    }
  
    if (typeof user.getGarden === "function") {
      assert.strictEqual(user.getGarden(), user.garden);
    }
  
    console.log("User class passed.");
  }

  function testVisitRecordClass() {
    console.log("Testing VisitRecord class...");
  
    const record = new VisitRecord({
      visitorId: "u1",
      visitorName: "Alice",
      visitorAvatar: "🐝",
      action: "visited"
    });
  
    assert.ok(record.id);
    assert.strictEqual(record.visitorId, "u1");
    assert.strictEqual(record.visitorName, "Alice");
    assert.strictEqual(record.visitorAvatar, "🐝");
    assert.strictEqual(record.action, "visited");
    assert.ok(record.time);
  
    console.log("VisitRecord class passed.");
  }

function testMessageDefaults() {
  console.log("Testing Message defaults...");

  const message = new Message();

  assert.ok(message.id);
  assert.strictEqual(message.author, "Friend");
  assert.strictEqual(message.text, "");
  assert.ok(message.date);

  console.log("Message defaults passed.");
}

function testUserDefaultAvatar() {
  console.log("Testing User default avatar...");

  const user = new User({
    id: "u2",
    name: "defaultUser"
  });

  assert.strictEqual(user.avatar, "🦋");
  assert.deepStrictEqual(user.friends, []);

  console.log("User default avatar passed.");
}

function testFlowerDefaultEvent() {
  console.log("Testing Flower default event...");

  const flower = new Flower({
    mood: "calm",
    chosen: {
      name: "Lily",
      meaning: "Peace",
      img: "🪷"
    },
    position: {
      left: 10,
      top: 20
    }
  });

  assert.strictEqual(flower.event, "");
  console.log("Flower default event passed.");
}


  

function runAllTests() {
  console.log("========== BACKEND CLASS TESTS START ==========");

  testMessageClass();
  testMessageDefaults();

  testFlowerClass();
  testFlowerDefaultEvent();

  testGardenClass();

  testUserClass();
  testUserDefaultAvatar();

  testVisitRecordClass();


  console.log("========== ALL TESTS PASSED ==========");
}

runAllTests();