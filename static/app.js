const apiUrl = "/api/opportunities";
const opportunityList = document.getElementById("opportunity-list");
const countLabel = document.getElementById("opportunity-count");
const emptyState = document.getElementById("empty-state");
const messageBox = document.getElementById("message");
const formModal = document.getElementById("form-modal");
const detailsModal = document.getElementById("details-modal");
const form = document.getElementById("opportunity-form");
let opportunities = [];
let selectedOpportunity = null;
let messageTimer;

function showMessage(message, type = "success") {
    clearTimeout(messageTimer);
    messageBox.textContent = message;
    messageBox.className = `message ${type}`;
    window.scrollTo({ top: 0, behavior: "smooth" });
    messageTimer = setTimeout(() => messageBox.classList.add("hidden"), 5000);
}

async function apiRequest(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        headers: { "Content-Type": "application/json", ...(options.headers || {}) }
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
        const details = body.details ? " " + Object.values(body.details).join(" ") : "";
        throw new Error((body.error || `Request failed (${response.status}).`) + details);
    }
    return body;
}

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[character]);
}

function renderOpportunities() {
    const filter = document.getElementById("status-filter").value;
    const shown = opportunities.filter(item => filter === "All" || item.status === filter);
    countLabel.textContent = shown.length;
    opportunityList.innerHTML = "";
    emptyState.classList.toggle("hidden", shown.length !== 0);
    if (!shown.length) return;

    shown.forEach(item => {
        const card = document.createElement("article");
        card.className = "opportunity-card";
        const statusClass = item.status === "Closed" ? "closed" : "";
        card.innerHTML = `
            <div class="card-top"><span class="tag ${statusClass}">${escapeHtml(item.status)}</span><span class="area">${escapeHtml(item.research_area)}</span></div>
            <h3>${escapeHtml(item.title)}</h3>
            <p class="description">${escapeHtml(item.description)}</p>
            <div class="card-meta"><span>♙ ${escapeHtml(item.faculty_name)}</span><span>▤ ${escapeHtml(item.positions)} position(s)</span><span>◷ ${escapeHtml(item.deadline)}</span></div>
            <div class="card-actions">
                <button class="button button-light" data-action="details" data-id="${item.id}">View details</button>
                <button class="button button-light" data-action="edit" data-id="${item.id}">Edit</button>
                <button class="button button-danger" data-action="delete" data-id="${item.id}">Delete</button>
            </div>`;
        opportunityList.appendChild(card);
    });
}

async function loadOpportunities() {
    opportunityList.innerHTML = '<p class="loading">Loading opportunities…</p>';
    try {
        opportunities = await apiRequest(apiUrl);
        renderOpportunities();
    } catch (error) {
        opportunityList.innerHTML = "";
        emptyState.classList.add("hidden");
        showMessage(error.message + " Check that Flask and MySQL are running.", "error");
    }
}

function openCreateForm() {
    selectedOpportunity = null;
    form.reset();
    form.elements.status.value = "Open";
    form.elements.positions.value = "1";
    document.getElementById("form-heading").textContent = "Create opportunity";
    document.getElementById("save-button").textContent = "Save opportunity";
    formModal.classList.remove("hidden");
}

function openEditForm(item) {
    selectedOpportunity = item;
    form.reset();
    Object.keys(item).forEach(key => {
        if (form.elements[key]) form.elements[key].value = item[key] ?? "";
    });
    document.getElementById("form-heading").textContent = "Update opportunity";
    document.getElementById("save-button").textContent = "Save changes";
    detailsModal.classList.add("hidden");
    formModal.classList.remove("hidden");
}

function closeForm() { formModal.classList.add("hidden"); }
function closeDetails() { detailsModal.classList.add("hidden"); }

function addDetail(container, label, value, full = false, isTitle = false) {
    const item = document.createElement("div");
    item.className = `detail-item${full ? " full" : ""}`;
    const labelElement = document.createElement("div");
    labelElement.className = "detail-label";
    labelElement.textContent = label;
    const valueElement = document.createElement("div");
    valueElement.className = `detail-value${isTitle ? " title-value" : ""}`;
    valueElement.textContent = value ?? "—";
    item.append(labelElement, valueElement);
    container.appendChild(item);
}

