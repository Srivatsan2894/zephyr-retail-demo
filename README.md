# Zephyr Retail — Demo Site

A static 3-page site for demoing Freshdesk Omni support workflows: a homepage, a searchable FAQ (sourced from the Returns/Refunds, Order Tracking, Billing, Rewards, and Zephyr Luxe knowledge articles), and a live order-tracking page with a mock lookup you can use in a real-time demo.

No build step, no dependencies — plain HTML/CSS/JS.

## Files

```
index.html          Homepage
faq.html             Searchable, filterable FAQ (accordion, 5 categories)
track-order.html     Order tracking demo with mock order lookup
styles.css           Shared design tokens + component styles
script.js            FAQ search/filter logic + mock tracking lookup
```

## Run it locally

No server required — just open `index.html` in a browser. Or, for a closer-to-production feel:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Host it on GitHub Pages

1. Create a new repository on GitHub (e.g. `zephyr-retail-demo`) — public, no README/gitignore needed since you already have files.
2. From this folder:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Zephyr Retail demo site"
   git branch -M main
   git remote add origin https://github.com/<your-username>/zephyr-retail-demo.git
   git push -u origin main
   ```
3. On GitHub: go to your repo → **Settings → Pages**.
4. Under "Build and deployment", set **Source = Deploy from a branch**, **Branch = main**, folder = `/ (root)`. Save.
5. Wait ~1 minute, then your site is live at:
   `https://<your-username>.github.io/zephyr-retail-demo/`

That URL is what you'd point a Freshchat widget at, or reference in your Freddy AI Agent demo/knowledge sources.

## Demo the order tracking (Scenario C / WISMO)

Sample order numbers are pre-loaded as clickable chips on the Track Order page — no need to remember them live:

| Order number | Status |
|---|---|
| `ZR-48213076` | Delivered |
| `ZR-77102934` | Out for delivery |
| `ZR-90042111` | Processing |
| `ZR-10239485` | Shipped |

Any other input shows a friendly "not found" state that links back to the FAQ — useful if you want to demo the escalation/fallback path too.

## Notes

- Order data is hardcoded in `script.js` (`ORDERS` object) — simulates what a real order-management API response would look like, with a `setTimeout` standing in for network latency. Swap this for a real `fetch()` call if you wire it up to an actual backend later.
- Fonts (Space Grotesk, IBM Plex Sans) load from Google Fonts via CDN — requires an internet connection to render as designed; falls back to system fonts offline.
