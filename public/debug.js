const observer = new MutationObserver((mutations, me) => {
  const elementList = document.querySelector("#objectListWrap");
  if (elementList) {
    /**  --  */
    console.log("hello");

    const searchBar = document.createElement("input");
    searchBar.type = "search";
    searchBar.placeholder = "Search...";

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

    searchBar.id = "objectListSearch";
    elementList.prepend(searchBar);
    /**  --  */
    const list = document.querySelector("#objectList");
    searchBar.addEventListener("input", event => {
      for (let i = 0; i < list.children.length; i++) {
        let child = list.children[i];
        let text = child.querySelector(".item a").innerText;
        child.style.display = text.toLowerCase().includes(event.target.value.toLowerCase())
          ? ""
          : "none";
      }
    });

    me.disconnect(); // stop observing
  }
});

observer.observe(document, {
  childList: true,
  subtree: true
});
