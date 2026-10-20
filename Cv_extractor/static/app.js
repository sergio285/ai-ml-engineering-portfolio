const ALLOWED_EXTENSIONS = [".pdf", ".txt"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MegaBytes

const dropzone = document.getElementById("dropzone");
const dropzoneText = document.getElementById("dropzone-text");
const fileInput = document.getElementById("file-input");
const extractBtn = document.getElementById("extract-btn");
const clearBtn = document.getElementById("clear-btn");
const copyBtn = document.getElementById("copy-btn");
const statusEl = document.getElementById("status");
const resultSection = document.getElementById("result");
const resultView = document.getElementById("result-view");
const resultJson = document.getElementById("result-json");

let selectedFile = null;
let currentData = null;

function setStatus(message, type = "") {
    statusEl.textContent = message;
    statusEl.className = "status" + (type ? " " + type : "");
}

function showError(message) {
    setStatus(message, "error");
    Swal.fire({ icon: "error", title: "Error", text: message });
}

async function confirmNotCv(message) {
    const result = await Swal.fire({
        icon: "warning",
        title: "Is this a CV?",
        text: message,
        showCancelButton: true,
        confirmButtonText: "Yes, continue",
        cancelButtonText: "Cancel",
    });
    return result.isConfirmed;
}

function getExtension(filename) {
    const index = filename.lastIndexOf(".");
    return index === -1 ? "" : filename.slice(index).toLowerCase();
}

function selectFile(file) {
    if (!file) return;

    if (!ALLOWED_EXTENSIONS.includes(getExtension(file.name))) {
        showError("Invalid file type. Only PDF and TXT files are allowed.");
        return;
    }
    if (file.size > MAX_FILE_SIZE) {
        showError("The file exceeds the maximum size of 10 MB.");
        return;
    }

    selectedFile = file;
    dropzoneText.textContent = file.name;
    extractBtn.disabled = false;
    clearBtn.disabled = false;
    setStatus("");
}

function reset() {
    selectedFile = null;
    currentData = null;
    fileInput.value = "";
    dropzoneText.textContent = "Drag your file here or click to select it";
    extractBtn.disabled = true;
    clearBtn.disabled = true;
    resultSection.hidden = true;
    resultView.innerHTML = "";
    resultJson.textContent = "";
    setStatus("");
}

// El endpoint devuelve la respuesta de Ollama; el JSON del CV viene como texto en message.content
function parseResponse(payload) {
    if (typeof payload === "string") {
        try {
            payload = JSON.parse(payload);
        } catch {
            return payload;
        }
    }

    let content = payload && payload.message ? payload.message.content : payload;
    if (typeof content !== "string") return content;

    const cleaned = content
        .trim()
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/, "");

    try {
        return JSON.parse(cleaned);
    } catch {
        return cleaned;
    }
}

async function extractCv() {
    if (!selectedFile) return;

    extractBtn.disabled = true;
    resultSection.hidden = true;
    setStatus("Analyzing CV, this may take a few seconds...", "loading");

    const extension = getExtension(selectedFile.name);

    try {
        const body = await selectedFile.arrayBuffer();
        const url = "/api/extract?extension=" + encodeURIComponent(extension);
        const request = (confirm) => fetch(url + (confirm ? "&confirm=true" : ""), {
            method: "POST",
            headers: { "Content-Type": "application/octet-stream" },
            body,
        });

        let response = await request(false);
        let payload = await response.json().catch(() => null);

        if (response.status === 409 && payload && payload.detail && payload.detail.code === "not_a_cv") {
            if (!(await confirmNotCv(payload.detail.message))) {
                setStatus("Extraction cancelled.");
                return;
            }
            setStatus("Analyzing CV, this may take a few seconds...", "loading");
            response = await request(true);
            payload = await response.json().catch(() => null);
        }

        if (!response.ok) {
            const detail = payload && payload.detail;
            throw new Error(
                typeof detail === "string" ? detail : "Server error (" + response.status + ")"
            );
        }

        currentData = parseResponse(payload);
        renderResult(currentData);
        setStatus("Information extracted successfully.", "success");
    } catch (error) {
        showError(error.message || "The file could not be processed.");
    } finally {
        extractBtn.disabled = false;
    }
}

