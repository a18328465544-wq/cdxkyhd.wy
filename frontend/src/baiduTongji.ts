type TongjiCommand = [string, ...unknown[]];

declare global {
  interface Window {
    _hmt?: TongjiCommand[];
  }
}

const siteId = import.meta.env.VITE_BAIDU_TONGJI_ID?.trim();

if (import.meta.env.PROD && siteId && /^[a-f\d]{32}$/i.test(siteId)) {
  const queue = window._hmt ?? [];
  window._hmt = queue;
  queue.push([
    '_requirePlugin',
    'UrlChangeTracker',
    {
      shouldTrackUrlChange: (newPath: string, oldPath: string) => {
        if (!newPath || !oldPath) return false;
        return newPath.split('#', 1)[0] !== oldPath.split('#', 1)[0];
      },
    },
  ]);

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://hm.baidu.com/hm.js?${siteId}`;
  script.dataset.baiduTongji = 'true';
  document.head.appendChild(script);
}
