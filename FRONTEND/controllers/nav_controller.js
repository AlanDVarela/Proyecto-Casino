// controllers/nav_controller.js

// Actualiza la barra de navegación según sesión
function update() {
    const userStr = sessionStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;

    const loginBtn = document.getElementById("loginBtn");
    const userDropdown = document.getElementById("userDropdownContainer");
    const userDropdownName = document.getElementById("userDropdown");
    const totalCredits = document.getElementById("totalCredits");

    if (!loginBtn || !userDropdown || !userDropdownName || !totalCredits) return;

    if (!user) {
        loginBtn.style.display = "block";
        userDropdown.style.display = "none";
        totalCredits.textContent = "$1000";
    } else {
        loginBtn.style.display = "none";
        userDropdown.style.display = "block";
        userDropdownName.textContent = user.name;
        totalCredits.textContent = `$${user.balance}`;
    }
}

// Cerrar sesión
function logout() {
    sessionStorage.clear();
    update();
    location.reload();
}

// Alternar formularios de login/registro
function toggleForms(showRegister = false) {
    const loginForm = document.getElementById("formLogin");
    const registerForm = document.getElementById("formRegister");

    if (showRegister) {
        loginForm.style.display = "none";
        registerForm.style.display = "block";
    } else {
        loginForm.style.display = "block";
        registerForm.style.display = "none";
    }
}

// Login
document.getElementById("formLogin").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value.trim();

    const res = await fetch("/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    });

    if (!res.ok) {
        alert("Email o contraseña incorrectos");
        return;
    }

    const user = await res.json();
    sessionStorage.setItem("user", JSON.stringify(user));
    bootstrap.Modal.getInstance(document.getElementById("loginRegisterModal")).hide();
    update();
    location.reload();
});

// Register
document.getElementById("formRegister").addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("registerName").value.trim();
    const email = document.getElementById("registerEmail").value.trim();
    const password = document.getElementById("registerPassword").value.trim();
    const confirmPassword = document.getElementById("registerConfirmPassword").value.trim();

    if (!name || !email || !password || !confirmPassword) {
        alert("Todos los campos son obligatorios");
        return;
    }
    if (password.length < 8) {
        alert("La contraseña debe tener al menos 8 caracteres");
        return;
    }
    if (password !== confirmPassword) {
        alert("Las contraseñas no coinciden");
        return;
    }

    const res = await fetch("/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password })
    });

    if (!res.ok) {
        alert(await res.text());
        return;
    }

    const user = await res.json();
    sessionStorage.setItem("user", JSON.stringify(user));
    bootstrap.Modal.getInstance(document.getElementById("loginRegisterModal")).hide();
    update();
    location.reload();
});

// Cuando el DOM está listo
document.addEventListener("DOMContentLoaded", () => {
    update();

    // Perfil de usuario: al abrir modal
    const profileModalEl = document.getElementById('profileModal');
    if (profileModalEl) {
        profileModalEl.addEventListener('show.bs.modal', () => {
            const user = JSON.parse(sessionStorage.getItem("user"));
            document.getElementById('profileUsername').textContent = user?.name || 'Invitado';
            document.getElementById('profileBalance').textContent = user ? `$${user.balance}` : "$0";
        });
    }

    // Añadir créditos
    const addCreditsBtn = document.getElementById('addCreditsBtn');
    if (addCreditsBtn) {
        addCreditsBtn.addEventListener('click', () => {
            const creditsToAdd = parseInt(document.getElementById('addCredits').value, 10);
            if (isNaN(creditsToAdd) || creditsToAdd <= 0) {
                alert("Ingresa un valor válido");
                return;
            }
            const user = JSON.parse(sessionStorage.getItem("user"));
            if (!user?._id) {
                alert("Usuario no válido. Inicia sesión de nuevo.");
                return;
            }
            const newBalance = user.balance + creditsToAdd;
            fetch(`/users/${user._id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth': user.password
                },
                body: JSON.stringify({ balance: newBalance })
            })
            .then(async res => {
                if (!res.ok) throw new Error(await res.text());
                return res.json();
            })
            .then(updatedUser => {
                sessionStorage.setItem("user", JSON.stringify(updatedUser));
                document.getElementById('profileBalance').textContent = `$${updatedUser.balance}`;
                document.getElementById('totalCredits').textContent = `$${updatedUser.balance}`;
                document.getElementById('addCredits').value = "";
                alert("Créditos añadidos correctamente!");
            })
            .catch(err => {
                console.error(err);
                alert("Error al añadir créditos");
            });
        });
    }

    // Configuración de usuario: al abrir modal
    const settingsModalEl = document.getElementById('settingsModal');
    const settingsModal = settingsModalEl ? bootstrap.Modal.getOrCreateInstance(settingsModalEl) : null;
    if (settingsModalEl) {
        settingsModalEl.addEventListener('show.bs.modal', () => {
            const user = JSON.parse(sessionStorage.getItem("user"));
            document.getElementById('newUsername').placeholder = user?.name || '';
            document.getElementById('newPassword').placeholder = "********";
            document.getElementById('settingsConfirmPassword').placeholder = "********";
        });
    }

    // Guardar configuración
    const saveSettingsBtn = document.getElementById("saveSettingsBtn");
    if (saveSettingsBtn && settingsModal) {
        saveSettingsBtn.addEventListener("click", () => {
            const user = JSON.parse(sessionStorage.getItem("user"));
            const newName = document.getElementById("newUsername").value.trim();
            const newPassword = document.getElementById("newPassword").value.trim();
            const confirmPassword = document.getElementById("settingsConfirmPassword").value.trim();
            if (newPassword && newPassword !== confirmPassword) {
                alert("Las contraseñas no coinciden");
                return;
            }
            const updates = {};
            if (newName) updates.name = newName;
            if (newPassword) updates.password = newPassword;
            if (!Object.keys(updates).length) {
                alert("No se realizaron cambios.");
                return;
            }
            fetch(`/users/${user._id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth': user.password
                },
                body: JSON.stringify(updates)
            })
            .then(res => {
                if (!res.ok) throw new Error("Error al actualizar");
                return res.json();
            })
            .then(updatedUser => {
                sessionStorage.setItem("user", JSON.stringify(updatedUser));
                settingsModal.hide();
                update();
                alert("Datos actualizados");
            })
            .catch(err => {
                console.error(err);
                alert("Error al actualizar");
            });
        });
    }
});