/* ---------- Render ---------- */

function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
}

function isEmpty(value) {
    return value === null || value === undefined || value === "" ||
        (Array.isArray(value) && value.length === 0);
}

function section(title) {
    const wrapper = el("div", "section");
    wrapper.appendChild(el("h3", "", title));
    return wrapper;
}

function emptyNote(wrapper) {
    wrapper.appendChild(el("p", "empty", "No information"));
}

function tags(list) {
    const box = el("div", "tags");
    list.forEach((item) => box.appendChild(el("span", "tag", item)));
    return box;
}

function bulletList(list) {
    const ul = el("ul");
    list.forEach((item) => ul.appendChild(el("li", "", item)));
    return ul;
}

function labeled(item, label, list, builder) {
    if (isEmpty(list)) return;
    item.appendChild(el("p", "label", label));
    item.appendChild(builder(list));
}

function dateRange(start, end, isCurrent) {
    const to = isCurrent ? "Present" : end;
    return [start, to].filter((value) => !isEmpty(value)).join(" - ");
}

function fieldList(entries) {
    const dl = el("dl", "fields");
    entries.forEach(([label, value]) => {
        if (isEmpty(value)) return;
        dl.appendChild(el("dt", "", label));
        dl.appendChild(el("dd", "", value));
    });
    return dl;
}

function renderPersonal(data) {
    const wrapper = section("Personal information");
    const p = data.personal_information || {};
    const dl = fieldList([
        ["Name", p.full_name],
        ["Email", p.email],
        ["Phone", p.phone],
        ["Location", p.location],
        ["LinkedIn", p.linkedin],
        ["GitHub", p.github],
        ["Portfolio", p.portfolio],
    ]);
    if (dl.children.length) wrapper.appendChild(dl);
    else emptyNote(wrapper);
    return wrapper;
}

function renderSummary(data) {
    const wrapper = section("Professional summary");
    if (isEmpty(data.professional_summary)) emptyNote(wrapper);
    else wrapper.appendChild(el("p", "", data.professional_summary));
    return wrapper;
}

function renderExperience(data) {
    const wrapper = section("Work experience");
    const list = data.work_experience || [];
    if (isEmpty(list)) emptyNote(wrapper);

    list.forEach((job) => {
        const item = el("div", "item");
        const title = [job.position, job.company].filter((v) => !isEmpty(v)).join(" · ");
        item.appendChild(el("p", "item-title", title || "Untitled"));

        const dates = dateRange(job.start_date, job.end_date, job.is_current);
        if (dates) item.appendChild(el("p", "label", dates));

        labeled(item, "Responsibilities", job.responsibilities, bulletList);
        labeled(item, "Achievements", job.achievements, bulletList);
        labeled(item, "Technologies", job.technologies, tags);
        wrapper.appendChild(item);
    });
    return wrapper;
}

function renderEducation(data) {
    const wrapper = section("Education");
    const list = data.education || [];
    if (isEmpty(list)) emptyNote(wrapper);

    list.forEach((edu) => {
        const item = el("div", "item");
        const title = [edu.degree, edu.field_of_study].filter((v) => !isEmpty(v)).join(" in ");
        item.appendChild(el("p", "item-title", title || "Untitled"));
        if (!isEmpty(edu.institution)) item.appendChild(el("p", "", edu.institution));

        const dates = dateRange(edu.start_date, edu.end_date, false);
        if (dates) item.appendChild(el("p", "label", dates));
        if (!isEmpty(edu.status)) item.appendChild(el("p", "label", "Status: " + edu.status));
        wrapper.appendChild(item);
    });
    return wrapper;
}

