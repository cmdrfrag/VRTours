(function () {
  function createSceneManager(options) {
    const videoEl = options.videoEl;
    const sphereContainer = options.sphereContainer;
    const fadeOverlay = options.fadeOverlay;
    const loadingOverlay = options.loadingOverlay;
    const updateHotspots = options.updateHotspots;
    const handleSceneReady = options.handleSceneReady || function () {};

    let currentScene = options.initialScene;
    let pendingLoadToken = 0;

    function fadeTransition(callback) {
      fadeOverlay.style.opacity = "1";
      setTimeout(function () {
        callback();
        fadeOverlay.style.opacity = "0";
      }, 1000);
    }

    function clearVideoSource() {
      videoEl.onloadeddata = null;
      videoEl.pause();
      videoEl.removeAttribute("src");
      videoEl.load();
    }

    function disposeObject3DMaterial(material) {
      if (!material) {
        return;
      }

      if (material.map) {
        material.map.dispose();
      }

      material.dispose();
    }

    function disposeSphere(oldSphere) {
      if (!oldSphere) {
        return;
      }

      const mesh = oldSphere.getObject3D("mesh");
      if (mesh) {
        if (mesh.geometry) {
          mesh.geometry.dispose();
        }

        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(disposeObject3DMaterial);
        } else {
          disposeObject3DMaterial(mesh.material);
        }
      }

      if (oldSphere.parentNode) {
        oldSphere.parentNode.removeChild(oldSphere);
      }
    }

    function setScene(sceneName) {
      const loadToken = ++pendingLoadToken;
      currentScene = sceneName;

      fadeTransition(function () {
        const oldSphere = document.getElementById("sphere");
        if (oldSphere) {
          oldSphere.setAttribute("visible", false);
        }

        loadingOverlay.style.opacity = "1";

        clearVideoSource();
        videoEl.src = sceneName;
        videoEl.load();

        videoEl.onloadeddata = function () {
          if (loadToken !== pendingLoadToken) {
            return;
          }

          videoEl.play().then(function () {
            if (loadToken !== pendingLoadToken) {
              return;
            }

            disposeSphere(oldSphere);

            const newSphere = document.createElement("a-videosphere");
            newSphere.setAttribute("id", "sphere");
            newSphere.setAttribute("src", "#video360");
            newSphere.setAttribute("rotation", "0 90 0");
            newSphere.setAttribute(
              "material",
              "shader: flat; npot: true; magFilter: linear; minFilter: linear;"
            );
            sphereContainer.appendChild(newSphere);

            updateHotspots(sceneName);
            handleSceneReady(sceneName);
            loadingOverlay.style.opacity = "0";
          }).catch(function (err) {
            if (loadToken !== pendingLoadToken) {
              return;
            }

            console.error("Playback failed:", err);
            loadingOverlay.style.opacity = "0";
          });
        };
      });
    }

    return {
      getCurrentScene: function () {
        return currentScene;
      },
      setScene: setScene
    };
  }

  window.VRToursSceneManager = {
    createSceneManager: createSceneManager
  };
})();
