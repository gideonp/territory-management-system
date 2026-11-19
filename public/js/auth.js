
document.addEventListener("DOMContentLoaded", async () => {
    const form = document.querySelector("#loginForm");
    const button = document.querySelector("#loginBtn");
    const message = document.querySelector("#loginMessage");

    if (!window.supabaseClient) {
        message.textContent = "Supabase connection is unavailable.";
        return;
    }

    // Redirect already logged-in users.
    const { data: sessionData } =
        await window.supabaseClient.auth.getSession();

    if (sessionData.session) {
        window.location.href = "/home";
        return;
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        button.disabled = true;
        button.textContent = "Signing in...";
        message.textContent = "";

        const email = document.querySelector("#email").value.trim();
        const password = document.querySelector("#password").value;

        const { error } =
            await window.supabaseClient.auth.signInWithPassword({
                email,
                password
            });

        if (error) {
            message.textContent = error.message;
            button.disabled = false;
            button.textContent = "Sign In";
            return;
        }

        window.location.href = "/home";
    });
});