function renderSkills(data) {
    const wrapper = section("Skills");
    const skills = data.skills || {};
    const groups = [
        ["Programming languages", skills.programming_languages],
        ["Frameworks and libraries", skills.frameworks_and_libraries],
        ["Tools and platforms", skills.tools_and_platforms],
        ["Databases", skills.databases],
        ["Other skills", skills.other_skills],
    ];

    let any = false;
    groups.forEach(([label, list]) => {
        if (isEmpty(list)) return;
        any = true;
        wrapper.appendChild(el("p", "label", label));
        wrapper.appendChild(tags(list));
    });
    if (!any) emptyNote(wrapper);
    return wrapper;
}

function renderLanguages(data) {
    const wrapper = section("Languages");
    const list = data.languages || [];
    if (isEmpty(list)) emptyNote(wrapper);
    else {
        wrapper.appendChild(
            tags(list.map((l) => [l.language, l.proficiency].filter((v) => !isEmpty(v)).join(" - ")))
        );
    }
    return wrapper;
}

function renderCertifications(data) {
    const wrapper = section("Certifications");
    const list = data.certifications || [];
    if (isEmpty(list)) emptyNote(wrapper);
    else {
        // Pueden venir como texto u objetos, el prompt no fija su estructura
        wrapper.appendChild(
            bulletList(list.map((c) => (typeof c === "string" ? c : JSON.stringify(c))))
        );
    }
    return wrapper;
}

function renderProjects(data) {
    const wrapper = section("Projects");
    const list = data.projects || [];
    if (isEmpty(list)) emptyNote(wrapper);

    list.forEach((project) => {
        const item = el("div", "item");
        item.appendChild(el("p", "item-title", project.name || "Unnamed"));
        if (!isEmpty(project.description)) item.appendChild(el("p", "", project.description));
        labeled(item, "Technologies", project.technologies, tags);
        if (!isEmpty(project.url)) item.appendChild(el("p", "label", project.url));
        wrapper.appendChild(item);
    });
    return wrapper;
}

function renderAdditional(data) {
    const wrapper = section("Additional information");
    const list = data.additional_information || [];
    if (isEmpty(list)) emptyNote(wrapper);
    else {
        wrapper.appendChild(
            bulletList(list.map((a) => (typeof a === "string" ? a : JSON.stringify(a))))
        );
    }
    return wrapper;
}

function renderResult(data) {
    resultView.innerHTML = "";

    if (data === null || typeof data !== "object") {
        resultView.appendChild(el("p", "empty", "The model did not return valid JSON."));
        resultJson.textContent = String(data);
    } else {
        [
            renderPersonal,
            renderSummary,
            renderExperience,
            renderEducation,
            renderSkills,
            renderLanguages,
            renderCertifications,
            renderProjects,
            renderAdditional,
        ].forEach((render) => resultView.appendChild(render(data)));
        resultJson.textContent = JSON.stringify(data, null, 2);
    }

    resultSection.hidden = false;
}

/* ---------- Eventos ---------- */

fileInput.addEventListener("change", () => selectFile(fileInput.files[0]));

["dragenter", "dragover"].forEach((name) =>
    dropzone.addEventListener(name, (event) => {
        event.preventDefault();
        dropzone.classList.add("dragover");
    })
);

["dragleave", "drop"].forEach((name) =>
    dropzone.addEventListener(name, (event) => {
        event.preventDefault();
        dropzone.classList.remove("dragover");
    })
);

dropzone.addEventListener("drop", (event) => selectFile(event.dataTransfer.files[0]));

extractBtn.addEventListener("click", extractCv);
clearBtn.addEventListener("click", reset);

copyBtn.addEventListener("click", async () => {
    if (currentData === null) return;
    const text = typeof currentData === "string" ? currentData : JSON.stringify(currentData, null, 2);
    try {
        await navigator.clipboard.writeText(text);
        setStatus("JSON copied to clipboard.", "success");
    } catch {
        showError("Could not copy to clipboard.");
    }
});
