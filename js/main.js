import {ATTENDANCE_TOGGLE_API_ENDPOINT} from "./constant.js";
import {doPost} from "./fetchElf.js";
import {userLogin} from "./login.js";
import {emailInput} from "./login.js";
import {passwordInput} from "./login.js";
import {AUDIO, playSound} from "./audio.js";
// Service Workerの登録
if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker
            .register("./service-worker.js")
            .then((registration) => {
                console.log("ServiceWorker登録成功: ", registration.scope);
            })
            .catch((err) => {
                console.log("ServiceWorker登録失敗: ", err);
            });
    });
}

document.addEventListener("DOMContentLoaded", async() => {
    userLogin();
    const cardIdScanBtn = document.getElementById('cardIdScan');
    cardIdScanBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const loginModal = document.getElementById('login_modal');
        console.log(`loginModal = ${JSON.stringify(loginModal)}`);

        loginModal.addEventListener('hidden.bs.modal', e => {
            const email = emailInput.value.trim();
            const password = passwordInput.value.trim();
            // this is tricky... handing authentication information using query parameter
            // be sure to get this in the html
            location.href = `uid-reader.html?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;
        });
        userLogin();
    })
    // 要素の取得
    const statusBox = document.getElementById("status");
    const toggleScanButton = document.getElementById("toggleScanButton");
    const manualButton = document.getElementById("manualButton");
    const scanStatus = document.getElementById("scanStatus");

    // 変数の初期化
    let isReading = false;
    let timeoutId = null;
    let ndefReader = null;
    let isScanning = true;

    // スキャン状態のタイムアウト
    const SCAN_TIMEOUT = 5000;
    const ERROR_TIMEOUT = 3000;

    // 自動的にNFCスキャンを開始
    startNfcScan();

    /**
     * NFC読み取りを開始する
     */
    async function startNfcScan() {
        if (!("NDEFReader" in window)) {
            updateStatus(
                "このブラウザはNFC APIをサポートしていません",
                "error"
            );
            updateScanStatus("NFCサポートなし", "error");
            return;
        }

        try {
            updateStatus("カードをかざしてください", "scanning");
            updateScanStatus("スキャン実行中", "active");
            toggleScanButton.textContent = "一時停止";

            // 古いリーダーを破棄
            ndefReader = null;

            // 新しいリーダーを作成
            ndefReader = new NDEFReader();
            await ndefReader.scan();
            console.log("NFCスキャン開始成功");

            // 読み取りイベントの処理
            ndefReader.addEventListener("reading", ({ serialNumber }) => {
                if (serialNumber && !isReading) {
                    isReading = true;
                    console.log("カードUID:", serialNumber);
                    playSound(AUDIO.beep);
                    sendAttendanceData(serialNumber);

                    // 連続読み取り防止
                    clearTimeout(timeoutId);
                    timeoutId = setTimeout(() => {
                        isReading = false;
                    }, SCAN_TIMEOUT);
                }
            });

            // エラーイベントの処理
            ndefReader.addEventListener("error", (error) => {
                console.error("NFC読み取りエラー:", error);
            });
        } catch (error) {
            console.error("NFCスキャン開始エラー:", error);
            updateStatus("NFCスキャン開始エラー。再試行してください", "error");

            // 自動再接続
            if (isScanning) {
                setTimeout(() => {
                    if (isScanning) startNfcScan();
                }, 5000);
            }
        }
    }

    /**
     * スキャンの一時停止/再開を切り替える
     */
    function toggleScan() {
        isScanning = !isScanning;

        if (isScanning) {
            toggleScanButton.textContent = "一時停止";
            startNfcScan();
        } else {
            toggleScanButton.textContent = "スキャン再開";
            updateStatus("NFCスキャンは一時停止しています", "");
            updateScanStatus("スキャン停止中", "inactive");
        }
    }

    /**
     * ステータス表示を更新する
     * @param {string} message - 表示メッセージ
     * @param {string} className - CSSクラス名
     */
    function updateStatus(message, className) {
        statusBox.innerHTML = `<p>${message}</p>`;
        statusBox.className = `status-box ${className}`;
    }

    /**
     * スキャン状態表示を更新する
     * @param {string} message - 表示メッセージ
     * @param {string} className - CSSクラス名
     */
    function updateScanStatus(message, className) {
        scanStatus.textContent = message;
        scanStatus.className = `scan-status ${className}`;
    }

    /**
     * スキャン待機画面に戻る
     * @param {number} timeout - タイムアウト時間（ミリ秒）
     */
    function resetToScanningState(timeout) {
        setTimeout(() => {
            if (isScanning) {
                updateStatus("カードをかざしてください", "scanning");
            }
        }, timeout);
    }

    /**
     * サーバーに入退室データを送信する
     * @param {string} cardId - カードID（UID）
     */
    async function sendAttendanceData(cardId) {
        updateStatus("処理中...", "processing");

        try {
            // APIリクエスト
            const data = await doPost(ATTENDANCE_TOGGLE_API_ENDPOINT, {cardId});
            if (data.success) {
                const action = data.type === "ENTRY" ? "入室" : "退室";
                updateStatus(
                    `<h2>${data.studentName}さん</h2>
                <p>${action}を記録しました</p>
                <p>${new Date().toLocaleTimeString()}</p>
                ${
                        !data.emailSent
                            ? '<p class="warning-text">メール通知の送信に失敗しました</p>'
                            : ""
                    }`,
                    "success"
                );
                playSound(AUDIO.success);
                resetToScanningState(SCAN_TIMEOUT);
            } else {
                updateStatus(
                    `エラー: ${data.message || "不明なエラー"}`,
                    "error"
                );
                playSound(AUDIO.error);
                resetToScanningState(ERROR_TIMEOUT);
            }
        } catch (error) {
            console.error("API通信エラー:", error);
            updateStatus(`通信エラー: ${error.message}`, "error");
            playSound(AUDIO.error);
            resetToScanningState(ERROR_TIMEOUT);
        }
    }

    // イベントリスナーの設定
    toggleScanButton.addEventListener("click", toggleScan);

    // 手動入力ボタンのイベントリスナー
    manualButton.addEventListener("click", () => {
        const cardId = prompt("カードIDを入力してください:");
        if (cardId) {
            sendAttendanceData(cardId);
        }
    });

    // ページの可視性変更時の処理
    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible" && isScanning) {
            startNfcScan();
        }
    });
});
