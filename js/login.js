import {doPost} from "./fetchElf.js";
import {LOGIN_END_POINT} from "./constant.js";
const loginModal = new bootstrap.Modal(document.getElementById('login_modal'));
const emailInput = document.getElementById('email_input');
const passwordInput = document.getElementById('password_input');
const submitBtn = document.getElementById('login_form_submit');

const validateBothAndChangeBtnStatus = (el1, el2, btn) => {
    if (el1.value.trim() && el2.value.trim()) {
        btn.enabled = true;
    }
    else {
        btn.enabled =false;
    }
}

export const userLogin = () => {
    loginModal.show();
    submitBtn.addEventListener('click', async() => {
        const data = {
            email: emailInput.value.trim(),
            password: passwordInput.value.trim()
        };

        const isValid = await doPost(LOGIN_END_POINT, data);

        if (!isValid) {
            alert("認証情報が間違っています");
            return;
        }

        loginModal.hide()
    });
}
