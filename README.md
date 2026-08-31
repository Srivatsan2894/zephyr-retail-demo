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

## Notes

- Fonts (Space Grotesk, IBM Plex Sans) load from Google Fonts via CDN — requires an internet connection to render as designed; falls back to system fonts offline.
- The tracking page requires internet access to reach Supabase — it won't work fully offline.
