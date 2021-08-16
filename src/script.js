import { draw } from "./draw.js";
// import { getRandomNumber } from "./getRandomNumber.js";

chrome.storage.sync.get(null, async (items) => {
  const luck = 88;

  // if extension is updated
  if (items.updated) {
    const { postUpdate } = await import("./postUpdate.js");
    await postUpdate(items);
  }

  // update empty cache
  if (
    items.dayLimit == "0" ||
    Object.keys(items.cache).length === 0 ||
    items.updated
  ) {
    const { cacheUpdate } = await import("./cacheUpdate.js");
    items.cache = await cacheUpdate(items);
    chrome.storage.sync.set({ cache: items.cache }); // repopulate cache on reload
  }

  // draw characters, pinyin, tones, translation
  // if dayLimit == 0, then items.cache[0] will be used
  draw(
    items.cache[items.randomNumber],
    items.char,
    items.pinyin,
    items.translation,
    items.sentenceExamples,
    items.color
  );

  // everything above is important for performance
  // =============================================
  const { getRandomNumber } = await import("./getRandomNumber.js");

  // display first launch greeting or seen words message
  // items.firstLaunch = true; // DEV
  if (items.firstLaunch) {
    const { ifFirstLaunch } = await import("./firstLaunch.js");
    await ifFirstLaunch();
    chrome.storage.sync.set({ cache: [] }); // repopulate cache on reload
  } else if (getRandomNumber(luck) % luck == 0) {
    const { confetti } = await import("./npm/confetti.browser.js");
    const { showSeenWords } = await import("./showSeenWords.js");
    await showSeenWords(items.game.wordsSeen, items.color);
  }

  // update counter
  items.game.wordsSeen++;
  chrome.storage.sync.set({
    game: { wordsSeen: items.game.wordsSeen },
    randomNumber: getRandomNumber(items.dayLimit),
  });

  // DEV reload tabs with space
  // window.addEventListener("keydown", (e) => {
  //   if (e.code === "Space") {
  //     chrome.tabs.reload();
  //   }
  // });
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
