document.addEventListener("DOMContentLoaded", async () => {
    const tbody = document.querySelector("#territoryTableBody");

    if (!tbody) return;

    if (!window.supabaseClient) {
        alert("Supabase connection is not initialized.");
        return;
    }

    const db = window.supabaseClient;

    // Check if the user is authenticated.
    const { data: sessionData, error: sessionError } =
        await db.auth.getSession();

    if (sessionError || !sessionData.session) {
        window.location.replace("/");
        return;
    }

    // Logout functionality
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

            window.location.replace("/");
        });
    }

    // =========================================
    // CHANGE PASSWORD FUNCTIONALITY
    // =========================================

    const changePasswordBtn = document.querySelector("#changePasswordBtn");
    const passwordModal = document.querySelector("#passwordModal");
    const closePasswordModal = document.querySelector("#closePasswordModal");
    const cancelPasswordBtn = document.querySelector("#cancelPasswordBtn");
    const changePasswordForm = document.querySelector("#changePasswordForm");
    const passwordMessage = document.querySelector("#passwordMessage");
    const savePasswordBtn = document.querySelector("#savePasswordBtn");

    // Open password window
    if (changePasswordBtn && passwordModal) {
        changePasswordBtn.addEventListener("click", () => {
            passwordModal.style.display = "flex";
            passwordMessage.textContent = "";
            changePasswordForm.reset();
        });
    }

    // Close password window
    function closePasswordWindow() {
        passwordModal.style.display = "none";
        changePasswordForm.reset();
        passwordMessage.textContent = "";
    }

    if (closePasswordModal) {
        closePasswordModal.addEventListener("click", closePasswordWindow);
    }

    if (cancelPasswordBtn) {
        cancelPasswordBtn.addEventListener("click", closePasswordWindow);
    }

    // Save new password
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

    let currentSort = {
        column: "territory_no",
        direction: "asc",
    };

    // Retrieve records directly from Supabase.
    async function requestTerritories() {
        const form = document.querySelector("#filterForm");
        const formData = new FormData(form || undefined);

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

        // Determine sorting.
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

    // Update summary cards and record count.
    function updateSummary(records) {
        const total = records.length;

        const completed = records.filter(
            (record) => record.date_completed,
        ).length;

        const pending = total - completed;

        const assigned = records.filter((record) => record.assign_to).length;

        document.querySelector("#totalTerritories").textContent = total;
        document.querySelector("#completedTerritories").textContent = completed;
        document.querySelector("#pendingTerritories").textContent = pending;
        document.querySelector("#assignedTerritories").textContent = assigned;

        document.querySelector("#recordCount").textContent = `${total} Records`;
    }

    // Display territory records.
    function displayTerritories(records) {
        updateSummary(records);

        tbody.innerHTML = records
            .map(
                (record) => `
            <tr id="row-${escapeHtml(record.id)}" data-editing="false">

                <td>
                    <div class="barangay-cell">
                        <span class="location-icon">📍</span>
                        <strong>${escapeHtml(record.brgy_name)}</strong>
                    </div>
                </td>

                <td>
                    <span class="year-badge">
                        ${escapeHtml(record.service_year)}
                    </span>
                </td>

                <td>
                    <strong class="territory-number">
                        ${escapeHtml(record.territory_no)}
                    </strong>
                </td>

                <td>${escapeHtml(getDisplayValue(record.last_completed))}</td>

                <td>
                    ${
                        record.assign_to
                            ? `<span class="group-badge">${escapeHtml(record.assign_to)}</span>`
                            : `<span class="muted-text">Unassigned</span>`
                    }
                </td>

                <td>${escapeHtml(getDisplayValue(record.date_assigned))}</td>

                <td>
                    ${
                        record.date_completed
                            ? `
                            <span class="status-badge completed">
                                <span class="status-dot"></span>
                                Completed
                            </span>
                            <div class="date-subtext">
                                ${escapeHtml(record.date_completed)}
                            </div>
                        `
                            : `
                            <span class="status-badge pending">
                                <span class="status-dot"></span>
                                Pending
                            </span>
                        `
                    }
                </td>

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

    // Load records.
    async function loadTerritories() {
        try {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align:center;padding:25px;">
                        Loading territory records...
                    </td>
                </tr>
            `;

            const records = await requestTerritories();
            displayTerritories(records);
        } catch (error) {
            console.error(error);

            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align:center;padding:25px;">
                        Unable to load territory records.
                    </td>
                </tr>
            `;

            alert(error.message || "Unable to load records.");
        }
    }

    function startEditing(row) {
        if (!row || row.dataset.editing === "true") return;

        const cells = row.querySelectorAll("td");

        if (cells.length < 8) return;

        row.dataset.editing = "true";

        const original = {
            last_completed: cells[3].textContent.trim(),
            assign_to:
                cells[4].querySelector(".group-badge")?.textContent.trim() ||
                "",
            date_assigned: cells[5].textContent.trim(),
            date_completed:
                cells[6].querySelector(".date-subtext")?.textContent.trim() ||
                "",
        };

        row.dataset.original = JSON.stringify(original);

        cells[3].innerHTML = `
            <input type="date" class="edit-input"
                value="${escapeHtml(getDateValue(original.last_completed))}">
        `;

        const groups = ["Group 1", "Group 2", "Group 3", "Congregation", "RP"];

        cells[4].innerHTML = `
            <select class="edit-input">
                <option value="">Select Group</option>
                ${groups
                    .map(
                        (group) => `
                    <option value="${group}"
                        ${original.assign_to === group ? "selected" : ""}>
                        ${group}
                    </option>
                `,
                    )
                    .join("")}
            </select>
        `;

        cells[5].innerHTML = `
            <input type="date" class="edit-input"
                value="${escapeHtml(getDateValue(original.date_assigned))}">
        `;

        cells[6].innerHTML = `
            <input type="date" class="edit-input"
                value="${escapeHtml(getDateValue(original.date_completed))}">
        `;

        cells[7].innerHTML = `
            <button type="button" class="save-btn">Save</button>
            <button type="button" class="cancel-btn">Cancel</button>
        `;
    }

    function cancelEditing(row) {
        const original = JSON.parse(row.dataset.original || "{}");
        const cells = row.querySelectorAll("td");

        cells[3].textContent = getDisplayValue(original.last_completed);

        cells[4].innerHTML = original.assign_to
            ? `<span class="group-badge">${escapeHtml(original.assign_to)}</span>`
            : `<span class="muted-text">Unassigned</span>`;

        cells[5].textContent = getDisplayValue(original.date_assigned);

        cells[6].innerHTML = original.date_completed
            ? `
                <span class="status-badge completed">
                    <span class="status-dot"></span>
                    Completed
                </span>
                <div class="date-subtext">
                    ${escapeHtml(original.date_completed)}
                </div>
            `
            : `
                <span class="status-badge pending">
                    <span class="status-dot"></span>
                    Pending
                </span>
            `;

        cells[7].innerHTML = `
            <button type="button" class="edit-btn"
                data-id="${escapeHtml(row.id.replace("row-", ""))}">
                ✎ Edit
            </button>
        `;

        row.dataset.editing = "false";
        delete row.dataset.original;
    }

    async function saveEditing(row) {
        const cells = row.querySelectorAll("td");
        const saveButton = row.querySelector(".save-btn");

        const updatedData = {
            id: row.id.replace("row-", ""),
            last_completed: cells[3].querySelector("input").value,
            assign_to: cells[4].querySelector("select").value,
            date_assigned: cells[5].querySelector("input").value,
            date_completed: cells[6].querySelector("input").value,
        };

        if (!updatedData.assign_to) {
            alert("Please select an assigned group.");
            return;
        }

        saveButton.disabled = true;
        saveButton.textContent = "Saving...";

        try {
            await window.updateTerritory(updatedData);

            await loadTerritories();

            alert("Territory updated successfully!");
        } catch (error) {
            console.error("Save error:", error);

            alert(error.message || "Failed to update territory.");

            saveButton.disabled = false;
            saveButton.textContent = "Save";
        }
    }

    // Edit, Save, Cancel.
    tbody.addEventListener("click", async (event) => {
        const button = event.target.closest("button");

        if (!button) return;

        const row = button.closest("tr");

        if (!row) return;

        if (button.classList.contains("edit-btn")) {
            startEditing(row);
        }

        if (button.classList.contains("cancel-btn")) {
            cancelEditing(row);
        }

        if (button.classList.contains("save-btn")) {
            await saveEditing(row);
        }
    });

    // Apply filters.
    const filterBtn = document.querySelector("#filterBtn");

    if (filterBtn) {
        filterBtn.addEventListener("click", async (event) => {
            event.preventDefault();
            await loadTerritories();
        });
    }

    // Column sorting.
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

    // Initial database loading.
    loadTerritories();
});
