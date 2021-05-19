const observer = new MutationObserver((mutations, me) => {
  const elementList = document.querySelector("#objectListWrap");
  if (elementList) {
    /**  --  */
    console.log("hello");
    const list = document.querySelector("#objectList");

    const searchBar = document.createElement("input");
    searchBar.type = "search";
    searchBar.placeholder = "Search...";
    searchBar.id = "objectListSearch";

    // Je hardcode le style pour le moment, c'est deg je sais
    // VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
    searchBar.style.width = "100%";
    searchBar.style.borderWidth = "1px";
    searchBar.style.backgroundColor = "#fbfbfb";
    searchBar.style.borderRadius = "2px";
    searchBar.style.borderColor = "#bbb";
    searchBar.style.padding = "6px 4px";
    // AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
    // Faudra remplacer ça quand y'aura un machin de CSS mis en place xoxo

    elementList.prepend(searchBar);

    let inputChangeHandler = search => {
      localStorage.setItem(localStorageItemKeyName, search);
      for (let i = 0; i < list.children.length; i++) {
        let child = list.children[i];
        let text = child.querySelector(".item a").innerText;
        child.style.display = text.toLowerCase().includes(search.toLowerCase()) ? "" : "none";
      }
    };

    //localstorage store old value
    const localStorageItemKeyName = "refinedConstructDebuggerSearchbarValue";
    let previousValue = localStorage.getItem(localStorageItemKeyName);
    if (previousValue) {
      searchBar.value = previousValue;
      if (elementList.children.length > 0) {
        inputChangeHandler(previousValue);
      }
      const subObserver = new MutationObserver((mutations, me) => {
        if (elementList.children.length > 0) {
          inputChangeHandler(previousValue);
          me.disconnect(); // stop observing
        }
      });
      subObserver.observe(elementList, {
        childList: true,
        subtree: true
      });
    }

    /**  --  */
    searchBar.addEventListener("input", event => {
      inputChangeHandler(event.target.value);
    });

    me.disconnect(); // stop observing
  }
});

observer.observe(document, {
  childList: true,
  subtree: true
});
