<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>User Management - Territory System</title>

    <link rel="stylesheet" href="{{ asset('css/territory.css') }}">
    <link rel="stylesheet" href="{{ asset('css/users.css') }}">
</head>

<body>

    <div class="territory-container">

        <div class="page-header">
            <div>
                <div class="header-label">ADMINISTRATION</div>
                <h1>User Management</h1>
                <p>Manage system accounts and access permissions.</p>
            </div>

            <div class="header-actions">
                <button type="button" id="backDashboardBtn">
                    ← Dashboard
                </button>
            </div>
        </div>

        <div class="summary-cards">
            <div class="summary-card">
                <h3>Total Users</h3>
                <div id="totalUsers">0</div>
            </div>

            <div class="summary-card">
                <h3>Active Users</h3>
                <div id="activeUsers">0</div>
            </div>

            <div class="summary-card">
                <h3>Inactive Users</h3>
                <div id="inactiveUsers">0</div>
            </div>

            <div class="summary-card">
                <h3>Administrators</h3>
                <div id="adminUsers">0</div>
            </div>
        </div>

        <div class="territory-card">

            <div class="users-toolbar">
                <h2>Registered Accounts</h2>

                <button type="button" id="addUserBtn">
                    + Add New User
                </button>
            </div>

            <div class="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th>Email</th>
                            <th>Full Name</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>Date Created</th>
                            <th>Actions</th>
                        </tr>
                    </thead>

                    <tbody id="usersTableBody">
                        <tr>
                            <td colspan="6">Loading users...</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

    </div>

    <!-- Add New User Window -->
    <div id="addUserModal" class="password-modal" style="display: none;">

        <div class="password-window">

            <div class="password-titlebar">
                <span>Create New User Account</span>
                <button type="button" id="closeAddUserModal">X</button>
            </div>

            <form id="addUserForm">

                <div class="password-content">

                    <p>Enter the new user's account information.</p>

                    <label for="userFullName">Full Name:</label>
                    <input type="text" id="userFullName" required maxlength="150">

                    <label for="userEmail">Email Address:</label>
                    <input type="email" id="userEmail" required>

                    <label for="userPassword">Temporary Password:</label>
                    <input type="password" id="userPassword" minlength="6" required autocomplete="new-password">

                    <label for="userRole">Account Role:</label>
                    <select id="userRole" required>
                        <option value="user">Regular User</option>
                        <option value="admin">Administrator</option>
                    </select>

                    <div id="addUserMessage"></div>

                </div>

                <div class="password-footer">
                    <button type="submit" id="saveNewUserBtn">Create Account</button>
                    <button type="button" id="cancelAddUserBtn">Cancel</button>
                </div>

            </form>

        </div>

    </div>

    <!-- Edit User Window -->
    <div id="editUserModal" class="password-modal" style="display: none;">

        <div class="password-window">

            <div class="password-titlebar">
                <span>Edit User Account</span>
                <button type="button" id="closeEditUserModal">X</button>
            </div>

            <form id="editUserForm">

                <div class="password-content">

                    <input type="hidden" id="editUserId">

                    <label for="editUserFullName">Full Name:</label>
                    <input type="text" id="editUserFullName" maxlength="150" required>

                    <label for="editUserEmail">Email Address:</label>
                    <input type="email" id="editUserEmail" disabled>

                    <label for="editUserRole">Account Role:</label>
                    <select id="editUserRole" required>
                        <option value="user">Regular User</option>
                        <option value="admin">Administrator</option>
                    </select>

                    <div id="editUserMessage"></div>

                </div>

                <div class="password-footer">
                    <button type="submit" id="saveEditUserBtn">Save Changes</button>
                    <button type="button" id="cancelEditUserBtn">Cancel</button>
                </div>

            </form>

        </div>

    </div>

    <!-- Supabase -->
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2" defer></script>

    <!-- Supabase Configuration -->
    <script src="{{ asset('js/supabase.js') }}" defer></script>

    <!-- User Management -->
    <script src="{{ asset('js/users.js') }}" defer></script>

</body>

</html>
