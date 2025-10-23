// ✅ التعامل مع تغيير حالة الهيدر عند التمرير
function handleScroll() {
  const header = document.querySelector(".header");
  if (window.scrollY > 50) header.classList.add("scrolled");
  else header.classList.remove("scrolled");
}

// ✅ تحديث روابط الأزرار بالعربية
function updateLoginBtnBehavior() {
  const storedUser = localStorage.getItem("fastDeliveryUser");
  const loginBtn = document.getElementById("login-modal-btn");

  // ✅ stop if button not found
  if (!loginBtn) return;

  // ✅ safely clone and replace button
  const clone = loginBtn.cloneNode(true);
  loginBtn.parentNode.replaceChild(clone, loginBtn);

  const newLoginBtn = document.getElementById("login-modal-btn"); // ✅ get the new element
  const userDropDown = document.getElementById("userDropDown");

  if (storedUser) {
    const userData = JSON.parse(storedUser);
    console.log(`👋 مرحبًا بعودتك يا ${userData.firstName}`);

    // ✅ apply on new element, not old (deleted one!)
    newLoginBtn.addEventListener("click", () => {
      if (userDropDown) userDropDown.classList.toggle("showDropDown");
    });

    if (userDropDown) userDropDown.style.display = "flex";
  } else {
    newLoginBtn.addEventListener("click", openModal);
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

  // ✅ دوال فتح وإغلاق المودال
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

  // ✅ إظهار أو إخفاء كلمة المرور
  document.querySelectorAll(".showPassword").forEach((toggle) => {
    toggle.addEventListener("click", () => {
      const wrapper = toggle.closest(".password-input-wrapper");
      const input = wrapper?.querySelector(".password-input");
      if (!input) return;

      const isPassword = input.type === "password";
      input.type = isPassword ? "text" : "password";
      toggle.textContent = isPassword ? "إخفاء" : "إظهار";
    });
  });

  // ✅ التحقق من صحة بيانات التسجيل
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
      setInvalid(firstNameInput, "من فضلك أدخل الاسم الأول");
      message = "من فضلك أدخل الاسم الأول";
      isValid = false;
    } else clearInvalid(firstNameInput);

    if (isValid && !lastNameInput.value.trim()) {
      setInvalid(lastNameInput, "من فضلك أدخل اسم العائلة");
      message = "من فضلك أدخل اسم العائلة";
      isValid = false;
    } else clearInvalid(lastNameInput);

    if (isValid && !emailInputLoginPage.value.trim()) {
      setInvalid(emailInputLoginPage, "من فضلك أدخل البريد الإلكتروني");
      message = "من فضلك أدخل البريد الإلكتروني";
      isValid = false;
    } else if (isValid && !isValidEmail(emailInputLoginPage.value.trim())) {
      setInvalid(emailInputLoginPage, "البريد الإلكتروني غير صالح");
      message = "البريد الإلكتروني غير صالح";
      isValid = false;
    } else clearInvalid(emailInputLoginPage);

    if (isValid && !passwordInputLoginPage.value.trim()) {
      setInvalid(passwordInputLoginPage, "من فضلك أدخل كلمة المرور");
      message = "من فضلك أدخل كلمة المرور";
      isValid = false;
    } else if (isValid && passwordInputLoginPage.value.trim().length < 6) {
      setInvalid(
        passwordInputLoginPage,
        "كلمة المرور يجب أن تكون 6 أحرف على الأقل"
      );
      message = "كلمة المرور يجب أن تكون 6 أحرف على الأقل";
      isValid = false;
    } else clearInvalid(passwordInputLoginPage);

    if (!isValid && message) {
      Swal.fire({
        icon: "error",
        title: "⚠️ خطأ في الإدخال",
        text: message,
        confirmButtonText: "حسنًا",
        confirmButtonColor: "#d33",
      });
    }

    return isValid;
  };

  // ✅ عند إرسال النموذج (تسجيل المستخدم)
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
      title: "🎉 تم التسجيل بنجاح",
      text: `مرحبًا بك يا ${user.firstName}`,
      confirmButtonText: "استمرار",
      confirmButtonColor: "#3085d6",
    }).then(() => {
      form.reset();
      closeModal();
      updateLoginBtnBehavior();
      window.location.href = "index.html";
    });
  });

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
  if (logOut) {
    logOut.addEventListener("click", () => {
      Swal.fire({
        icon: "question",
        title: "هل أنت متأكد من تسجيل الخروج؟",
        showCancelButton: true,
        confirmButtonText: "نعم، خروج",
        cancelButtonText: "إلغاء",
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
      }).then((result) => {
        if (result.isConfirmed) {
          localStorage.removeItem("fastDeliveryUser");
          userDropDown.classList.remove("showDropDown");
          Swal.fire({
            icon: "success",
            title: "تم تسجيل الخروج بنجاح ✅",
            confirmButtonText: "حسنًا",
          }).then(() => {
            window.location.href = "index.html";
          });
        }
      });
    });
  }

  // ✅ استدعاء عند تحميل الصفحة
  updateLoginBtnBehavior();
});
