# SkinCare AI

AI-powered facial skin analysis and personalized skincare recommendations — built as a full-stack web application with a custom-trained computer vision model at its core.

A user uploads a photo, the app detects six skin conditions with a fine-tuned EfficientNet-B0 model, combines that with their skin profile and live local weather, and generates a personalized, explainable skincare routine with real product recommendations.

---

## Why this exists

Most skincare apps either rely on generic questionnaires or expensive in-person consultations. This project explores what's possible when you combine:

- A vision model trained specifically for cosmetic (not clinical) skin conditions
- Structured user input
- Real-time environmental context (UV index, humidity)
- An ingredient-based recommendation engine
- An LLM to turn raw scores into something a person can actually act on

## What it does

- **Analyzes skin from a photo** — scores acne, redness, texture, dark spots, pores, and dark circles independently (multi-label, not a single classification)
- **Builds a skin profile** through a short onboarding quiz
- **Pulls live weather/UV data** for the user's location and factors it into SPF and ingredient suggestions
- **Ingredient engine** — matches ingredients to detected skin conditions, splits into morning/night routines, detects conflicts
- **Product recommendation engine** — matches 1,631 real products across budget/mid/premium tiers, generates LLM "why it suits you" explanations per product
- **Generates a written skin report** via an LLM, explaining the reasoning behind each recommendation
- **Tracks progress over time** with per-condition charts across scans
- **Stores scan history** with photos, scores, and the weather conditions at scan time
- **Full auth flow** — email/password with verification, OTP-based password reset, and Google OAuth
- **Live NPR conversion** — product prices updated at live USD/NPR exchange rate

## The model

The CV component is the part I spent the most time on, since no single public dataset covers all six target conditions. I merged four sources, rebalanced classes manually, and fine-tuned EfficientNet-B0 on top of ImageNet weights.

| | |
|---|---|
| Architecture | EfficientNet-B0, fine-tuned |
| Task | Multi-label binary classification (sigmoid output, 6 independent scores) |
| Dataset size | 11,621 images |
| Validation accuracy | **97.38%** |
| Loss / Optimizer | BCELoss / Adam |
| Trained on | Colab T4 GPU, 15 epochs |

<details>
<summary>Dataset breakdown</summary>

| Condition | Source | Images |
|---|---|---|
| Acne | GlowMix (Kaggle) | 2,000 |
| Dark spots | GlowMix (Kaggle) | 2,000 |
| Pores | GlowMix (Kaggle) | 1,600 |
| Texture | GlowMix (Kaggle) | 1,982 |
| Redness | TPS_Redness (Roboflow) | 2,000 |
| Dark circles | Roboflow (two sources merged) | 2,039 |

</details>

## The recommendation engine

Two-layer engine built on top of 4 Kaggle datasets (1,631 products, 277 ingredients):

**Layer 1 — Ingredient Engine**
- Filters ingredients by skin type compatibility
- Scores ingredients by condition match and severity (+3 per match, +2 for high severity)
- Detects ingredient conflicts (e.g. Retinol vs Vitamin C, AHA vs Retinol)
- Splits into morning/night routines based on photosensitivity

**Layer 2 — Product Engine**
- Matches products by ingredient overlap with ranked ingredients
- Scores by condition tags, weather context, and skin type match
- Applies 1-per-brand diversity rule
- Builds morning/night routines per price tier (budget / mid / premium)
- Generates LLM "why it suits you" explanation per product via Groq Llama 3.3 70B

## Stack

| Layer | Tools |
|---|---|
| Frontend | Next.js 14 (App Router), Tailwind CSS, shadcn/ui, Recharts |
| Backend | FastAPI, PostgreSQL, SQLAlchemy, Alembic |
| ML | PyTorch, torchvision (EfficientNet-B0) |
| LLM | Groq — Llama 3.3 70B |
| Auth | JWT, Google OAuth2, bcrypt |
| External APIs | OpenWeatherMap, OpenUV, Resend, ExchangeRate API |

## Project structure

```
├── app/

│   ├── api/routes/          — auth, scan, quiz, recommendation, weather, oauth

│   ├── core/                — config, db session, dependency injection

│   ├── models/              — SQLAlchemy ORM models (user, scan, skin_profile, ingredient, product)

│   ├── schemas/             — request/response validation

│   ├── services/            — auth, CV inference, recommendation engine, email

│   └── models_weights/      — trained model weights (.pt)

├── alembic/                 — database migrations

├── scripts/

│   ├── seed_ingredients.py        — seed 247 ingredients from INCI dataset

│   ├── seed_core_ingredients.py   — seed 30 manually curated core ingredients

│   ├── seed_products.py           — seed products from Kingabzpro + eward96 + Dermstore

│   ├── seed_sephora.py            — seed products from Sephora dataset

│   ├── update_npr_prices.py       — update all product prices with live USD/NPR rate

│   └── fix_ingredients.py         — clean ingredient parsing artifacts

├── frontend/

│   ├── app/                 — Next.js routes

│   ├── components/          — IngredientCard, ProductCard, ProductTabs, ui/

│   └── lib/                 — API client, auth helpers

├── uploaded_scans/          — user-uploaded photos (gitignored)

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
DATABASE_URL=postgresql://user:password@localhost:5432/skincare_db
SECRET_KEY=
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
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
| `GET` | `/recommendation/latest` | Generates skin report + ingredient recommendations |
| `GET` | `/recommendation/products` | Generates full product recommendations by tier |

## Roadmap

**Done**
- [x] Authentication — JWT, email verification, OTP reset, Google OAuth
- [x] Skin quiz and profile management
- [x] CV model — 97.38% validation accuracy
- [x] Weather/UV integration
- [x] LLM-generated skin reports
- [x] Scan history with photo storage
- [x] Ingredient engine with conflict detection and AM/PM splitting
- [x] Product recommendation engine — 1,631 products across 3 price tiers
- [x] Frontend dashboard with Products tab, IngredientCard, ProductCard
- [x] Live USD/NPR exchange rate conversion

**Next**
- [ ] Scan-to-scan comparison
- [ ] Weekly progress reminder emails
- [ ] Docker + production deployment

## License

MIT
