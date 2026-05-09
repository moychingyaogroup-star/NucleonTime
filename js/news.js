async function fetchNews() {
  const cacheKey = 'NEWS_CACHE';
  const cacheStr = localStorage.getItem(cacheKey);
  const now = Date.now();

  if (cacheStr) {
    try {
      const cache = JSON.parse(cacheStr);
      // 12 hours = 12 * 60 * 60 * 1000 = 43200000 ms
      if (now - cache.timestamp < 43200000 && cache.articles) {
        return cache.articles;
      }
    } catch (e) {
      console.error('Error parsing news cache', e);
    }
  }

  // Fallback to fetch new if cache missed/expired
  try {
    // using rss2json public endpoint as free unauthenticated api
    const urlGlobal = 'https://api.rss2json.com/v1/api.json?rss_url=http://rss.cnn.com/rss/edition.rss';
    const urlMalaysia = 'https://api.rss2json.com/v1/api.json?rss_url=https://www.malaymail.com/feed/rss/malaysia';

    const [resGlobal, resMalaysia] = await Promise.all([
        fetch(urlGlobal),
        fetch(urlMalaysia)
    ]);

    if (!resGlobal.ok || !resMalaysia.ok) throw new Error('News fetch failed');

    const dataGlobal = await resGlobal.json();
    const dataMalaysia = await resMalaysia.json();

    const globalItems = (dataGlobal.items || []).slice(0, 5).map(item => ({
      source: "CNN Global",
      headline: item.title,
      summary: item.description || item.content || "Read more...",
      url: item.link
    }));

    const myItems = (dataMalaysia.items || []).slice(0, 5).map(item => ({
      source: "Malay Mail MY",
      headline: item.title,
      summary: item.description || item.content || "Read more...",
      url: item.link
    }));

    // Mix them
    const items = [...myItems, ...globalItems];
    // Shuffle slightly or just keep it MY first


    localStorage.setItem(cacheKey, JSON.stringify({ timestamp: now, articles: items }));
    return items;
  } catch (error) {
    console.error('Failed to fetch news', error);
    // If fail, return empty or cached if available
    if (cacheStr) {
        try { return JSON.parse(cacheStr).articles; } catch(e){}
    }
    return [];
  }
}

async function renderNews() {
  const listEl = document.getElementById('news-feed-list');
  if (!listEl) return;

  listEl.innerHTML = '<div style="color:var(--muted);text-align:center;padding:20px;">Fetching news...</div>';

  const articles = await fetchNews();

  if (!articles || articles.length === 0) {
    listEl.innerHTML = '<div style="color:var(--muted);text-align:center;padding:20px;">Failed to load news. Check your connection.</div>';
    return;
  }

  listEl.innerHTML = '';

  articles.forEach(art => {
    // Clean summary (remove HTML tags from RSS description)
    let summaryText = art.summary.replace(/<[^>]+>/g, '').trim();
    if (summaryText.length > 120) summaryText = summaryText.substring(0, 120) + '...';

    const card = document.createElement('div');
    card.style.cssText = 'background:var(--card-bg); border:1px solid var(--border); border-radius:12px; padding:15px; display:flex; flex-direction:column; gap:8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);';

    card.innerHTML = `
      <div style="font-size:11px; font-weight:700; color:var(--accent); text-transform:uppercase; letter-spacing:0.5px;">${art.source}</div>
      <div style="font-size:16px; font-weight:600; color:var(--text); line-height:1.3;">${art.headline}</div>
      <div style="font-size:13px; color:var(--text2); line-height:1.5;">${summaryText}</div>
      <a href="${art.url}" target="_blank" style="margin-top:5px; font-size:12px; font-weight:600; color:var(--accent); text-decoration:none;">Read Full Article →</a>
    `;

    listEl.appendChild(card);
  });
}
