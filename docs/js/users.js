document.addEventListener("DOMContentLoaded", async () => {
    const db = window.supabaseClient;
    const tbody = document.querySelector("#usersTableBody");

    if (!db) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6">Supabase connection unavailable.</td>
            </tr>
        `;
        return;
    }

    // Check current session
    const { data: sessionData, error: sessionError } =
        await db.auth.getSession();

    if (sessionError || !sessionData.session) {
        window.location.replace("./index.html");
        return;
    }

    // Check administrator role
    const { data: profile, error: profileError } = await db
        .from("profiles")
        .select("role, is_active")
        .eq("id", sessionData.session.user.id)
        .single();

    if (
        profileError ||
        !profile ||
        profile.role !== "admin" ||
        profile.is_active !== true
    ) {
        alert("Access denied. Administrator permission required.");
        window.location.replace("./home.html");
        return;
    }

    // Load registered users
    async function loadUsers() {
        tbody.innerHTML = `
            <tr>
                <td colspan="6">Loading users...</td>
            </tr>
        `;

        const { data: users, error } = await db
            .from("profiles")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("User loading error:", error);

            tbody.innerHTML = `
                <tr>
                    <td colspan="6">Failed to load users: ${escapeHtml(error.message)}</td>
                </tr>
            `;
            return;
        }

        updateSummary(users);
        displayUsers(users);
    }

    function escapeHtml(value) {
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
    }

    function updateSummary(users) {
        document.querySelector("#totalUsers").textContent = users.length;

        document.querySelector("#activeUsers").textContent = users.filter(
            (user) => user.is_active,
        ).length;

        document.querySelector("#inactiveUsers").textContent = users.filter(
            (user) => !user.is_active,
        ).length;

        document.querySelector("#adminUsers").textContent = users.filter(
            (user) => user.role === "admin",
        ).length;
    }

    function displayUsers(users) {
        if (!users.length) {
            tbody.innerHTML = `
            <tr>
                <td colspan="6">No registered users found.</td>
            </tr>
        `;
            return;
        }

        const currentUserId = sessionData.session.user.id;

        tbody.innerHTML = users
            .map(
                (user) => `
        <tr>
            <td>${escapeHtml(user.email)}</td>

            <td>${escapeHtml(user.full_name || "—")}</td>

            <td>${escapeHtml(user.role)}</td>

            <td>
                ${user.is_active ? "Active" : "Inactive"}
            </td>

            <td>
                ${
                    user.created_at
                        ? new Date(user.created_at).toLocaleDateString()
                        : "—"
                }
            </td>

            <td class="user-actions">
                <button
                    type="button"
                    class="edit-user-btn"
                    data-user-id="${escapeHtml(user.id)}"
                >
                    Edit
                </button>

                ${
                    user.id !== currentUserId
                        ? `
    <button
        type="button"
        class="toggle-user-btn"
        data-user-id="${escapeHtml(user.id)}"
        data-active="${user.is_active}"
    >
        ${user.is_active ? "Deactivate" : "Activate"}
    </button>

    <button
        type="button"
        class="delete-user-btn"
        data-user-id="${escapeHtml(user.id)}"
    >
        Delete
    </button>
    `
                        : `<span>Current Account</span>`
                }
            </td>
        </tr>
    `,
            )
            .join("");
    }

    // Back to dashboard
    const backButton = document.querySelector("#backDashboardBtn");

    if (backButton) {
        backButton.addEventListener("click", () => {
            window.location.href = "./home.html";
        });
    }

    await loadUsers();

    // =========================================
    // ADD NEW USER FUNCTIONALITY
    // =========================================

    const addUserBtn = document.querySelector("#addUserBtn");
    const addUserModal = document.querySelector("#addUserModal");
    const closeAddUserModal = document.querySelector("#closeAddUserModal");
    const cancelAddUserBtn = document.querySelector("#cancelAddUserBtn");
    const addUserForm = document.querySelector("#addUserForm");
    const addUserMessage = document.querySelector("#addUserMessage");
    const saveNewUserBtn = document.querySelector("#saveNewUserBtn");

    // Open registration window
    addUserBtn.addEventListener("click", () => {
        addUserModal.style.display = "flex";
        addUserForm.reset();
        addUserMessage.textContent = "";
    });

    // Close registration window
    function closeAddUserWindow() {
        addUserModal.style.display = "none";
        addUserForm.reset();
        addUserMessage.textContent = "";
    }

    closeAddUserModal.addEventListener("click", closeAddUserWindow);
    cancelAddUserBtn.addEventListener("click", closeAddUserWindow);

    // Submit new account
    addUserForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const fullName = document.querySelector("#userFullName").value.trim();
        const email = document.querySelector("#userEmail").value.trim();
        const password = document.querySelector("#userPassword").value;
        const role = document.querySelector("#userRole").value;

        if (!fullName || !email || !password) {
            addUserMessage.style.color = "red";
            addUserMessage.textContent = "Please complete all fields.";
            return;
        }

        if (password.length < 6) {
            addUserMessage.style.color = "red";
            addUserMessage.textContent =
                "Password must contain at least 6 characters.";
            return;
        }

        saveNewUserBtn.disabled = true;
        saveNewUserBtn.textContent = "Creating...";

        addUserMessage.textContent = "";

        try {
            const { data, error } = await db.functions.invoke("create-user", {
                body: {
                    full_name: fullName,
                    email: email,
                    password: password,
                    role: role,
                },
            });

            if (error) {
                throw new Error(error.message || "Failed to create account.");
            }

            if (data?.error) {
                throw new Error(data.error);
            }

            addUserMessage.style.color = "green";
            addUserMessage.textContent = "User account created successfully!";

            addUserForm.reset();

            await loadUsers();

            setTimeout(() => {
                closeAddUserWindow();
            }, 1200);
        } catch (error) {
            console.error("Create user error:", error);

            addUserMessage.style.color = "red";
            addUserMessage.textContent = error.message;
        } finally {
            saveNewUserBtn.disabled = false;
            saveNewUserBtn.textContent = "Create Account";
        }
    });

    // =========================================
    // EDIT USER FUNCTIONALITY
    // =========================================

    const editUserModal = document.querySelector("#editUserModal");
    const editUserForm = document.querySelector("#editUserForm");
    const closeEditUserModal = document.querySelector("#closeEditUserModal");
    const cancelEditUserBtn = document.querySelector("#cancelEditUserBtn");
    const editUserMessage = document.querySelector("#editUserMessage");
    const saveEditUserBtn = document.querySelector("#saveEditUserBtn");

    const currentUserId = sessionData.session.user.id;

    // Open edit window
    tbody.addEventListener("click", async (event) => {
        const button = event.target.closest(".edit-user-btn");

        if (!button) return;

        const userId = button.dataset.userId;

        const { data: user, error } = await db
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .single();

        if (error || !user) {
            alert("Unable to retrieve user information.");
            return;
        }

        document.querySelector("#editUserId").value = user.id;
        document.querySelector("#editUserFullName").value =
            user.full_name || "";
        document.querySelector("#editUserEmail").value = user.email || "";
        document.querySelector("#editUserRole").value = user.role;

        // Prevent changing your own administrator role
        const roleField = document.querySelector("#editUserRole");
        roleField.disabled = user.id === currentUserId;

        editUserMessage.textContent = "";
        editUserModal.style.display = "flex";
    });

    // Close edit window
    function closeEditUserWindow() {
        editUserModal.style.display = "none";
        editUserForm.reset();
        editUserMessage.textContent = "";
        document.querySelector("#editUserRole").disabled = false;
    }

    closeEditUserModal.addEventListener("click", closeEditUserWindow);
    cancelEditUserBtn.addEventListener("click", closeEditUserWindow);

    // Save edited user
    editUserForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const userId = document.querySelector("#editUserId").value;
        const fullName = document
            .querySelector("#editUserFullName")
            .value.trim();
        const role = document.querySelector("#editUserRole").value;

        if (!fullName) {
            editUserMessage.style.color = "red";
            editUserMessage.textContent = "Full name is required.";
            return;
        }

        if (!["admin", "user"].includes(role)) {
            editUserMessage.style.color = "red";
            editUserMessage.textContent = "Invalid account role.";
            return;
        }

        saveEditUserBtn.disabled = true;
        saveEditUserBtn.textContent = "Saving...";

        try {
            const updateData = {
                full_name: fullName,
                updated_at: new Date().toISOString(),
            };

            // Do not change your own administrator role
            if (userId !== currentUserId) {
                updateData.role = role;
            }

            const { error } = await db
                .from("profiles")
                .update(updateData)
                .eq("id", userId);

            if (error) {
                throw error;
            }

            editUserMessage.style.color = "green";
            editUserMessage.textContent = "User updated successfully!";

            await loadUsers();

            setTimeout(() => {
                closeEditUserWindow();
            }, 1000);
        } catch (error) {
            console.error("Edit user error:", error);

            editUserMessage.style.color = "red";
            editUserMessage.textContent = error.message;
        } finally {
            saveEditUserBtn.disabled = false;
            saveEditUserBtn.textContent = "Save Changes";
        }
    });

    // =========================================
    // ACTIVATE / DEACTIVATE USER
    // =========================================

    tbody.addEventListener("click", async (event) => {
        const button = event.target.closest(".toggle-user-btn");

        if (!button) return;

        const userId = button.dataset.userId;
        const currentlyActive = button.dataset.active === "true";
        const newStatus = !currentlyActive;

        const action = newStatus ? "activate" : "deactivate";

        if (!confirm(`Are you sure you want to ${action} this account?`)) {
            return;
        }

        button.disabled = true;
        button.textContent = "Updating...";

        const { error } = await db
            .from("profiles")
            .update({
                is_active: newStatus,
                updated_at: new Date().toISOString(),
            })
            .eq("id", userId);

        if (error) {
            console.error("Account status error:", error);
            alert("Failed to update account: " + error.message);
            await loadUsers();
            return;
        }

        await loadUsers();

        alert(
            `Account successfully ${newStatus ? "activated" : "deactivated"}.`,
        );
    });

    // =========================================
    // DELETE USER FUNCTIONALITY
    // =========================================

    tbody.addEventListener("click", async (event) => {
        const button = event.target.closest(".delete-user-btn");

        if (!button) return;

        const userId = button.dataset.userId;

        if (userId === currentUserId) {
            alert("You cannot delete your own account.");
            return;
        }

        const confirmed = confirm(
            "WARNING!\n\n" +
                "Are you sure you want to permanently delete this user account?\n\n" +
                "This action cannot be undone.",
        );

        if (!confirmed) return;

        button.disabled = true;
        button.textContent = "Deleting...";

        try {
            const { data, error } = await db.functions.invoke("delete-user", {
                body: {
                    user_id: userId,
                },
            });

            if (error) {
                throw new Error(error.message || "Failed to delete user.");
            }

            if (data?.error) {
                throw new Error(data.error);
            }

            alert("User account deleted successfully!");

            await loadUsers();
        } catch (error) {
            console.error("Delete user error:", error);

            alert("Failed to delete user: " + error.message);

            await loadUsers();
        }
    });
});
