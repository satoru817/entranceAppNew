import { doScan } from "./scanElf.js";
import { doPost } from "./fetchElf.js";
import { GET_STUDENT_API_END_POINT, SET_STUDENT_CARDID_END_POINT } from "./constant.js";
import {AUDIO, playSound} from "./audio.js";

export const getParams = () => {
    const queryString = window.location.search;
    console.log(`queryString = ${queryString}`);
    return new URLSearchParams(queryString);
}

export const getStudentList = async(email, password) => {
    const data = {email, password};
    const students = await doPost(GET_STUDENT_API_END_POINT, data);
    console.log(`students = ${students}`);
    return students;
}

document.addEventListener("DOMContentLoaded", async() => {

    const status = document.getElementById("status");
    const uidDisplay = document.getElementById("uid");
    const scanButton = document.getElementById("scanButton");
    const copyButton = document.getElementById("copyButton");
    const historyList = document.getElementById("historyList");

    const params = getParams();
    const email = params.get('email');
    const password = params.get('password');
    // Fetching students data ...
    const students = await getStudentList(email, password);

    const cardIdRegistrationModal = document.getElementById('cardId_registration_modal');
    const cramSchoolSelection = document.getElementById('cramSchoolSelection');
    const studentSelection = document.getElementById('studentSelection');
    const cramSchools = [...students].map(s => s.cramSchoolName);
    cramSchoolSelection.innerHTML = `<option>校舎を選択してください</option>${cramSchools.map(name => `<option value=${name}>${name}</option>`).join('')}`;
    const createOptionsFromStudentInfos = (studentInfos) => {
        const studentPart = studentInfos.map(studentInfo =>
            `<option id=option_${studentInfo.studentId} value='${studentInfo.studentName}' data-card-id=${studentInfo.cardId} data-student-id=${studentInfo.studentId} class=${studentInfo.cardId ? "text-success" : "text-danger"}>${studentInfo.studentName} ${studentInfo.cardId ? '設定ずみ' : '未設定' } ${studentInfo.cardId}</option>`
        ).join('');

        return `<option class="text-danger">生徒を選択してください</option>${studentPart}`;
    }

    if (cramSchools.length === 1) {
        studentSelection.innerHTML = createOptionsFromStudentInfos(students[0].studentInfos);
    }

    cardIdRegistrationModal.addEventListener('show.bs.modal', (e) => {
        cramSchoolSelection.addEventListener('change', (e) => {
            if (e.target.value) {
                const selectedCramSchoolName = e.target.value;
                console.log(`selected cramSchool = ${selectedCramSchoolName}`);
                const relatedStudents = students.filter(dto => dto.cramSchoolName === selectedCramSchoolName)[0].studentInfos;
                studentSelection.innerHTML = createOptionsFromStudentInfos(relatedStudents);
            }
        });

        studentSelection.addEventListener('change', async(e) => {
            const studentName = e.target.value;
            if (!studentName) return; // excludes guide option

            const studentId = e.target.dataset.studentId;
            const cardId = e.target.dataset.cardId;
            if (confirm(`${studentName}にカードを紐づけますか？\n紐づけるつもりならカードをかざしてください。`)) {
                const ndefReader = new NDEFReader();
                await ndefReader.scan();
                ndefReader.addEventListener('reading', async ({serialNumber}) => {
                   playSound(AUDIO.success);
                   if (serialNumber && cardId !== serialNumber) {
                       if (confirm(`${studentName}に\nカードID: ${serialNumber}\nを紐づけますか？`)){
                           const data = {studentId, cardId};
                           const success = await doPost(SET_STUDENT_CARDID_END_POINT, data);
                           if (success) {
                               playSound(AUDIO.success);
                               //TODO: fix this
                               const relatedOption = document.getElementById(`option_${studentId}`);
                               relatedOption.outerHTML = `<option id=option_${studentId} value='${studentName}' data-card-id=${serialNumber} data-student-id=${studentId} "text-success" >${studentName}  '設定ずみ'  ${serialNumber}</option>`
                               alert(`${studentName}にカードID${serialNumber}を正常に紐づけられました.`);
                           }
                           else {
                               alert("カードの紐付けに失敗しました");
                           }
                       }
                   }
                   else {
                       alert(`このカードID${_serialNumber}が既にこの生徒${studentName}と紐づいています。`);
                   }
                }, {once: true});
            }
        });
    });

    const registrationBtn = document.getElementById('registrationBtn');
    registrationBtn.addEventListener('click', () => {
        new bootstrap.Modal(cardIdRegistrationModal).show();
    })

    // TODO: create modal

    let currentUID = null;

    // NFC読取ボタン
    scanButton.addEventListener("click", async () => {
        status.textContent = "読取準備中...";
        status.className = "status reading";

        try {
            console.log("NFCスキャン開始を試みます...");
            const ndef = new NDEFReader();
            await ndef.scan();
            console.log("NFCスキャン開始成功!");

            status.textContent = "カードをかざしてください";

            ndef.addEventListener("reading", ({ serialNumber }) => {
                console.log("カード読取成功:", serialNumber);
                currentUID = serialNumber;
                uidDisplay.textContent = serialNumber;

                status.textContent = "読取成功！";
                status.className = "status success";

                // 履歴に追加
                addToHistory(serialNumber);

                // 5秒後に再度読取待機状態に
                setTimeout(() => {
                    status.textContent = "カードをかざしてください";
                    status.className = "status reading";
                }, 5000);
            });

            ndef.addEventListener("readingerror", (error) => {
                console.error("読取エラー:", error);
                status.textContent = `読取エラー: ${error}`;
                status.className = "status error";
            });
        } catch (error) {
            console.error("NFCエラー:", error);
            status.textContent = `エラー: ${error.message}`;
            status.className = "status error";
        }
    });

    // コピーボタン
    copyButton.addEventListener("click", () => {
        if (currentUID) {
            navigator.clipboard
                .writeText(currentUID)
                .then(() => {
                    const originalText = copyButton.textContent;
                    copyButton.textContent = "コピー完了!";
                    setTimeout(() => {
                        copyButton.textContent = originalText;
                    }, 2000);
                })
                .catch((err) => {
                    console.error("コピーエラー:", err);
                    alert("コピーに失敗しました");
                });
        } else {
            alert("まだカードが読み取られていません");
        }
    });

    // 履歴に追加する関数
    function addToHistory(uid) {
        const now = new Date();
        const timestamp = now.toLocaleTimeString();

        const historyItem = document.createElement("div");
        historyItem.className = "history-item";
        historyItem.textContent = `${timestamp}: ${uid}`;

        historyList.insertBefore(historyItem, historyList.firstChild);

        // 履歴は最大10件まで
        if (historyList.children.length > 10) {
            historyList.removeChild(historyList.lastChild);
        }

        // ローカルストレージに保存
        saveHistory();
    }

    // 履歴を保存
    function saveHistory() {
        const historyItems = [];
        for (let i = 0; i < historyList.children.length; i++) {
            historyItems.push(historyList.children[i].textContent);
        }

        localStorage.setItem("nfcUidHistory", JSON.stringify(historyItems));
    }

    // 履歴を読み込み
    function loadHistory() {
        const savedHistory = localStorage.getItem("nfcUidHistory");
        if (savedHistory) {
            const historyItems = JSON.parse(savedHistory);
            historyItems.forEach((item) => {
                const historyItem = document.createElement("div");
                historyItem.className = "history-item";
                historyItem.textContent = item;
                historyList.appendChild(historyItem);
            });
        }
    }

    // 初期読み込み
    loadHistory();
}, {once: true});