function showDetails(item) {
    selectedOpportunity = item;
    document.getElementById("details-heading").textContent = item.title;
    const content = document.getElementById("details-content");
    content.innerHTML = "";
    addDetail(content, "Research title", item.title, true, true);
    addDetail(content, "Description", item.description, true);
    addDetail(content, "Research area", item.research_area);
    addDetail(content, "Faculty member", item.faculty_name);
    addDetail(content, "Department", item.department);
    addDetail(content, "Required skills", item.required_skills);
    addDetail(content, "Available positions", item.positions);
    addDetail(content, "Application deadline", item.deadline);
    addDetail(content, "Status", item.status);
    document.getElementById("details-close-status").textContent = item.status === "Open" ? "Close opportunity" : "Reopen opportunity";
    detailsModal.classList.remove("hidden");
}

form.addEventListener("submit", async event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const data = Object.fromEntries(new FormData(form).entries());
    data.positions = Number(data.positions);
    const saveButton = document.getElementById("save-button");
    saveButton.disabled = true;
    try {
        if (selectedOpportunity) {
            await apiRequest(`${apiUrl}/${selectedOpportunity.id}`, { method: "PUT", body: JSON.stringify(data) });
            showMessage("Research opportunity updated successfully.");
        } else {
            await apiRequest(apiUrl, { method: "POST", body: JSON.stringify(data) });
            showMessage("Research opportunity created successfully.");
        }
        closeForm();
        await loadOpportunities();
    } catch (error) {
        showMessage(error.message, "error");
    } finally {
        saveButton.disabled = false;
    }
});

opportunityList.addEventListener("click", async event => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const id = Number(button.dataset.id);
    const item = opportunities.find(opportunity => opportunity.id === id);
    if (!item) return;
    if (button.dataset.action === "details") {
        try { showDetails(await apiRequest(`${apiUrl}/${id}`)); }
        catch (error) { showMessage(error.message, "error"); }
    } else if (button.dataset.action === "edit") {
        try { openEditForm(await apiRequest(`${apiUrl}/${id}`)); }
        catch (error) { showMessage(error.message, "error"); }
    } else if (button.dataset.action === "delete") {
        if (!confirm(`Delete “${item.title}”? This cannot be undone.`)) return;
        try {
            await apiRequest(`${apiUrl}/${id}`, { method: "DELETE" });
            showMessage("Research opportunity deleted successfully.");
            await loadOpportunities();
        } catch (error) { showMessage(error.message, "error"); }
    }
});

document.getElementById("new-button").addEventListener("click", openCreateForm);
document.getElementById("close-form").addEventListener("click", closeForm);
document.getElementById("cancel-form").addEventListener("click", closeForm);
document.getElementById("close-details").addEventListener("click", closeDetails);
document.getElementById("status-filter").addEventListener("change", renderOpportunities);
document.getElementById("details-edit").addEventListener("click", () => {
    if (selectedOpportunity) openEditForm(selectedOpportunity);
});
document.getElementById("details-close-status").addEventListener("click", async () => {
    if (!selectedOpportunity) return;
    const updated = { ...selectedOpportunity, status: selectedOpportunity.status === "Open" ? "Closed" : "Open" };
    try {
        await apiRequest(`${apiUrl}/${selectedOpportunity.id}`, { method: "PUT", body: JSON.stringify(updated) });
        closeDetails();
        showMessage(`Opportunity status changed to ${updated.status}.`);
        await loadOpportunities();
    } catch (error) { showMessage(error.message, "error"); }
});

[formModal, detailsModal].forEach(modal => modal.addEventListener("click", event => {
    if (event.target === modal) modal.classList.add("hidden");
}));
document.addEventListener("keydown", event => {
    if (event.key === "Escape") { closeForm(); closeDetails(); }
});

loadOpportunities();
