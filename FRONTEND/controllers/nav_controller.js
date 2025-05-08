// Declaración GLOBAL
function initGuestBalance() {
    if (!localStorage.getItem("guestBalance")) {
        localStorage.setItem("guestBalance", "1000");
    }
    return parseInt(localStorage.getItem("guestBalance"));
}

let guestStorage = initGuestBalance();


function getCurrentBalance() {
    const userStr = sessionStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;

    if (user) return user.balance;

    return guestStorage;
}

function clearGuestBalance() {
    localStorage.removeItem("guestBalance");
    guestStorage = 0;
}

function update() {
    const userStr = sessionStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;

    const loginBtn = document.getElementById("loginBtn");
    const userDropdown = document.getElementById("userDropdownContainer");
    const userDropdownName = document.getElementById("userDropdown");
    const totalCredits = document.getElementById("totalCredits");

    if (!loginBtn || !userDropdown || !userDropdownName || !totalCredits) return;

    const balanceFormatted = getCurrentBalance().toLocaleString('es-MX', { 
        style: 'currency', 
        currency: 'MXN', 
        minimumFractionDigits: 0 
    });

    if (!user) {
        loginBtn.style.display = "block";
        userDropdown.style.display = "none";
        totalCredits.textContent = balanceFormatted;
    } else {
        loginBtn.style.display = "none";
        userDropdown.style.display = "block";
        userDropdownName.textContent = user.name;
        totalCredits.textContent = balanceFormatted;
    }
}
//Logout
function logout() {
    sessionStorage.clear();
    clearGuestBalance();
    update();
    location.reload();
}

//Funcino de modales de login y registrar
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
    if (user) {
        sessionStorage.setItem("user", JSON.stringify(user));
        clearGuestBalance();
    } else {
        sessionStorage.removeItem("user");
    }
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
    localStorage.removeItem("guestBalance"); //Borrar balance guest
    bootstrap.Modal.getInstance(document.getElementById("loginRegisterModal")).hide();
    update();
    location.reload();
});

document.addEventListener("DOMContentLoaded", () => {

    //Modal de perfil
    const profileModal = document.getElementById('profileModal');
    if (profileModal) {
      profileModal.addEventListener('show.bs.modal', () => {
        const user = JSON.parse(sessionStorage.getItem("user"));
        document.getElementById('profileUsername').textContent = user?.name || 'Invitado';
        document.getElementById('profileBalance').textContent = user ? `$${user.balance}` : "$0";
      });
    }


    //Anadir balance
    const addCreditsBtn = document.getElementById('addCreditsBtn');
        if (addCreditsBtn) {
            addCreditsBtn.addEventListener('click', () => {
                const creditsToAdd = parseInt(document.getElementById('addCredits').value);
                if (isNaN(creditsToAdd) || creditsToAdd <= 0) {
                    alert("Ingresa un valor válido");
                    return;
                }

                const user = JSON.parse(sessionStorage.getItem("user"));

                if (!user || !user._id) {
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
                    if (!res.ok) {
                        const errText = await res.text();
                        throw new Error(errText);
                    }
                
                    return res.json();
                })
                .then(data => {
                    // Actualizar sessionStorage con el nuevo balance
                    if (data) {
                        sessionStorage.setItem("user", JSON.stringify(data));
                    }

                    document.getElementById('profileBalance').textContent = `$${data.balance}`;
                    document.getElementById('totalCredits').textContent = `$${data.balance}`;
                    document.getElementById('addCredits').value = "";
                    alert("Créditos añadidos correctamente!");
                })
                .catch(err => {
                    console.error(err);
                    alert("Error al añadir créditos");
                });
            });
        }

    //Modal configuracion
    const settingsModal = document.getElementById('settingsModal');
    if (settingsModal) {
      settingsModal.addEventListener('show.bs.modal', () => {
        const user = JSON.parse(sessionStorage.getItem("user"));

        document.getElementById('newUsername').placeholder = user?.name || '';
        document.getElementById('newPassword').placeholder = "********";
        document.getElementById('settingsConfirmPassword').placeholder = "********";
      });
    }

    const saveSettingsBtn = document.getElementById("saveSettingsBtn");
    if (saveSettingsBtn) {
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

            if (Object.keys(updates).length === 0) {
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
            .then(res => res.json())
            .then(updatedUser => {
                sessionStorage.setItem("user", JSON.stringify(updatedUser));
                alert("Datos actualizados");
                update();
            })
            .catch(err => {
                console.error(err);
                alert("Error al actualizar");
            });
        });
    }
});

// Inicializar al cargar
document.addEventListener("DOMContentLoaded", () => {
    update();
});



function formatMoney(value) {
    return value.toLocaleString('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 0
    });
}