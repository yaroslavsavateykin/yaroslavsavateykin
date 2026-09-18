const toolsGrid = document.querySelector("#tools-grid");

function escapeHtml(value) {
  const element = document.createElement("span");
  element.textContent = value;
  return element.innerHTML;
}

function renderTools(tools) {
  toolsGrid.innerHTML = tools.map((tool, index) => `
    <article class="tool-card tool-card-${index + 1}">
      <div class="card-heading"><h3>${escapeHtml(tool.name)}</h3><span class="card-topline">${escapeHtml(tool.category)}</span></div>
      <p class="tool-description">${escapeHtml(tool.description)}</p>
      <div class="card-meta"><span class="status ${tool.status === "In progress" ? "status-progress" : ""}">${escapeHtml(tool.status)}</span><a href="${escapeHtml(tool.url)}" target="_blank" rel="noreferrer">Open <span aria-hidden="true">↗</span></a></div>
      <div class="tags" aria-label="Technologies">${tool.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>
    </article>`).join("");
}

async function loadTools() {
  try {
    const response = await fetch("data/tools.json");
    if (!response.ok) throw new Error("Tools catalog could not be loaded.");
    const catalog = await response.json();
    renderTools(catalog.tools);
  } catch (error) {
    toolsGrid.innerHTML = `<p class="loading error">${escapeHtml(error.message)}</p>`;
  }
}

loadTools();
