import { doPost } from "./fetchElf.js";
import { AUDIO, playSound } from "./audio.js";
import { getParams } from "./WindowElf.js";
import { SET_TEACHER_CARDID_END_POINT } from "./constant.js";

document.addEventListener("DOMContentLoaded", async () => {
  const params = getParams();
  const email = params.get("email");
  const password = params.get("password");
  const registrationBtn = document.getElementById("registrationBtn");
  const backBtn = document.getElementById("backBtn");

  let ndefReader = null;
  let currentListener = null;

  registrationBtn.addEventListener("click", async () => {
    if (!("NDEFReader" in window)) {
      alert("このブラウザはWeb NFCに対応していません。");
      return;
    }

    if (
      confirm(
        `${email}にカードUIDを紐付けますか？\nYES => OKボタンを押してからカードをかざしてください`
      )
    ) {

      if (currentListener) {
        ndefReader.removeEventListener("reading", currentListener);
      }

      if (!ndefReader) {
        ndefReader = new NDEFReader();
        try {
          await ndefReader.scan();
        } catch (error) {
          alert("カード読み取りエラー" + error);
          return;
        }
      }

      currentListener = async ({ serialNumber }) => {
        ndefReader.removeEventListener("reading", currentListener);

        if (!!serialNumber) {
          playSound(AUDIO.beep);
          if (
            confirm(`${email}に\nカードID: ${serialNumber}\nを紐付けますか？`)
          ) {
            const data = { email, password, serialNumber };
            const success = await doPost(SET_TEACHER_CARDID_END_POINT, data);
            if (success) {
              playSound(AUDIO.success);
              alert(`${email}にカードID:${serialNumber}が紐付けられました。`);
              window.location.href = `index.html?email=${encodeURIComponent(
                email
              )}&password=${encodeURIComponent(password)}}`;
            } else {
              playSound(AUDIO.error);
              alert(
                `${email}にカードID:${serialNumber}を紐付けるのに失敗しました。`
              );
            }
          }
        }
      };

      ndefReader.addEventListener("reading", currentListener);
    }
  });

  backBtn.addEventListener("click", () => {
    if (confirm("元の画面に戻りますか？")) {
      window.location.href = `index.html?email=${encodeURIComponent(
        email
      )}&password=${encodeURIComponent(password)}}`;
    }
  });
});
