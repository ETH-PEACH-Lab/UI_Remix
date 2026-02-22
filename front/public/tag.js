function getXPath(element) {
  if (!element || element.nodeType !== 1) {
    return "";
  }

  if (element.tagName.toLowerCase() === "html") {
    return "/html";
  }

  let position = 1;
  let sibling = element.previousSibling;

  while (sibling) {
    if (sibling.nodeType === 1 && sibling.tagName === element.tagName) {
      position++;
    }
    sibling = sibling.previousSibling;
  }

  const tagName = element.tagName.toLowerCase();
  let pathIndex = position > 1 ? `[${position}]` : "";
  let currentPath = `/${tagName}${pathIndex}`;
  let parentPath = "";

  if (element.parentNode && element.parentNode.nodeType === 1) {
    parentPath = getXPath(element.parentNode);
  }

  return parentPath + currentPath;
}

document.addEventListener("DOMContentLoaded", function () {
  // Mark selectable elements and forward hover/click events to the parent window.
  const elements = document.querySelectorAll(
    "p, h1, h2, h3, h4, h5, h6, li, div, article, aside, footer, header, nav, ol, button, input, form, span, a, img, ul"
  );

  let isElementSelected = false;

  elements.forEach((element, index) => {
    element.classList.add("specified_compo");

    if (!element.id) {
      element.id = "tag-" + index;
    }
  });

  document.addEventListener("click", function (event) {
    if (!event.target.closest(".specified_compo") && isElementSelected) {
      document.querySelectorAll(".highlighted").forEach((el) => {
        el.classList.remove("highlighted");
      });

      isElementSelected = false;

      window.parent.postMessage(
        {
          type: "elementUnselected",
        },
        "*"
      );
    }
  });

  document.querySelectorAll(".specified_compo").forEach((tag) => {
    tag.addEventListener("mouseenter", function (event) {
      if (isElementSelected) return;

      event.stopPropagation();
      window.parent.postMessage(
        {
          type: "mouseEnter",
          tagId: this.id,
        },
        "*"
      );
    });

    tag.addEventListener("mouseleave", function (event) {
      if (isElementSelected) return;

      event.stopPropagation();
      window.parent.postMessage(
        {
          type: "mouseLeave",
          tagId: this.id,
        },
        "*"
      );
    });

    tag.addEventListener("click", function (event) {
      event.stopPropagation();

      document.querySelectorAll(".highlighted").forEach((el) => {
        el.classList.remove("highlighted");
      });

      this.classList.add("highlighted");

      isElementSelected = true;

      const xpath = getXPath(this);

      window.parent.postMessage(
        {
          type: "elementClicked",
          tagId: this.id,
          selected: true,
          xpath: xpath,
        },
        "*"
      );
    });
  });

  window.addEventListener("message", function (event) {
    const { tagId, action } = event.data;

    if (action === "highlight") {
      if (!isElementSelected) {
        const tag = document.getElementById(tagId);
        if (tag) {
          document.querySelectorAll(".highlighted").forEach((el) => {
            el.classList.remove("highlighted");
          });

          tag.classList.add("highlighted");
        }
      }
    } else if (action === "unhighlight") {
      if (!isElementSelected) {
        const tag = document.getElementById(tagId);
        if (tag) {
          tag.classList.remove("highlighted");
        }
      }
    } else if (action === "clearSelection") {
      isElementSelected = false;
      document.querySelectorAll(".highlighted").forEach((el) => {
        el.classList.remove("highlighted");
      });
    }
  });
});
