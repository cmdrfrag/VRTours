(function () {
  const gridEl = document.getElementById("experienceGrid");

  function renderCard(experience) {
    const article = document.createElement("article");
    article.className = "experience-card";

    const link = document.createElement("a");
    link.className = "experience-link";
    link.href = experience.href;

    const image = document.createElement("img");
    image.className = "experience-thumb";
    image.src = experience.thumbnail;
    image.alt = experience.title + " preview";

    const content = document.createElement("div");
    content.className = "experience-card-body";

    const title = document.createElement("h2");
    title.textContent = experience.title;

    const description = document.createElement("p");
    description.textContent = experience.description;

    const cta = document.createElement("span");
    cta.className = "experience-cta";
    cta.textContent = "Open experience";

    content.appendChild(title);
    content.appendChild(description);
    content.appendChild(cta);
    link.appendChild(image);
    link.appendChild(content);
    article.appendChild(link);

    return article;
  }

  fetch("experiences/experiences.json")
    .then(function (response) {
      if (!response.ok) {
        throw new Error("Failed to load experiences catalog");
      }

      return response.json();
    })
    .then(function (experiences) {
      experiences.forEach(function (experience) {
        gridEl.appendChild(renderCard(experience));
      });
    })
    .catch(function (error) {
      console.error("Unable to load experiences:", error);
      gridEl.innerHTML = "<p class=\"landing-error\">Unable to load experiences right now.</p>";
    });
})();
