document.addEventListener("DOMContentLoaded", () => {
    const status = document.getElementById("status");
    const uidDisplay = document.getElementById("uid");
    const scanButton = document.getElementById("scanButton");
    const copyButton = document.getElementById("copyButton");
    const historyList = document.getElementById("historyList");

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
});
