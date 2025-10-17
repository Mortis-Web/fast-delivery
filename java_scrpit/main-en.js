// ✅ Handle header state on scroll
function handleScroll() {
  const header = document.querySelector(".header");
  if (window.scrollY > 50) {
    header.classList.add("scrolled");
  } else {
    header.classList.remove("scrolled");
  }
}

// ✅ Update Arabic button links
function updateLinkIcons() {
  const partnerLink = document.querySelector('[data-key="partner_link"]');
  const deliveryLink = document.querySelector('[data-key="delivery_link"]');
  const icon = `<i class="fa fa-chevron-left"></i>`;

  if (partnerLink) partnerLink.innerHTML = `Learn More ${icon}`;
  if (deliveryLink) deliveryLink.innerHTML = `Sign Up Now ${icon}`;
}

document.addEventListener("DOMContentLoaded", () => {
  handleScroll();
  updateLinkIcons();
  window.addEventListener("scroll", handleScroll);

  const loginBtn = document.getElementById("login-modal-btn");
  const loginLink = document.getElementById("loginPage-modal-btn");
  const closeModalBtn = document.getElementById("close-modal-btn");
  const modalOverlay = document.getElementById("login-modal-overlay");
  const userDropDown = document.getElementById("userDropDown");

  // ✅ Modal open/close functions
  const openModal = () => {
    modalOverlay.classList.add("is-visible");
    document.body.style.overflow = "hidden";
  };

  const closeModal = () => {
    modalOverlay.classList.remove("is-visible");
    document.body.style.overflow = "";
  };

  if (loginLink) loginLink.addEventListener("click", openModal);
  if (closeModalBtn) closeModalBtn.addEventListener("click", closeModal);

  if (modalOverlay) {
    modalOverlay.addEventListener("click", (e) => {
      if (e.target === modalOverlay) closeModal();
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modalOverlay?.classList.contains("is-visible")) {
      closeModal();
    }
  });

  // ✅ Show or hide password
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
      setInvalid(emailInputLoginPage, "Invalid email address");
      message = "Invalid email address";
      isValid = false;
    } else clearInvalid(emailInputLoginPage);

    if (isValid && !passwordInputLoginPage.value.trim()) {
      setInvalid(passwordInputLoginPage, "Please enter your password");
      message = "Please enter your password";
      isValid = false;
    } else if (isValid && passwordInputLoginPage.value.trim().length < 6) {
      setInvalid(
        passwordInputLoginPage,
        "Password must be at least 6 characters long"
      );
      message = "Password must be at least 6 characters long";
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

  // ✅ Handle form submit (register user)
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
      if (userDropDown) userDropDown.classList.add("showDropDown");
      updateLoginBtnBehavior(); // ✅ Update login button behavior
      window.location.href = "main_en.html";
    });
  });

  // ✅ Update login button behavior based on user state
  function updateLoginBtnBehavior() {
    const storedUser = localStorage.getItem("fastDeliveryUser");
    if (!loginBtn) return;

    loginBtn.replaceWith(loginBtn.cloneNode(true)); // Remove old listeners
    const newLoginBtn = document.getElementById("login-modal-btn");

    if (storedUser) {
      // ✅ User is logged in
      const userData = JSON.parse(storedUser);
      console.log(`👋 Welcome back, ${userData.firstName}`);

      newLoginBtn.addEventListener("click", () => {
        if (userDropDown) userDropDown.classList.toggle("showDropDown");
      });

      if (userDropDown) userDropDown.style.display = "flex";
    } else {
      // ❌ User is not logged in
      newLoginBtn.addEventListener("click", openModal);
      if (userDropDown) userDropDown.style.display = "none";
    }
  }

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

  const logOut = document.getElementById("logOut");

  // ✅ Logout button
  if (logOut) {
    logOut.addEventListener("click", () => {
      Swal.fire({
        icon: "question",
        title: "Are you sure you want to log out?",
        showCancelButton: true,
        confirmButtonText: "Yes, log out",
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
            updateLoginBtnBehavior(); // Refresh behavior
            window.location.reload();
          });
        }
      });
    });
  }

  // ✅ Call on page load
  updateLoginBtnBehavior();
});
