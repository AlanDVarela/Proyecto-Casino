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

function showLogoutConfirm() {
    const modal = new bootstrap.Modal(document.getElementById('logoutModal'));
    modal.show();

    const confirmButton = document.getElementById("confirmLogoutBtn");

    confirmButton.replaceWith(confirmButton.cloneNode(true));
    const newConfirmButton = document.getElementById("confirmLogoutBtn");

    newConfirmButton.addEventListener("click", () => {
        modal.hide();
        logout();  
    });
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

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert("Ingresa un correo electrónico válido");
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
        document.getElementById('profileBalance').textContent = user ? `${formatMoney(user.balance)}` : "$0";
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
                
                    document.getElementById('profileBalance').textContent = formatMoney(data.balance);
                    document.getElementById('totalCredits').textContent = formatMoney(data.balance);
                    document.getElementById('addCredits').value = "";
                    document.dispatchEvent(new CustomEvent('balanceUpdated', { detail: { balance: newBalance } }));
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
        const user = getUser();
        if (!user) return;

        fetch(`/users/${user._id}`, {
            method: "GET",
            headers: {
                'x-auth': user.password
            }
        })
        .then(res => {
            if (!res.ok) throw new Error("Error al obtener datos del usuario.");
            return res.json();
        })
        .then(serverUser => {
            // Limpiar valores anteriores (esto es lo que hace que no se quede lo que se había escrito antes)
            document.getElementById('newUsername').value = '';
            document.getElementById('newEmail').value = '';
            document.getElementById('newPassword').value = '';
            document.getElementById('settingsConfirmPassword').value = '';

            // Establecer placeholders
            document.getElementById('newUsername').placeholder = serverUser.name;
            document.getElementById('newEmail').placeholder = serverUser.email;
            document.getElementById('newPassword').placeholder = "********";
            document.getElementById('settingsConfirmPassword').placeholder = "********";
        })
        .catch(err => {
            console.error("Error al cargar el perfil:", err);
            alert("No se pudieron cargar los datos del perfil.");
        });
    });
    }

    const saveSettingsBtn = document.getElementById("saveSettingsBtn");
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener("click", async () => {
            const user = JSON.parse(sessionStorage.getItem("user"));
            const newName = document.getElementById("newUsername").value.trim();
            const newEmail = document.getElementById("newEmail").value.trim();
            const newPassword = document.getElementById("newPassword").value.trim();
            const confirmPassword = document.getElementById("settingsConfirmPassword").value.trim();

            // Validar email (formato)
            if (newEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
                alert("El correo no es válido.");
                return;
            }

            // Validar contraseña (longitud y coincidencia)
            if (newPassword) {
                if (newPassword.length < 8) {
                    alert("La contraseña debe tener al menos 8 caracteres.");
                    return;
                }
                if (newPassword !== confirmPassword) {
                    alert("Las contraseñas no coinciden.");
                    return;
                }
            }

            // Validar si el correo ya existe (solo si se ingresó uno nuevo diferente al actual)
            if (newEmail && newEmail !== user.email) {
                const emailCheck = await fetch(`/users?email=${encodeURIComponent(newEmail)}`, {
                    headers: { 'x-auth': "admin_auth" }  // solo admin puede acceder (o deberías hacer un endpoint específico para validación)
                });

                if (emailCheck.ok) {
                    const users = await emailCheck.json();
                    const exists = users.some(u => u.email === newEmail);

                    if (exists) {
                        alert("Este correo ya está registrado.");
                        return;
                    }
                }
            }

            const updates = {};
            if (newName) updates.name = newName;
            if (newEmail) updates.email = newEmail;
            if (newPassword) updates.password = newPassword;

            if (Object.keys(updates).length === 0) {
                alert("No se realizaron cambios.");
                return;
            }

            const confirmChange = confirm("¿Estás seguro de que quieres guardar estos cambios en tu perfil?");
            if (!confirmChange) return;

            fetch(`/users/${user._id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth': user.password
                },
                body: JSON.stringify(updates)
            })
            .then(res => {
                if (!res.ok) throw new Error("Error al actualizar los datos.");
                return res.json();
            })
            .then(updatedUser => {
                sessionStorage.setItem("user", JSON.stringify(updatedUser));
                alert("Datos actualizados correctamente.");
                update();
            })
            .catch(err => {
                console.error(err);
                alert("Error al actualizar los datos.");
            });
            const modal = bootstrap.Modal.getInstance(settingsModal);
            modal.hide();       
        });
    }
});


const deleteProfileBtn = document.getElementById("deleteProfileBtn");
if (deleteProfileBtn) {
    deleteProfileBtn.addEventListener("click", () => {
        const user = getUser();
        if (!user) return;

        // Pedir confirmación
        const confirmDelete = confirm("¿Estás seguro que quieres eliminar tu perfil? Esta acción es irreversible.");
        if (!confirmDelete) return;

        // Pedir contraseña para confirmar
        const password = prompt("Ingresa tu contraseña para confirmar:");

        if (!password) {
            alert("Debes ingresar la contraseña para eliminar tu perfil.");
            return;
        }

        if (password !== user.password) {
            alert("Contraseña incorrecta. No se pudo eliminar el perfil.");
            return;
        }

        // Enviar solicitud de eliminación
        fetch(`/users/${user._id}`, {
            method: "DELETE",
            headers: {
                "x-auth": user.password
            }
        })
        .then(res => {
            if (!res.ok) throw new Error("Error al eliminar el perfil.");
            return res.json();
        })
        .then(() => {
            alert("Perfil eliminado correctamente.");
            sessionStorage.removeItem("user");
            window.location.reload(); // O redireccionar a login o home
        })
        .catch(err => {
            console.error(err);
            alert("Ocurrió un error al eliminar tu perfil.");
        });
    });
}

























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





//Funcion user
function getUser() {
    const userStr = sessionStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
}