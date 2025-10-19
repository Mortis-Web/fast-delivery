// ✅ Handle header style when scrolling
function handleScroll() {
  const header = document.querySelector(".header");
  if (window.scrollY > 50) header.classList.add("scrolled");
  else header.classList.remove("scrolled");
}

// ✅ Update login button behavior
function updateLoginBtnBehavior() {
  const storedUser = localStorage.getItem("fastDeliveryUser");
  const loginBtn = document.getElementById("login-modal-btn");

  // ✅ Stop if button not found
  if (!loginBtn) return;

  // ✅ Safely clone and replace button (remove old listeners)
  const clone = loginBtn.cloneNode(true);
  loginBtn.parentNode.replaceChild(clone, loginBtn);
  const btn = document.getElementById("login-modal-btn");
  const userDropDown = document.getElementById("userDropDown");

  if (storedUser) {
    const userData = JSON.parse(storedUser);
    console.log(`👋 Welcome back, ${userData.firstName}!`);

    btn.addEventListener("click", () => {
      if (userDropDown) userDropDown.classList.toggle("showDropDown");
    });

    if (userDropDown) userDropDown.style.display = "flex";
  } else {
    btn.addEventListener("click", openModal);
    if (userDropDown) userDropDown.style.display = "none";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  handleScroll();
  window.addEventListener("scroll", handleScroll);

  const loginBtn = document.getElementById("login-modal-btn");
  const loginLink = document.getElementById("loginPage-modal-btn");
  const closeModalBtn = document.getElementById("close-modal-btn");
  const modalOverlay = document.getElementById("login-modal-overlay");
  const userDropDown = document.getElementById("userDropDown");

  // ✅ Modal open/close functions
  window.openModal = function () {
    modalOverlay.classList.add("is-visible");
    document.body.style.overflow = "hidden";
  };

  function closeModal() {
    modalOverlay.classList.remove("is-visible");
    document.body.style.overflow = "";
  }

  if (loginLink) loginLink.addEventListener("click", openModal);
  if (closeModalBtn) closeModalBtn.addEventListener("click", closeModal);

  if (modalOverlay) {
    modalOverlay.addEventListener("click", (e) => {
      if (e.target === modalOverlay) closeModal();
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modalOverlay?.classList.contains("is-visible"))
      closeModal();
  });

  // ✅ Show/hide password
  document.querySelectorAll(".showPassword").forEach((toggle) => {
    toggle.addEventListener("click", () => {
      const wrapper = toggle.closest(".password-input-wrapper");
      const input = wrapper?.querySelector(".password-input");
      if (!input) return;

      const isPassword = input.type === "password";
      input.type = isPassword ? "text" : "password";
      toggle.textContent = isPassword ? "Hide" : "Show";
    });
  });

  // ✅ Validate registration form
  const form = document.querySelector('form[data-testid="form-login"]');
  if (!form) return;

  const firstNameInput = document.getElementById("firstName-input");
  const lastNameInput = document.getElementById("lastName-input");
  const emailInputLoginPage = document.getElementById("emailLoginPage-input");
  const passwordInputLoginPage = document.getElementById(
    "password-input-field-loginPage"
  );

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const setInvalid = (input, message) => {
    input.classList.add("invalid");
    input.setCustomValidity(message);
  };

  const clearInvalid = (input) => {
    input.classList.remove("invalid");
    input.setCustomValidity("");
  };

  const validateInputs = () => {
    let isValid = true;
    let message = "";

    if (!firstNameInput.value.trim()) {
      setInvalid(firstNameInput, "Please enter your first name");
      message = "Please enter your first name";
      isValid = false;
    } else clearInvalid(firstNameInput);

    if (isValid && !lastNameInput.value.trim()) {
      setInvalid(lastNameInput, "Please enter your last name");
      message = "Please enter your last name";
      isValid = false;
    } else clearInvalid(lastNameInput);

    if (isValid && !emailInputLoginPage.value.trim()) {
      setInvalid(emailInputLoginPage, "Please enter your email");
      message = "Please enter your email";
      isValid = false;
    } else if (isValid && !isValidEmail(emailInputLoginPage.value.trim())) {
      setInvalid(emailInputLoginPage, "Invalid email format");
      message = "Invalid email format";
      isValid = false;
    } else clearInvalid(emailInputLoginPage);

    if (isValid && !passwordInputLoginPage.value.trim()) {
      setInvalid(passwordInputLoginPage, "Please enter your password");
      message = "Please enter your password";
      isValid = false;
    } else if (isValid && passwordInputLoginPage.value.trim().length < 6) {
      setInvalid(
        passwordInputLoginPage,
        "Password must be at least 6 characters"
      );
      message = "Password must be at least 6 characters";
      isValid = false;
    } else clearInvalid(passwordInputLoginPage);

    if (!isValid && message) {
      Swal.fire({
        icon: "error",
        title: "⚠️ Input Error",
        text: message,
        confirmButtonText: "OK",
        confirmButtonColor: "#d33",
      });
    }

    return isValid;
  };

  // ✅ On form submit (register user)
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!validateInputs()) return;

    const user = {
      firstName: firstNameInput.value.trim(),
      lastName: lastNameInput.value.trim(),
      email: emailInputLoginPage.value.trim(),
      password: passwordInputLoginPage.value.trim(),
    };

    localStorage.setItem("fastDeliveryUser", JSON.stringify(user));

    Swal.fire({
      icon: "success",
      title: "🎉 Registration Successful",
      text: `Welcome, ${user.firstName}!`,
      confirmButtonText: "Continue",
      confirmButtonColor: "#3085d6",
    }).then(() => {
      form.reset();
      closeModal();
      updateLoginBtnBehavior();
      window.location.href = "html_web.html";
    });
  });

  // ✅ Close dropdown when clicking outside
  document.addEventListener("click", (e) => {
    if (
      userDropDown &&
      userDropDown.classList.contains("showDropDown") &&
      !userDropDown.contains(e.target) &&
      e.target.id !== "login-modal-btn"
    ) {
      userDropDown.classList.remove("showDropDown");
    }
  });

  // ✅ Logout button
  const logOut = document.getElementById("logOut");
  if (logOut) {
    logOut.addEventListener("click", () => {
      Swal.fire({
        icon: "question",
        title: "Are you sure you want to log out?",
        showCancelButton: true,
        confirmButtonText: "Yes, Log Out",
        cancelButtonText: "Cancel",
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
      }).then((result) => {
        if (result.isConfirmed) {
          localStorage.removeItem("fastDeliveryUser");
          userDropDown.classList.remove("showDropDown");
          Swal.fire({
            icon: "success",
            title: "Logged out successfully ✅",
            confirmButtonText: "OK",
          }).then(() => {
            window.location.reload();
          });
        }
      });
    });
  }

  // ✅ Run when page loads
  updateLoginBtnBehavior();
});
