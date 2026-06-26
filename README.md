# Atmos Protocol

> **The AI-powered trust and intelligence layer for the global carbon economy.**

Atmos creates a verifiable digital passport for every climate asset on Earth. Every passport is backed by satellite evidence, AI verification, and a cryptographic proof anchored on the Casper blockchain — making carbon fraud computationally impossible.

---

## What Is Atmos?

Atmos is **not** a carbon marketplace. It's **carbon intelligence infrastructure**.

Every CO₂ reduction project → satellite-verified → AI-scored → ZK-proven → passport anchored on Casper.

**Core Innovation: The Atmos Passport™**

```
Car       → VIN Number
Human     → Passport
Carbon    → Atmos Passport
```

Every climate asset gets a unique, publicly verifiable digital passport containing:
- **Atmos Score™** (0-100 composite trust score)
- AI verification results (CO₂e estimate, confidence, fraud risk)
- Satellite evidence (Sentinel-2 NDVI, fire detection, land use)
- ZK proof hash (privacy-preserving verification)
- Casper blockchain anchor (immutable proof of verification)

---

## Why Casper?

| Requirement | Why Casper Wins |
|------------|----------------|
| **Enterprise trust** | Weighted PoS with validator accountability |
| **Upgradeability** | Contract packages allow methodology updates |
| **Predictable costs** | Fixed gas pricing for high-volume MRV ops |
| **Named keys** | Human-readable on-chain storage for passports |
| **Finality** | Highway consensus guarantees for regulatory compliance |

---

## Architecture

```
┌─────────────────────────────────────────┐
│  Web Dashboard                          │
│  - Passport Viewer (public)             │
│  - AI Carbon Analyst                    │
│  - Verification Explorer               │
└──────────────┬──────────────────────────┘
               │ HTTPS
               ↓
┌─────────────────────────────────────────┐
│  Backend API (Express + TypeScript)     │
│  ┌─────────────────────────────────────┐│
│  │ Services                            ││
│  │ ├── AI Engine (11 methodologies)    ││
│  │ ├── Satellite (Sentinel-2 + FIRMS)  ││
│  │ ├── Atmos Score™ (8-dim scoring)    ││
│  │ ├── Passport (identity layer)       ││
│  │ └── Casper (blockchain anchor)      ││
│  └─────────────────────────────────────┘│
└──────────────┬──────────────────────────┘
               │
    ┌──────────┼──────────┐
    ↓          ↓          ↓
 Casper     Sentinel-2   NASA
 Testnet    STAC API     FIRMS
```

---

## Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit with your Casper testnet keys (optional — runs in demo mode without)
```

### 3. Start the Server

```bash
npm run dev
# Server → http://localhost:3001
```

### 4. Run a Verification

```bash
curl -X POST http://localhost:3001/api/verify \
  -H "Content-Type: application/json" \
  -d '{
    "projectName": "Rajasthan Solar Farm",
    "entityType": "solar_energy",
    "lat": 26.9124,
    "lng": 75.7873,
    "areaHa": 12,
    "metadata": {
      "capacityKw": 500,
      "capacityFactor": "0.22"
    }
  }'
```

Returns: Complete Atmos Passport with score, grade, satellite evidence, and Casper deploy hash.

### 5. View a Passport

```bash
curl http://localhost:3001/api/passport/<projectId>
```

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check + Casper status |
| `GET` | `/api/stats` | Protocol statistics |
| `POST` | `/api/verify` | Run full MRV pipeline → create passport |
| `GET` | `/api/passport/:id` | Get carbon passport (PUBLIC) |
| `GET` | `/api/passports` | List all passports |
| `POST` | `/api/passport/:id/retire` | Retire a passport |
| `GET` | `/api/deploy/:hash` | Check Casper deploy status |

---

## Atmos Score™

Every project gets a composite trust score from 8 dimensions:

| Dimension | Weight | Source |
|-----------|--------|--------|
| Activity Detection | 20% | Satellite confirms project exists |
| Satellite Consistency | 20% | NDVI change aligns with claims |
| Fraud Risk | 20% | Multi-signal fraud detection |
| Data Quality | 15% | Metadata completeness |
| Methodology Match | 10% | Alignment with carbon standard |
| Carbon Permanence | 5% | Durability of carbon removal |
| SDG Co-Benefits | 5% | Sustainable development impact |
| Seasonal Validity | 5% | Temporal appropriateness |

**Grade Scale:**
| Grade | Score | Meaning |
|-------|-------|---------|
| S | 90-100 | Institutional grade — premium pricing |
| A | 78-89 | Investment grade |
| B | 62-77 | Standard grade |
| C | 45-61 | Community grade |
| D | 0-44 | Pilot / research only |

---

## Supported Entity Types

| Entity | Methodology | Example |
|--------|-------------|---------|
| `biochar` | VM0044 | Rice husk → biochar |
| `agroforestry` | VM0047 | Alley cropping systems |
| `solar_energy` | AMS-I.D | Solar farm kWh |
| `ev_fleet` | AMS-III.C | EV fleet displacement |
| `building` | AMS-II.C | HVAC retrofit |
| `shipping` | VM0051 | Maritime fuel reduction |
| `aviation` | CORSIA | Airline carbon offsets |
| `soil_carbon` | VM0042 | Soil organic carbon |
| `crop_residue` | VM0042 | No-burn management |
| `city` | CDM-AR | Municipal programs |
| `individual` | GHG-IND-01 | Personal carbon actions |

---

## Smart Contract (Casper)

The `contracts/atmos-passport/` directory contains the Casper WASM smart contract that stores:

- Atmos Score + all dimensions
- Carbon data (CO₂e, grade, methodology, vintage)
- Verification provenance (ZK proof hash, satellite evidence hash)
- Immutable history (every score change, ownership transfer, retirement)

**Entry Points:**
| Function | Description |
|----------|-------------|
| `create_passport` | Create a new verified carbon passport |
| `retire_passport` | Permanently retire for ESG compliance |
| `update_score` | Update score after re-verification |
| `set_paused` | Admin: pause/unpause protocol |
| `get_protocol_stats` | Query total passports, CO₂e, retirements |

---

## Why Atmos Wins

| Company | Measure | AI Verify | Score | On-Chain Passport | ZK Privacy |
|---------|---------|-----------|-------|-------------------|------------|
| Verra | ❌ | ❌ | ❌ | ❌ | ❌ |
| Varaha | ✅ | ❌ | ❌ | ❌ | ❌ |
| Sylvera | ❌ | ✅ | Partial | ❌ | ❌ |
| Pachama | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Atmos** | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## Tech Stack

- **Smart Contract:** Rust + WASM (Casper Network)
- **Backend:** TypeScript + Express.js
- **AI Engine:** Custom 11-methodology carbon estimator with IPCC AR6 factors
- **Satellite:** Sentinel-2 STAC API + NASA FIRMS fire detection
- **Blockchain:** Casper Testnet (casper-js-sdk)

---

## One-Line Pitch

> **"Atmos creates a verifiable digital passport for every climate asset on Earth."**

Registries record data. We generate trust.

---

**Atmos Protocol — Built on Casper. Powered by AI. Verified by Satellites.**
