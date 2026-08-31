# SkinCare AI

AI-powered facial skin analysis and personalized skincare recommendations — built as a full-stack web application with a custom-trained computer vision model at its core.

A user uploads a photo, the app detects six skin conditions with a fine-tuned EfficientNet-B0 model, combines that with their skin profile and live local weather, and generates a personalized, explainable skincare routine with real product recommendations.

🌐 **Live at:** [susanmahato.com.np](https://susanmahato.com.np)

---

## Why this exists

Most skincare apps either rely on generic questionnaires or expensive in-person consultations. This project explores what's possible when you combine:

- A vision model trained specifically for cosmetic (not clinical) skin conditions
- Structured user input
- Real-time environmental context (UV index, humidity)
- An ingredient-based recommendation engine
- An LLM to turn raw scores into something a person can actually act on

## What it does

- **Analyzes skin from a photo** — scores acne, dark spots, pores, wrinkles, redness, and dark circles independently (multi-label, not a single classification)
- **Builds a skin profile** through a short onboarding quiz
- **Pulls live weather/UV data** for the user's location and factors it into SPF and ingredient suggestions
- **Ingredient engine** — matches ingredients to detected skin conditions, splits into morning/night routines, detects conflicts
- **Product recommendation engine** — matches 1,631 real products across budget/mid/premium tiers, generates LLM "why it suits you" explanations per product
- **Generates a written skin report** via an LLM, explaining the reasoning behind each recommendation
- **Tracks progress over time** with per-condition charts across scans, plus side-by-side comparison between any two scans
- **AI-assisted skin journal** — logs daily sleep, water intake, stress, and exercise, and surfaces rule-based lifestyle-condition insights once enough scan history exists
- **Stores scan history** with photos, scores, and the weather conditions at scan time
- **Full auth flow** — email/password with verification, OTP-based password reset, and Google OAuth
- **Live NPR conversion** — product prices updated at live USD/NPR exchange rate

## The model

The CV component is the part I spent the most time on, since no single public dataset covers all six target conditions. I merged four sources and fine-tuned EfficientNet-B0 on top of ImageNet weights.

The model went through two training stages. Stage 1 (15 epochs, single-label framing) reported a 97.38% validation accuracy that looked great on paper — but turned out to be a symptom of the model collapsing toward predicting one dominant condition rather than genuinely learning all six. Stage 2 rebuilt the dataset through a weak-supervision annotation pipeline (Gemini Flash-Lite auto-labelling + manual review), cutting the raw 11,621-image pool down to a more rigorously curated 4,125-image multi-label training set, then fine-tuned for 8 epochs with `BCEWithLogitsLoss` so each condition could be scored independently.

| | |
|---|---|
| Architecture | EfficientNet-B0, fine-tuned |
| Task | Multi-label classification (sigmoid output, 6 independent scores) |
| Final training set | 4,125 images (curated from an 11,621-image raw pool) |
| Macro Accuracy | **80.2%** |
| Macro F1 | **0.672** |
| ROC-AUC | **0.846** |
| PR-AUC | **0.782** |
| Loss / Optimizer | BCEWithLogitsLoss / Adam |
| Fine-tuning | Colab T4 GPU, 8 epochs (Stage 2) |
| Production format | ONNX Runtime (converted from PyTorch to fit Render's free-tier memory limit) |

Acne is detected most reliably (F1 = 0.796); pores and dark spots are the weakest (F1 ≈ 0.53), largely due to weak-supervision label noise and the inherently fuzzier "present vs. absent" boundary for those two conditions compared to something as visually distinct as acne.

<details>
<summary>Dataset breakdown (raw source pool, pre-curation)</summary>

| Condition | Source | Images |
|---|---|---|
| Acne | GlowMix (Kaggle) | 2,000 |
| Dark spots | GlowMix (Kaggle) | 2,000 |
| Pores | GlowMix (Kaggle) | 1,600 |
| Wrinkles | GlowMix (Kaggle) | 1,982 |
| Redness | TPS_Redness (Roboflow) | 2,000 |
| Dark circles | Roboflow (two sources merged) | 2,039 |

The final 4,125-image training set was assembled from this pool via weak-supervision annotation and manual review, filtering out images with inconsistent resolution, aspect ratio, or unreliable labelling.

</details>

## The recommendation engine

Two-layer engine built on top of 4 Kaggle datasets (1,631 products, 277+ ingredients):

**Layer 1 — Ingredient Engine**
- Combines CV confidence scores with quiz-reported concerns via a confidence-weighted hybrid scoring system
- Filters ingredients by skin type compatibility
- Scores ingredients by condition match and severity
- Detects ingredient conflicts (e.g. Retinol vs Vitamin C, AHA vs Retinol)
- Splits into morning/night routines based on photosensitivity, with SPF adjusted to live UV index

**Layer 2 — Product Engine**
- Matches products by ingredient overlap with ranked ingredients
- Scores by condition tags, weather context, and skin type match
- Applies a brand-diversity rule
- Builds morning/night routines per price tier (budget / mid / premium)
- Generates LLM "why it suits you" explanation per product via Groq Llama 3.3 70B

## Stack

| Layer | Tools |
|---|---|
| Frontend | Next.js 14 (App Router), Tailwind CSS, shadcn/ui, Recharts |
| Backend | FastAPI, SQLAlchemy, Alembic |
| Database | PostgreSQL (hosted on Neon) |
| ML | EfficientNet-B0 (trained in PyTorch, deployed via ONNX Runtime) |
| LLM | Groq — Llama 3.3 70B |
| Auth | JWT (PyJWT), Google OAuth2, bcrypt |
| External APIs | OpenWeatherMap, OpenUV, Resend, ExchangeRate API |
| Deployment | Render (backend API), Vercel (frontend), Neon (PostgreSQL), UptimeRobot (keep-alive pinging to avoid free-tier cold starts) |

## Project structure

```
├── app/
│   ├── api/routes/          — auth, oauth, quiz, scan, recommendation, journal, weather
│   ├── core/                — config, db session, dependency injection, rate limiting
│   ├── models/              — SQLAlchemy ORM models (user, skin_profile, scan, journal_entry, product, ingredient)
│   ├── schemas/              — request/response validation
│   ├── services/             — auth, CV inference, recommendation engine, weather, email
│   └── models_weights/       — trained model weights (.onnx)
├── alembic/                  — database migrations
├── scripts/
│   ├── seed_ingredients.py        — seed ingredients from INCI dataset
│   ├── seed_core_ingredients.py   — seed manually curated core ingredients
│   ├── seed_products.py           — seed products from Kingabzpro + eward96 + Dermstore
│   ├── seed_sephora.py            — seed products from Sephora dataset
│   ├── update_npr_prices.py       — update all product prices with live USD/NPR rate
│   └── fix_ingredients.py         — clean ingredient parsing artifacts
├── frontend/
│   ├── app/                  — Next.js routes
│   ├── components/           — IngredientCard, ProductCard, ProductTabs, JournalTab, ui/
│   └── lib/                  — API client, auth helpers
├── tests/                    — pytest suite (backend)
├── uploaded_scans/            — user-uploaded photos (gitignored)
├── requirements.txt
├── alembic.ini
└── README.md
```

## Running it locally

**Requirements:** Python 3.12+, Node 18+, PostgreSQL 16+

**Backend**

```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

API docs available at `http://127.0.0.1:8000/docs`

**Seed the database**

```bash
python scripts/seed_ingredients.py
python scripts/seed_core_ingredients.py
python scripts/seed_products.py
python scripts/seed_sephora.py
python scripts/update_npr_prices.py
```

**Frontend**

```bash
cd frontend
npm install
npm run dev
```

Runs at `http://localhost:3000`

**Environment variables** — create `.env` in the project root:

```env
DATABASE_URL=
SECRET_KEY=
ALGORITHM=
ACCESS_TOKEN_EXPIRE_MINUTES=
OPENWEATHERMAP_API_KEY=
OPENUV_API_KEY=
GROQ_API_KEY=
RESEND_API_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

## API reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/register` | Create account, triggers verification email |
| `POST` | `/auth/login` | Returns JWT access token |
| `GET` | `/auth/verify-email` | Confirms email via token |
| `POST` | `/auth/forgot-password` | Sends 6-digit OTP |
| `POST` | `/auth/reset-password` | Consumes OTP, updates password |
| `GET` | `/auth/google` | Starts Google OAuth flow |
| `GET` | `/auth/google/callback` | Handles OAuth redirect |
| `POST` | `/quiz/submit` | Saves skin profile |
| `GET` | `/quiz/profile` | Returns current skin profile |
| `GET` | `/weather/current` | Live weather + UV by coordinates |
| `POST` | `/scan/analyze` | Runs photo through the CV model |
| `GET` | `/scan/history` | Returns all past scans |
| `GET` | `/scan/compare` | Compares two scans side by side |
| `GET` | `/recommendation/latest` | Generates skin report + ingredient recommendations |
| `GET` | `/recommendation/products` | Generates full product recommendations by tier |
| `POST` | `/journal/entry` | Logs a daily journal entry |
| `GET` | `/journal/entries` | Returns journal entry history |
| `GET` | `/journal/insights` | Returns rule-based journal insights |

## Roadmap

**Done**
- [x] Authentication — JWT, email verification, OTP reset, Google OAuth
- [x] Skin quiz and profile management
- [x] CV model — multi-label EfficientNet-B0 (F1: 0.672, ROC-AUC: 0.846)
- [x] Weather/UV integration
- [x] LLM-generated skin reports
- [x] Scan history with photo storage and side-by-side comparison
- [x] AI-assisted skin journal with rule-based insights
- [x] Journal insights integrated into the AI-generated skin report — lifestyle averages (sleep, water intake, stress, exercise) and the strongest statistically-supported pattern are woven into the report when sufficient data exists, with no change in behaviour for users who don't use the journal
- [x] Ingredient engine with conflict detection and AM/PM splitting
- [x] Product recommendation engine — 1,631 products across 3 price tiers
- [x] Frontend dashboard with Products, Progress, History, and Journal tabs
- [x] Live USD/NPR exchange rate conversion
- [x] Camera capture for scans — take a photo directly (mirrored preview and capture) in addition to uploading from device
- [x] Production deployment — Render + Vercel + Neon + UptimeRobot
- [x] ONNX Runtime migration for memory-efficient inference
- [x] Security hardening — dependency audit, PyJWT migration

## Roadmap

**Done**
- [x] Authentication — JWT, email verification, OTP reset, Google OAuth
- [x] Skin quiz and profile management
- [x] CV model — multi-label EfficientNet-B0 (F1: 0.672, ROC-AUC: 0.846)
- [x] Weather/UV integration
- [x] LLM-generated skin reports
- [x] Scan history with photo storage and side-by-side comparison
- [x] AI-assisted skin journal with rule-based insights
- [x] Journal insights integrated into the AI-generated skin report — lifestyle averages (sleep, water intake, stress, exercise) and the strongest statistically-supported pattern are woven into the report when sufficient data exists, with no change in behaviour for users who don't use the journal
- [x] Ingredient engine with conflict detection and AM/PM splitting
- [x] Product recommendation engine — 1,631 products across 3 price tiers
- [x] Frontend dashboard with Products, Progress, History, and Journal tabs
- [x] Live USD/NPR exchange rate conversion
- [x] Camera capture for scans — take a photo directly (mirrored preview and capture) in addition to uploading from device
- [x] Docker support for local development — `docker compose up --build` runs the backend against a disposable local Postgres, fully isolated from production
- [x] Production deployment — Render + Vercel + Neon + UptimeRobot
- [x] ONNX Runtime migration for memory-efficient inference
- [x] Security hardening — dependency audit, PyJWT migration
- [x] Cleaned up stray Vercel deployment and stale Dependabot branches

**Considered, not pursued**
- Facebook OAuth and scheduled reminder emails were evaluated but dropped in favour of the journal and scan comparison features above.

**Next (ideas, not commitments — future work if the project continues)**
- [ ] Export scan and journal history (PDF/CSV) for sharing with a dermatologist
- [ ] Use journal insights to influence ingredient/product scoring, not just the written report text
- [ ] Expert-annotated data to improve recall on pores and dark spots

## License

MIT
