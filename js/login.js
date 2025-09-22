import {doPost} from "./fetchElf.js";
import {LOGIN_END_POINT} from "./constant.js";

export const userLogin = () => {
    const loginModal = new bootstrap.Modal(document.getElementById('login_modal'));
    const emailInput = document.getElementById('email_input');
    const passwordInput = document.getElementById('password_input');
    const submitBtn = document.getElementById('login_form_submit');
    submitBtn.addEventListener('click', async(e) => {
        e.preventDefault();
        const data = {
            email: emailInput.value.trim(),
            password: passwordInput.value.trim()
        };

        const isValid = await doPost(LOGIN_END_POINT, data);

        console.log(`isValid = ${isValid}`);

        if (!isValid) {
            alert("認証情報が間違っています");
            return;
        }

        loginModal.hide()
    });

    loginModal.show();
}
