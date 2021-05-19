const observer = new MutationObserver(((mutations, me) => {
  const elementList = document.querySelector('#objectListWrap');
  if (elementList) {
    /**  --  */
    console.log('hello');

    const input = document.createElement('input');
    input.type = 'search';
    input.placeholder = 'Hello relixes 👋';

    elementList.prepend(input);
    /**  --  */

    me.disconnect(); // stop observing
  }
}));

observer.observe(document, {
  childList: true,
  subtree: true,
});
