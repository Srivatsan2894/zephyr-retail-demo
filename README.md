# Zephyr Retail — Demo Site

A static site for demoing Freshdesk Omni support workflows: a homepage, a searchable FAQ, a live order-tracking page, and a separate **Zephyr Luxe** sub-brand page — built specifically to demo the "premium widget" architecture (Scenario D): a distinct chat greeting and dedicated agent team on the Luxe site, without touching the main brand's chat.

No build step, no dependencies — plain HTML/CSS/JS.

## Files

```
index.html          Homepage — Zephyr Retail
faq.html             Searchable, filterable FAQ (accordion, 5 categories)
track-order.html     Order tracking demo with live Supabase-backed lookup
zephyr-luxe.html      Zephyr Luxe sub-brand page — own identity, own chat widget
styles.css           Shared design tokens + component styles
script.js            FAQ search/filter, tracking lookup, carousel, Luxe chat button
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

| Order number | Status | Notes |
|---|---|---|
| `ABC123` | Out for delivery | Mock US customer (Emily Carter, Austin TX) — good for the bot demo |
| `XYZ789` | Delivered | Mock US customer (Marcus Webb, Denver CO) |
| `QWE456` | Processing | Mock US customer (Priya Nandakumar, Seattle WA) |
| `ZR-48213076` | Delivered | |
| `ZR-77102934` | Out for delivery | |
| `ZR-90042111` | Processing | |
| `ZR-10239485` | Shipped | |

Any other input shows a friendly "not found" state that links back to the FAQ — useful if you want to demo the escalation/fallback path too.

## Backend: live Supabase database

Order data is **not hardcoded** — it's a real Postgres table on Supabase, queried live over its auto-generated REST API (PostgREST). This is the same shape of call a Freshdesk AI Agent workflow step would make.

- **Project**: `Zephyr Retail Orders` (Supabase project ref `flpwfhyqqkftrcwyihkr`)
- **Table**: `public.orders` — columns: `order_id`, `customer_name`, `email`, `title`, `placed_date`, `status`, `current_step`, `step_dates` (jsonb), `carrier`, `tracking_number`, `ship_to`, `eta`, `current_location`, `help_note`, `items` (jsonb)
- **Access**: Row Level Security is enabled with a public, read-only `SELECT` policy — anyone with an order ID can look up status, nobody can write without an authenticated/service-role key. This mirrors how a real customer-facing order-status endpoint behaves.
- **REST endpoint** (used by `script.js`):
  ```
  GET https://flpwfhyqqkftrcwyihkr.supabase.co/rest/v1/orders?order_id=eq.ABC123&select=*
  Headers:
    apikey: sb_publishable_Jg5_0Ynw7tY8BNqJv4abSA_Aw20IXiv
    Authorization: Bearer sb_publishable_Jg5_0Ynw7tY8BNqJv4abSA_Aw20IXiv
  ```
  The publishable key is safe to expose client-side by design — it only grants what the RLS policy allows (read-only here).

### Using this same endpoint from Freshdesk

In **AI Agent Studio → Build → Workflows**, you can add an API-call step (or use the Workflow builder's HTTP/API action) pointed at this exact URL pattern, swapping `ABC123` for a variable captured from the customer's message (e.g. `{{order_id}}`). The response JSON maps directly to what the bot needs to answer "where is my order" — `status`, `eta`, `current_location`, `tracking_number` — without you building or hosting any backend yourself.

To add, update, or remove orders later, either run SQL directly against the table (via the Supabase dashboard's SQL editor) or extend this into a small internal form — the table is already structured for it.

## Demo Scenario D: Zephyr Luxe premium widget

`zephyr-luxe.html` is a public page (no login) with its own visual identity — dark theme, gold accent badge logo, distinct "The Luxe Edit" carousel — separate from the main Zephyr Retail brand.

- **Widget**: currently uses the Freshdesk Web Chat widget on `bittertruth.freshdesk.com` (widget ID `01M11N6RRJ66Z22FJCAY0RE84Z`), loaded immediately for every visitor — no gating, since Scenario D routes by **brand/site**, not by customer identity.
- **To finish the architecture properly**: create a **second, separate widget** in Freshdesk Admin → Web Chat Widgets specifically for Luxe, with its own greeting text and a routing rule to your 5-agent Luxe concierge group. Swap that widget's `token`/`widgetId` into the `<script>` block near the bottom of `zephyr-luxe.html`. Keeping this widget distinct from whatever widget eventually goes on the main site (`index.html`/`faq.html`/`track-order.html`) is what proves the "without interfering with the main brand's chat" requirement.
- The "Chat with Zephyr Luxe" button calls `fdWidget.open()` / `.show()` if available; if neither exists it logs the widget's actual methods to the console so you can confirm the right call once it's live.

*(A Zephyr Elite/VIP White Glove portal for Scenario B was prototyped earlier — login gate backed by a Supabase Edge Function — and has been removed from this build to keep focus on Scenario D. The Supabase backend for it (`vip_customers` table, `vip-login` function) is still live if you want to bring it back later.)*

## Notes

- Fonts (Space Grotesk, IBM Plex Sans) load from Google Fonts via CDN; carousel images load from `loremflickr.com` (free, keyword-matched, Creative Commons-licensed placeholder photos — no API key). Both require an internet connection.
- The tracking page requires internet access to reach Supabase — it won't work fully offline.
