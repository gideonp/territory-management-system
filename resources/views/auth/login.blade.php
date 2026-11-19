
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Territory Management | Login</title>

    <link href="/css/tailwind.css" rel="stylesheet">
    <link href="/css/territory.css" rel="stylesheet">

    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <script src="/js/supabase.js"></script>
    <script src="/js/auth.js" defer></script>
</head>
<body class="bg-slate-50 min-h-screen">

    <div class="login-container">
        <div class="login-card">
            <div class="login-icon">🗺️</div>

            <h1>Territory Management</h1>
            <p>Sign in to access your territory records.</p>

            <form id="loginForm">
                <div class="form-group">
                    <label for="email">Email Address</label>
                    <input
                        type="email"
                        id="email"
                        placeholder="Enter your email"
                        required
                    >
                </div>

                <div class="form-group">
                    <label for="password">Password</label>
                    <input
                        type="password"
                        id="password"
                        placeholder="Enter your password"
                        required
                    >
                </div>

                <button type="submit" id="loginBtn" class="filter-button">
                    Sign In
                </button>

                <p id="loginMessage" role="alert"></p>
            </form>

            <div class="login-footer">
                Territory Management System
            </div>
        </div>
    </div>

</body>
</html>
