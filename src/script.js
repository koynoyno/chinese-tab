import { draw } from "./draw.js";
import { getRandomNumber } from "./getRandomNumber.js";
const _ = 888;

// Chrome 95
// chrome.storage.session.set({test: "test" });

chrome.storage.local.get(null, async (items) => {
  // if extension is updated, wipe cache, just in case
  if (items.updated) {
    const { postUpdate } = await import("./postUpdate.js");
    await postUpdate(items);
    items.cache = {};
  }

  // new day, new cache
  // let currentDate = new Date().getMinutes(); // DEV
  let currentDate = new Date().getDate();
  if (items.date !== currentDate) {
    items.cache = {};
    chrome.storage.local.set({ date: currentDate });
  }

  // update empty cache
  if (
    items.dayLimit == "0" ||
    Object.keys(items.cache).length === 0
  ) {
    const { cacheUpdate } = await import("./cacheUpdate.js");
    items.cache = await cacheUpdate(items);
    console.log(JSON.stringify(items.cache))
    chrome.storage.local.set({ cache: items.cache }); // repopulate cache on reload
  }

  // compose drawObject: characters, pinyin, tones, translation
  // TODO rename draw to makeDrawObject or smth
  draw(
    items.cache[items.randomNumber], // if dayLimit == 0, then items.cache[0] is used
    items.char,
    items.pinyin,
    items.translation,
    items.sentenceExamples,
    items.color
  );

  // display first launch greeting or seen words message
  // items.firstLaunch = true; // DEV
  if (items.firstLaunch) {
    const { ifFirstLaunch } = await import("./firstLaunch.js");
    await ifFirstLaunch();
    chrome.storage.local.set({ cache: [] }); // repopulate cache on reload
  } else if (getRandomNumber(_) % _ == 0) {
    const { confetti } = await import("./npm/confetti.browser.js");
    const { showSeenWords } = await import("./showSeenWords.js");
    await showSeenWords(items.game.wordsSeen, items.color);
  }

  // update counter and randomNumber
  items.game.wordsSeen++;
  chrome.storage.local.set({
    game: { wordsSeen: items.game.wordsSeen },
    randomNumber: getRandomNumber(items.dayLimit),
  });
  chrome.storage.sync.set({
    game: { wordsSeen: items.game.wordsSeen },
  })

  // DEV reload tabs with space
  window.addEventListener("keydown", (e) => {
    if (e.code === "Space") {
      chrome.tabs.reload();
    }
  });

  // DEV link dns-prefetch optimization
  // potentially it's a DDOS
  if (items.sentenceExamples) {
    let reverso = document.createElement("link");
    reverso.rel = "dns-prefetch";
    reverso.href = "https://context.reverso.net/";
    document.head.appendChild(reverso);
  }
});

// apply dark mode beautiful way
chrome.storage.onChanged.addListener(function (changes, namespace) {
  for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
    switch (key) {
      case "darkMode":
        document.body.classList.toggle("darkMode");
      default:
        // DEV
        console.log(
          `Storage key "${key}" in namespace "${namespace}" changed.`,
          `Old value was "${oldValue}", new value is "${newValue}".`
        );
    }
  }
});
