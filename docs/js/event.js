document.addEventListener("DOMContentLoaded", async () => {
    const tbody = document.querySelector("#territoryTableBody");

    if (!tbody) return;

    if (!window.supabaseClient) {
        alert("Supabase connection is not initialized.");
        return;
    }

    const db = window.supabaseClient;

    // =========================================
    // AUTHENTICATION CHECK
    // =========================================

    const { data: sessionData, error: sessionError } =
        await db.auth.getSession();

    if (sessionError || !sessionData.session) {
        window.location.replace("./index.html");
        return;
    }

    // =========================================
    // LOGOUT
    // =========================================

    const logoutBtn = document.querySelector("#logoutBtn");

    if (logoutBtn) {
        logoutBtn.addEventListener("click", async () => {
            const confirmLogout = confirm("Are you sure you want to log out?");

            if (!confirmLogout) return;

            logoutBtn.disabled = true;
            logoutBtn.textContent = "Signing out...";

            const { error } = await db.auth.signOut();

            if (error) {
                alert("Logout failed: " + error.message);
                logoutBtn.disabled = false;
                logoutBtn.textContent = "↪ Logout";
                return;
            }

            window.location.replace("./index.html");
        });
    }

    // =========================================
    // CHANGE PASSWORD
    // =========================================

    const changePasswordBtn = document.querySelector("#changePasswordBtn");
    const passwordModal = document.querySelector("#passwordModal");
    const closePasswordModal = document.querySelector("#closePasswordModal");
    const cancelPasswordBtn = document.querySelector("#cancelPasswordBtn");
    const changePasswordForm = document.querySelector("#changePasswordForm");
    const passwordMessage = document.querySelector("#passwordMessage");
    const savePasswordBtn = document.querySelector("#savePasswordBtn");

    if (changePasswordBtn && passwordModal) {
        changePasswordBtn.addEventListener("click", () => {
            passwordModal.style.display = "flex";

            if (passwordMessage) passwordMessage.textContent = "";
            if (changePasswordForm) changePasswordForm.reset();
        });
    }

    function closePasswordWindow() {
        if (passwordModal) passwordModal.style.display = "none";
        if (changePasswordForm) changePasswordForm.reset();
        if (passwordMessage) passwordMessage.textContent = "";
    }

    if (closePasswordModal) {
        closePasswordModal.addEventListener("click", closePasswordWindow);
    }

    if (cancelPasswordBtn) {
        cancelPasswordBtn.addEventListener("click", closePasswordWindow);
    }

    if (changePasswordForm) {
        changePasswordForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            const newPassword = document.querySelector("#newPassword").value;

            const confirmPassword =
                document.querySelector("#confirmPassword").value;

            passwordMessage.style.color = "red";

            if (newPassword.length < 6) {
                passwordMessage.textContent =
                    "Password must contain at least 6 characters.";
                return;
            }

            if (newPassword !== confirmPassword) {
                passwordMessage.textContent = "Passwords do not match.";
                return;
            }

            savePasswordBtn.disabled = true;
            savePasswordBtn.textContent = "Saving...";

            const { error } = await db.auth.updateUser({
                password: newPassword,
            });

            if (error) {
                passwordMessage.textContent = error.message;
                savePasswordBtn.disabled = false;
                savePasswordBtn.textContent = "OK";
                return;
            }

            passwordMessage.style.color = "green";
            passwordMessage.textContent = "Password successfully changed!";

            savePasswordBtn.disabled = false;
            savePasswordBtn.textContent = "OK";

            changePasswordForm.reset();
        });
    }

    // =========================================
    // HELPER FUNCTIONS
    // =========================================

    const escapeHtml = (value) => {
        return String(value ?? "").replace(
            /[&<>"']/g,
            (char) =>
                ({
                    "&": "&amp;",
                    "<": "&lt;",
                    ">": "&gt;",
                    '"': "&quot;",
                    "'": "&#039;",
                })[char],
        );
    };

    const getDateValue = (value) => {
        if (!value || value === "N/A") return "";
        return String(value).substring(0, 10);
    };

    const getDisplayValue = (value) => {
        return value ? value : "N/A";
    };

    // =========================================
    // SORTING
    // =========================================

    let currentSort = {
        column: "territory_no",
        direction: "asc",
    };

    function updateSortIcons() {
        document.querySelectorAll("th[data-sort]").forEach((header) => {
            const icon = header.querySelector(".sort-icon");

            if (!icon) return;

            if (header.dataset.sort === currentSort.column) {
                icon.textContent = currentSort.direction === "asc" ? "▲" : "▼";
            } else {
                icon.textContent = "↕";
            }
        });
    }

    // =========================================
    // RETRIEVE TERRITORY RECORDS
    // =========================================

    async function requestTerritories() {
        const form = document.querySelector("#filterForm");
        const formData = form ? new FormData(form) : new FormData();

        const assignedTo = formData.get("assigned_to") || "";
        const completionStatus = formData.get("date_completed") || "";

        let query = db.from("territory_records").select("*");

        // Assigned group filter.
        if (assignedTo) {
            query = query.eq("assign_to", assignedTo);
        }

        // Completion status filter.
        if (completionStatus === "completed") {
            query = query.not("date_completed", "is", null);
        } else if (completionStatus === "not completed") {
            query = query.is("date_completed", null);
        }

        // Sorting.
        let sortDirection = currentSort.direction;

        if (completionStatus === "asc" || completionStatus === "desc") {
            currentSort.column = "date_completed";
            currentSort.direction = completionStatus;
            sortDirection = completionStatus;
        }

        const allowedColumns = [
            "brgy_name",
            "service_year",
            "territory_no",
            "last_completed",
            "assign_to",
            "date_assigned",
            "date_completed",
        ];

        const sortColumn = allowedColumns.includes(currentSort.column)
            ? currentSort.column
            : "territory_no";

        query = query.order(sortColumn, {
            ascending: sortDirection === "asc",
            nullsFirst: false,
        });

        const { data, error } = await query;

        if (error) {
            console.error("Supabase retrieval error:", error);
            throw new Error(error.message);
        }

        return data || [];
    }

    // =========================================
    // SUMMARY CARDS
    // =========================================

    function updateSummary(records) {
        const total = records.length;

        const completed = records.filter(
            (record) => record.date_completed,
        ).length;

        const pending = total - completed;

        const assigned = records.filter((record) => record.assign_to).length;

        const totalElement = document.querySelector("#totalTerritories");
        const completedElement = document.querySelector(
            "#completedTerritories",
        );
        const pendingElement = document.querySelector("#pendingTerritories");
        const assignedElement = document.querySelector("#assignedTerritories");
        const recordCount = document.querySelector("#recordCount");

        if (totalElement) totalElement.textContent = total;
        if (completedElement) completedElement.textContent = completed;
        if (pendingElement) pendingElement.textContent = pending;
        if (assignedElement) assignedElement.textContent = assigned;
        if (recordCount) recordCount.textContent = `${total} Records`;

        // Service year display.
        const serviceYearDisplay = document.querySelector(
            "#serviceYearDisplay",
        );

        if (serviceYearDisplay) {
            const years = [
                ...new Set(
                    records
                        .map((record) => record.service_year)
                        .filter(Boolean),
                ),
            ];

            serviceYearDisplay.textContent = years.length
                ? years.join(", ")
                : "N/A";
        }
    }

    // =========================================
    // DISPLAY TERRITORY RECORDS
    // =========================================

    function assignmentCell(record, section) {
    // All three sections use the first assignment's group.
    const assignedTo = record.assign_to || "";

    const suffix = section === 1 ? "" : `_${section}`;
    const dateAssigned = record[`date_assigned${suffix}`] || "";
    const dateCompleted = record[`date_completed${suffix}`] || "";

    const hasDates = Boolean(dateAssigned || dateCompleted);

    return `
        <td class="assignment-column ${hasDates ? "assignment-filled" : ""}">
            <div class="assignment-cell">
                <div class="assignment-label">Assigned to</div>

                <div class="assignment-person">
                    ${escapeHtml(getDisplayValue(assignedTo))}
                </div>

                <div class="assignment-date-headings">
                    <span>Date assigned</span>
                    <span>Date completed</span>
                </div>

                <div class="assignment-date-values">
                    <span>${escapeHtml(getDisplayValue(dateAssigned))}</span>
                    <span>${escapeHtml(getDisplayValue(dateCompleted))}</span>
                </div>
            </div>
        </td>
    `;
}

    function displayTerritories(records) {
        updateSummary(records);

        tbody.innerHTML = records
            .map(
                (record) => `
                    <tr id="row-${escapeHtml(record.id)}"
                        data-editing="false">

                        <td>
                            <div class="barangay-cell">
                                <span class="location-icon">📍</span>
                                <strong>${escapeHtml(record.brgy_name)}</strong>
                            </div>
                        </td>

                        <td>
                            <strong class="territory-number">
                                ${escapeHtml(record.territory_no)}
                            </strong>
                        </td>

                        <td>
                            ${escapeHtml(getDisplayValue(record.last_completed))}
                        </td>

                        ${assignmentCell(record, 1)}
                        ${assignmentCell(record, 2)}
                        ${assignmentCell(record, 3)}

                        <td>
                            <button
                                type="button"
                                class="edit-btn"
                                data-id="${escapeHtml(record.id)}">
                                ✎ Edit
                            </button>
                        </td>

                    </tr>
                `,
            )
            .join("");

        updateSortIcons();
    }

    // =========================================
    // LOAD TERRITORIES
    // =========================================

    async function loadTerritories() {
        try {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align:center;padding:25px;">
                        Loading territory records...
                    </td>
                </tr>
            `;

            const records = await requestTerritories();

            displayTerritories(records);
        } catch (error) {
            console.error("Loading territories failed:", error);

            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align:center;padding:25px;">
                        Unable to load territory records.
                    </td>
                </tr>
            `;

            alert(error.message || "Unable to load records.");
        }
    }

    // =========================================
    // START EDITING
    // =========================================

    function startEditing(row) {
    if (!row || row.dataset.editing === "true") return;

    const cells = row.querySelectorAll("td");

    if (cells.length !== 7) {
        console.error("Cannot edit: expected 7 table cells but found", cells.length);
        return;
    }

    row.dataset.editing = "true";

    const original = {
        last_completed: cells[2].textContent.trim(),
        assign_to: "",
        assignments: [],
    };

    // The first assignment is the source of the assigned group.
    const firstPerson = cells[3].querySelector(".assignment-person");

    original.assign_to =
        firstPerson && firstPerson.textContent.trim() !== "N/A"
            ? firstPerson.textContent.trim()
            : "";

    // Preserve the three assignment dates.
    for (let section = 1; section <= 3; section++) {
        const cell = cells[2 + section];
        const dates = cell.querySelectorAll(
            ".assignment-date-values span"
        );

        original.assignments.push({
            date_assigned:
                dates[0] && dates[0].textContent.trim() !== "N/A"
                    ? dates[0].textContent.trim()
                    : "",

            date_completed:
                dates[1] && dates[1].textContent.trim() !== "N/A"
                    ? dates[1].textContent.trim()
                    : "",
        });
    }

    row.dataset.original = JSON.stringify(original);

    // Last completed date.
    cells[2].innerHTML = `
        <input type="date"
            class="edit-input"
            value="${escapeHtml(getDateValue(original.last_completed))}">
    `;

    // Display the assigned group as read-only.
    // Only the two date fields are editable.
    for (let section = 1; section <= 3; section++) {
        const cell = cells[2 + section];
        const data = original.assignments[section - 1];

        cell.innerHTML = `
            <div class="assignment-editor">
                <label>Assigned to</label>

                <div class="assignment-person assignment-readonly">
                    ${escapeHtml(getDisplayValue(original.assign_to))}
                </div>

                <div class="assignment-date-headings">
                    <span>Date assigned</span>
                    <span>Date completed</span>
                </div>

                <div class="assignment-date-inputs">
                    <input type="date"
                        class="edit-input assignment-date-assigned"
                        value="${escapeHtml(getDateValue(data.date_assigned))}">

                    <input type="date"
                        class="edit-input assignment-date-completed"
                        value="${escapeHtml(getDateValue(data.date_completed))}">
                </div>
            </div>
        `;
    }

    // Actions column.
    cells[6].innerHTML = `
        <button type="button" class="save-btn">Save</button>
        <button type="button" class="cancel-btn">Cancel</button>
    `;
}

    // =========================================
    // CANCEL EDITING
    // =========================================

   function cancelEditing(row) {
    if (!row) return;

    const original = JSON.parse(row.dataset.original || "{}");
    const cells = row.querySelectorAll("td");

    if (cells.length !== 7 || !original.assignments) return;

    cells[2].textContent = getDisplayValue(original.last_completed);

    for (let section = 1; section <= 3; section++) {
        const cell = cells[2 + section];
        const data = original.assignments[section - 1];

        if (!cell || !data) continue;

        const hasDates = Boolean(
            data.date_assigned || data.date_completed
        );

        cell.classList.toggle("assignment-filled", hasDates);

        cell.innerHTML = `
            <div class="assignment-cell">
                <div class="assignment-label">Assigned to</div>

                <div class="assignment-person">
                    ${escapeHtml(getDisplayValue(original.assign_to))}
                </div>

                <div class="assignment-date-headings">
                    <span>Date assigned</span>
                    <span>Date completed</span>
                </div>

                <div class="assignment-date-values">
                    <span>${escapeHtml(getDisplayValue(data.date_assigned))}</span>
                    <span>${escapeHtml(getDisplayValue(data.date_completed))}</span>
                </div>
            </div>
        `;
    }

    cells[6].innerHTML = `
        <button type="button"
            class="edit-btn"
            data-id="${escapeHtml(row.id.replace("row-", ""))}">
            ✎ Edit
        </button>
    `;

    row.dataset.editing = "false";
    delete row.dataset.original;
}

    // =========================================
    // SAVE EDITING
    // =========================================

     

    // =========================================
    // EDIT, SAVE, CANCEL EVENT LISTENER
    // =========================================

    tbody.addEventListener("click", async (event) => {
        const button = event.target.closest("button");

        if (!button) return;

        const row = button.closest("tr");

        if (!row) return;

        if (button.classList.contains("edit-btn")) {
            startEditing(row);
            return;
        }

        if (button.classList.contains("cancel-btn")) {
            cancelEditing(row);
            return;
        }

        if (button.classList.contains("save-btn")) {
            await saveEditing(row);
        }
    });

    // =========================================
    // FILTER BUTTON
    // =========================================

    const filterBtn = document.querySelector("#filterBtn");

    if (filterBtn) {
        filterBtn.addEventListener("click", async (event) => {
            event.preventDefault();
            await loadTerritories();
        });
    }

    // =========================================
    // COLUMN SORTING
    // =========================================

    document.querySelectorAll("th[data-sort]").forEach((header) => {
        header.addEventListener("click", async () => {
            const column = header.dataset.sort;

            currentSort.direction =
                currentSort.column === column && currentSort.direction === "asc"
                    ? "desc"
                    : "asc";

            currentSort.column = column;

            await loadTerritories();
        });
    });

    // =========================================
    // INITIAL DATABASE LOADING
    // =========================================

    await loadTerritories();
});