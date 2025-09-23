const CACHE_NAME = "nfc-attendance-v1";
const urlsToCache = [
    "./",
    "./index.html",
    "./style.css",
    "./manifest.json",
    "./js/constant.js",
    "./js/fetchElf.js",
    "./js/login.js",
    "./js/main.js",
    "./js/uid-reader.js",
    "./uid-reader.html",
    "https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css",
    "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.js"
];

// インストール時にリソースをキャッシュ
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Opened cache");
      return cache.addAll(urlsToCache);
    })
  );
});

// // ネットワークリクエストの処理
// self.addEventListener("fetch", (event) => {
//   event.respondWith(
//     caches
//       .match(event.request)
//       .then((response) => {
//         // キャッシュにヒットしたらそれを返す
//         if (response) {
//           return response;
//         }

//         // オリジナルのリクエストを返す
//         return fetch(event.request).then((response) => {
//           // 有効なレスポンスのみをキャッシュ
//           if (
//             !response ||
//             response.status !== 200 ||
//             response.type !== "basic"
//           ) {
//             return response;
//           }

//           // レスポンスを複製（ストリームは一度だけ使用可能なため）
//           const responseToCache = response.clone();

//           caches.open(CACHE_NAME).then((cache) => {
//             // APIリクエストはキャッシュしない
//             if (!event.request.url.includes("/api/")) {
//               cache.put(event.request, responseToCache);
//             }
//           });

//           return response;
//         });
//       })
//       .catch(() => {
//         // オフライン時などのフォールバック処理
//         if (event.request.url.includes("/api/")) {
//           return new Response(
//             JSON.stringify({
//               success: false,
//               message:
//                 "オフラインモードです。ネットワーク接続を確認してください。",
//             }),
//             {
//               headers: { "Content-Type": "application/json" },
//             }
//           );
//         }
//       })
//   );
// });

// 古いキャッシュの削除
self.addEventListener("activate", (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
