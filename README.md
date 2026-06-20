# SkinCare AI

AI-powered facial skin analysis and personalized skincare recommendations — built as a full-stack web application with a custom-trained computer vision model at its core.

A user uploads a photo, the app detects six skin conditions with a fine-tuned EfficientNet-B0 model, and combines that with their skin profile and live local weather to generate a personalized, explainable skincare routine.

---

## Why this exists

Most skincare apps either rely on generic questionnaires or expensive in-person consultations. This project explores what's possible when you combine:

- a vision model trained specifically for cosmetic (not clinical) skin conditions,
- structured user input,
- real-time environmental context (UV index, humidity),
- and an LLM to turn raw scores into something a person can actually act on.

## What it does

- **Analyzes skin from a photo** — scores acne, redness, texture, dark spots, pores, and dark circles independently (multi-label, not a single classification)
- **Builds a skin profile** through a short onboarding quiz
- **Pulls live weather/UV data** for the user's location and factors it into SPF and ingredient suggestions
- **Generates a written skin report** via an LLM, explaining the reasoning behind each recommendation
- **Tracks progress over time** with per-condition charts across scans
- **Stores scan history** with photos, scores, and the weather conditions at scan time
- **Full auth flow** — email/password with verification, OTP-based password reset, and Google OAuth

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

## Stack

| Layer | Tools |
|---|---|
| Frontend | Next.js 14 (App Router), Tailwind CSS, shadcn/ui, Recharts |
| Backend | FastAPI, PostgreSQL, SQLAlchemy, Alembic |
| ML | PyTorch, torchvision (EfficientNet-B0) |
| LLM | Groq — Llama 3.3 70B |
| Auth | JWT, Google OAuth2, bcrypt |
| External APIs | OpenWeatherMap, OpenUV, Resend |

## Project structure
```
app/
├── api/routes/ — auth, scan, quiz, recommendation, weather, oauth
├── core/ — config, db session, dependency injection
├── models/ — SQLAlchemy ORM models
├── schemas/ — request/response validation
├── services/ — business logic: auth, CV inference, recommendation, email
└── models_weights/ — trained model weights (.pt)
alembic/ — database migrations
frontend/
├── app/ — Next.js routes
├── components/
└── lib/ — API client, auth helpers
├── uploaded_scans/ — user-uploaded photos (gitignored)
├── requirements.txt — Python dependencies
├── alembic.ini — Alembic configuration
├── .gitignore
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
| `GET` | `/recommendation/latest` | Generates personalized recommendation |

## Roadmap

**Done**
- [x] Authentication — JWT, email verification, OTP reset, Google OAuth
- [x] Skin quiz and profile management
- [x] CV model — 97.38% validation accuracy
- [x] Weather/UV integration
- [x] LLM-generated skin reports
- [x] Scan history with photo storage

**Next**
- [ ] Product database — real product recommendations across budget/popular/premium tiers
- [ ] Ingredient conflict detection
- [ ] Scan-to-scan comparison
- [ ] Weekly progress reminder emails
- [ ] Docker + production deployment

## License

MIT