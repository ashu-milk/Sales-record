const CACHE_NAME = 'stylist-note-v10';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-48.png',
  './icon-72.png',
  './icon-96.png',
  './icon-144.png',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-192.png',
  './icon-maskable-512.png',
];
// Excel書き出し/読み込みで使うライブラリ。取得できなくてもアプリ本体の動作には影響しないため、
// 失敗してもインストール全体を失敗させないよう別扱いにする。
const OPTIONAL_ASSETS = [
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(async (cache) => {
        await cache.addAll(ASSETS);
        await Promise.all(OPTIONAL_ASSETS.map((url) =>
          cache.add(url).catch(() => {
            // オフライン等で取得できなくても、次回オンライン時にfetchハンドラー側でキャッシュされる
          })
        ));
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // ネットワークにつながっている時は常に最新を取りに行き(ブラウザのHTTPキャッシュも無視)、
  // 取得できたらキャッシュを更新する。オフライン等で取得できない時だけキャッシュを使う。
  event.respondWith(
    fetch(event.request, {cache: 'no-store'})
      .then((res) => {
        if (res && res.status === 200) {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
        }
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
