/**
 * IndexNow: tells Bing (and the other IndexNow engines: Yandex, Seznam, Naver;
 * Bing results also power DuckDuckGo and Yahoo) which pages changed, so they are
 * recrawled within hours instead of weeks. Google does not use IndexNow.
 *
 * Usage, after a deploy is live:
 *   npm run indexnow                 # pages whose last material change is in the last 7 days
 *   npm run indexnow -- --days 30    # a wider window
 *   npm run indexnow -- --all        # every URL in the live sitemap
 *
 * Sends only public page URLs and the public key below. No user data.
 * The key file lives at public/<KEY>.txt and must stay deployed.
 */
const KEY = 'd4ef601aa6c35cbc4593d9f81db85721';
const HOST = 'menoverdict.com';
const SITE = `https://${HOST}`;

async function main() {
  const args = process.argv.slice(2);
  const all = args.includes('--all');
  const daysArg = args.indexOf('--days');
  const days = daysArg >= 0 ? Number(args[daysArg + 1]) : 7;

  const keyCheck = await fetch(`${SITE}/${KEY}.txt`);
  if (!keyCheck.ok || (await keyCheck.text()).trim() !== KEY) {
    throw new Error(`Key file ${SITE}/${KEY}.txt is not live yet. Deploy first.`);
  }

  const xml = await (await fetch(`${SITE}/sitemap.xml`)).text();
  const entries = [...xml.matchAll(/<url>\s*<loc>([^<]+)<\/loc>(?:\s*<lastmod>([^<]+)<\/lastmod>)?/g)].map((m) => ({
    url: m[1],
    lastmod: m[2] ?? '',
  }));
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const urlList = entries.filter((e) => all || (e.lastmod && e.lastmod >= cutoff)).map((e) => e.url);
  if (urlList.length === 0) {
    console.log('No changed pages to submit.');
    return;
  }

  // IndexNow accepts up to 10,000 URLs per request.
  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `${SITE}/${KEY}.txt`, urlList }),
  });
  console.log(`IndexNow: submitted ${urlList.length} URL(s), response ${res.status} ${res.statusText}`);
  if (!res.ok && res.status !== 202) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
