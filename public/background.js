browser.commands.onCommand.addListener((command) => {
  if (command === 'show-quickswitch') {
    console.log('Hello from the background');

    browser.tabs.executeScript({
      file: 'js/app.js',
    });
  }
});
