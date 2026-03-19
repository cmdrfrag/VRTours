(function () {
  const DEFAULT_SCENES_CONFIG_URL = "scenes.json";
  const ONBOARDING_STORAGE_KEY = "vrtours-onboarding-seen";
  const IDLE_TIMEOUT_MS = 5000;

  const bodyEl = document.body;
  const scenesConfigUrl = bodyEl.getAttribute("data-scenes-config") || DEFAULT_SCENES_CONFIG_URL;
  const startButton = document.getElementById("startButton");
  const minimap = document.getElementById("minimap");
  const videoEl = document.getElementById("video360");
  const sphereContainer = document.getElementById("videosphere-container");
  const fadeOverlay = document.getElementById("fadeOverlay");
  const loadingOverlay = document.getElementById("loadingOverlay");
  const cursorProgressEl = document.getElementById("cursor-progress");
  const onboardingOverlay = document.getElementById("onboardingOverlay");
  const dismissOnboardingButton = document.getElementById("dismissOnboarding");
  const idleHint = document.getElementById("idleHint");
  const hotspotTooltip = document.getElementById("hotspotTooltip");
  const cameraEl = document.getElementById("playerCamera");
  const hotspotEls = [
    document.getElementById("toScene2"),
    document.getElementById("toScene3")
  ];
  const preloadLinkEl = document.createElement("link");

  let idleHintTimer = 0;
  let experienceStarted = false;

  preloadLinkEl.rel = "preload";
  preloadLinkEl.as = "video";
  document.head.appendChild(preloadLinkEl);

  function showElement(el) {
    el.classList.add("visible");
  }

  function hideElement(el) {
    el.classList.remove("visible");
  }

  function showOnboardingIfNeeded() {
    try {
      if (window.localStorage.getItem(ONBOARDING_STORAGE_KEY)) {
        return;
      }
    } catch (error) {
      console.warn("Unable to read onboarding state:", error);
    }

    showElement(onboardingOverlay);
  }

  function dismissOnboarding() {
    hideElement(onboardingOverlay);

    try {
      window.localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
    } catch (error) {
      console.warn("Unable to persist onboarding state:", error);
    }
  }

  function clearIdleHintTimer() {
    window.clearTimeout(idleHintTimer);
  }

  function startIdleHintTimer() {
    if (!experienceStarted) {
      return;
    }

    clearIdleHintTimer();
    idleHintTimer = window.setTimeout(function () {
      hideElement(onboardingOverlay);
      showElement(idleHint);
    }, IDLE_TIMEOUT_MS);
  }

  function markInteraction() {
    if (!experienceStarted) {
      return;
    }

    hideElement(idleHint);
    startIdleHintTimer();
  }

  function buildScenesMap(sceneDefinitions) {
    const scenes = {};

    sceneDefinitions.forEach(function (sceneDefinition) {
      scenes[sceneDefinition.video] = sceneDefinition.hotspots;
    });

    return scenes;
  }

  function getLikelyNextScene(sceneDefinitions, sceneName) {
    const matchingScene = sceneDefinitions.find(function (sceneDefinition) {
      return sceneDefinition.video === sceneName;
    });

    if (!matchingScene || !matchingScene.hotspots.length) {
      return "";
    }

    return matchingScene.hotspots[0].target;
  }

  function addOriginHint(rel, href) {
    const link = document.createElement("link");
    link.rel = rel;
    link.href = href;
    if (rel === "preconnect") {
      link.crossOrigin = "anonymous";
    }
    document.head.appendChild(link);
  }

  function addVideoOriginHints(sceneDefinitions) {
    const origins = {};

    sceneDefinitions.forEach(function (sceneDefinition) {
      try {
        origins[new URL(sceneDefinition.video).origin] = true;
      } catch (error) {
        console.warn("Unable to parse video URL:", sceneDefinition.video, error);
      }
    });

    Object.keys(origins).forEach(function (origin) {
      addOriginHint("dns-prefetch", origin);
      addOriginHint("preconnect", origin);
    });
  }

  function preloadLikelyScene(sceneDefinitions, sceneName) {
    const likelyNextScene = getLikelyNextScene(sceneDefinitions, sceneName);

    if (!likelyNextScene) {
      preloadLinkEl.removeAttribute("href");
      return;
    }

    preloadLinkEl.href = likelyNextScene;
  }

  function renderMinimap(sceneDefinitions, setScene) {
    minimap.innerHTML = "";

    sceneDefinitions.forEach(function (sceneDefinition) {
      const button = document.createElement("button");
      button.type = "button";
      button.setAttribute("data-scene", sceneDefinition.video);
      button.textContent = sceneDefinition.label;
      button.addEventListener("click", function () {
        markInteraction();
        setScene(sceneDefinition.video);
      });
      minimap.appendChild(button);
    });
  }

  function initializeApp(config) {
    const scenes = buildScenesMap(config.scenes);
    let sceneManager;

    addVideoOriginHints(config.scenes);

    dismissOnboardingButton.addEventListener("click", function () {
      dismissOnboarding();
      markInteraction();
    });

    ["click", "touchstart", "keydown"].forEach(function (eventName) {
      document.addEventListener(eventName, markInteraction, { passive: true });
    });

    cameraEl.addEventListener("componentchanged", function (event) {
      if (event.detail.name === "rotation") {
        markInteraction();
      }
    });

    const hotspotsManager = window.VRToursHotspots.createHotspotsManager({
      hotspotEls: hotspotEls,
      cursorProgressEl: cursorProgressEl,
      getHotspots: function (sceneName) {
        return scenes[sceneName];
      },
      setScene: function (sceneName) {
        sceneManager.setScene(sceneName);
      },
      showTooltip: function () {
        showElement(hotspotTooltip);
      },
      hideTooltip: function () {
        hideElement(hotspotTooltip);
      },
      markInteraction: markInteraction
    });

    sceneManager = window.VRToursSceneManager.createSceneManager({
      initialScene: config.initialScene,
      videoEl: videoEl,
      sphereContainer: sphereContainer,
      fadeOverlay: fadeOverlay,
      loadingOverlay: loadingOverlay,
      updateHotspots: hotspotsManager.updateHotspots,
      handleSceneReady: function (sceneName) {
        preloadLikelyScene(config.scenes, sceneName);
        hideElement(hotspotTooltip);
        startIdleHintTimer();
      }
    });

    preloadLikelyScene(config.scenes, config.initialScene);

    renderMinimap(config.scenes, function (sceneName) {
      sceneManager.setScene(sceneName);
    });

    startButton.addEventListener("click", function () {
      videoEl.src = sceneManager.getCurrentScene();
      videoEl.load();
      videoEl.play().then(function () {
        experienceStarted = true;
        startButton.style.display = "none";
        minimap.style.display = "block";
        showOnboardingIfNeeded();
        startIdleHintTimer();
        sceneManager.setScene(sceneManager.getCurrentScene());
      });
    });
  }

  fetch(scenesConfigUrl)
    .then(function (response) {
      if (!response.ok) {
        throw new Error("Failed to load scenes config");
      }

      return response.json();
    })
    .then(function (config) {
      initializeApp(config);
    })
    .catch(function (error) {
      console.error("Unable to initialize tour:", error);
    });
})();
