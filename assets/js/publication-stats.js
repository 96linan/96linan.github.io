(function () {
  "use strict";

  var widget = document.querySelector("[data-publication-stats]");
  if (!widget) return;

  var ownerNames = ["Nan Li", "李楠"];

  function normalize(value) {
    return value.replace(/\s+/g, " ").trim();
  }

  function isOwner(element) {
    if (!element) return false;
    return ownerNames.indexOf(normalize(element.textContent)) !== -1;
  }

  function isFirstAuthor(item) {
    var text = normalize(item.textContent);
    return ownerNames.some(function (name) {
      return text === name || text.indexOf(name + ",") === 0;
    });
  }

  function isCorrespondingAuthor(item) {
    return Array.prototype.some.call(item.querySelectorAll("strong"), function (author) {
      if (!isOwner(author)) return false;

      var sibling = author.nextSibling;
      while (sibling && sibling.nodeType === Node.TEXT_NODE && !normalize(sibling.textContent)) {
        sibling = sibling.nextSibling;
      }
      return Boolean(sibling && /^\s*\+/.test(sibling.textContent || ""));
    });
  }

  function readPublicationPage(url) {
    return fetch(url, { credentials: "same-origin" })
      .then(function (response) {
        if (!response.ok) throw new Error("Unable to load " + url);
        return response.text();
      })
      .then(function (html) {
        var documentFromPage = new DOMParser().parseFromString(html, "text/html");
        var publicationList = documentFromPage.querySelector("[data-publication-list]");
        if (!publicationList) throw new Error("Publication list not found at " + url);

        return Array.prototype.slice.call(publicationList.querySelectorAll("li"));
      });
  }

  function render(items) {
    var values = {
      total: items.length,
      first: items.filter(isFirstAuthor).length,
      corresponding: items.filter(isCorrespondingAuthor).length
    };

    Object.keys(values).forEach(function (key) {
      var target = widget.querySelector('[data-stat="' + key + '"]');
      if (target) target.textContent = values[key];
    });
    widget.classList.add("publication-stats--ready");
  }

  readPublicationPage(widget.dataset.publicationsUrl)
    .then(function (items) {
      render(items);
    })
    .catch(function () {
      widget.classList.add("publication-stats--error");
      widget.setAttribute("title", "Publication statistics are temporarily unavailable");
    });
})();
