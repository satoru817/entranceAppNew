import {doPost} from "./fetchElf.js";
import {GET_STUDENT_API_END_POINT, LOGIN_END_POINT} from "./constant.js";
const loginModal = new bootstrap.Modal(document.getElementById('login_modal'));
export const emailInput = document.getElementById('email_input');
export const passwordInput = document.getElementById('password_input');
const submitBtn = document.getElementById('login_form_submit');

export const userLogin = () => {
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

        loginModal.hide();
        // clear out modal input field.
        emailInput.value = '';
        passwordInput.value = '';
    });

    loginModal.show();
}
