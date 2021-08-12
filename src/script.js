document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.sync.get(null, async (items) => {
    // TODO: fix flicker
    if (items.darkMode) {
      document.body.classList.add("dark-mode");
    }

    // import vocabulary
    const { default: hsk } = await import(`../hsk2/${items.level}.json`, {
      assert: { type: "json" },
    });

    // display greeting
    const { ifFirstLaunch } = await import("./firstLaunch.js");
    ifFirstLaunch(items);

    // if extension is updated
    // TODO: fix, rn it's being called all the time
    // const { postUpdate } = await import("./postUpdate.js")
    // postUpdate(items);

    // draw characters, pinyin, tones, translation
    const { draw } = await import("./draw.js");
    draw(hsk, items);

    const { consoleGreeting } = await import("./consoleGreeting.js");
    consoleGreeting();
  });
});
