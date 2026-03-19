(function () {
  function createHotspotsManager(options) {
    const hotspotEls = options.hotspotEls;
    const cursorProgressEl = options.cursorProgressEl;
    const setScene = options.setScene;
    const getHotspots = options.getHotspots;
    const showTooltip = options.showTooltip || function () {};
    const hideTooltip = options.hideTooltip || function () {};
    const markInteraction = options.markInteraction || function () {};

    function attachFuseHandlers(el) {
      if (!el._fusingHandler) {
        el._fusingHandler = function () {
          cursorProgressEl.setAttribute("animation__fuse", {
            property: "scale",
            from: "0 1 1",
            to: "1 1 1",
            dur: 2000,
            easing: "linear"
          });
          showTooltip();
          markInteraction();
        };

        el.addEventListener("fusing", el._fusingHandler);
      }

      if (!el._mouseenterHandler) {
        el._mouseenterHandler = function () {
          showTooltip();
          markInteraction();
        };

        el.addEventListener("mouseenter", el._mouseenterHandler);
      }

      if (!el._mouseleaveHandler) {
        el._mouseleaveHandler = function () {
          cursorProgressEl.removeAttribute("animation__fuse");
          cursorProgressEl.setAttribute("scale", "0 1 1");
          hideTooltip();
        };

        el.addEventListener("mouseleave", el._mouseleaveHandler);
      }
    }

    function updateHotspots(sceneName) {
      const hotspotDefs = getHotspots(sceneName);

      hotspotEls.forEach(function (el, i) {
        const hotspotDef = hotspotDefs[i];
        const target = hotspotDef.target;
        const position = hotspotDef.position;
        const color = hotspotDef.color;

        el.setAttribute("position", position);
        el.setAttribute(
          "material",
          "color: " + color + "; opacity: 0.5; transparent: true"
        );
        el.setAttribute("visible", true);
        el.setAttribute(
          "animation__pulse",
          "property: scale; dir: alternate; dur: 1200; easing: easeInOutSine; loop: true; to: 1.12 1.12 1.12"
        );
        el.setAttribute(
          "animation__glow",
          "property: components.material.material.opacity; dir: alternate; dur: 1200; easing: easeInOutSine; loop: true; to: 0.75"
        );
        el.classList.add("hotspot");

        if (el.handler) {
          el.removeEventListener("click", el.handler);
        }

        el.handler = function () {
          hideTooltip();
          markInteraction();
          setScene(target);
        };

        el.addEventListener("click", el.handler);
        attachFuseHandlers(el);
      });
    }

    return {
      updateHotspots: updateHotspots
    };
  }

  window.VRToursHotspots = {
    createHotspotsManager: createHotspotsManager
  };
})();
