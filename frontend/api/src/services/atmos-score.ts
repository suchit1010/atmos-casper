/**
 * ATMOS Score™ — The Composite Trust Score
 * ─────────────────────────────────────────────────────
 * Every carbon asset gets a single 0-100 score that combines:
 *   - AI confidence (verification quality)
 *   - Satellite consistency (physical evidence)
 *   - Fraud risk (inverted — higher = safer)
 *   - Data quality (metadata completeness)
 *   - Methodology match (standard alignment)
 *   - Permanence (carbon durability)
 *   - Co-benefits (SDG impact)
 *
 * The Atmos Score is THE moat.
 * It's what makes Atmos a trust layer, not a marketplace.
 *
 * Grade mapping:
 *   S: 90-100 — Institutional grade (premium pricing)
 *   A: 78-89  — Investment grade
 *   B: 62-77  — Standard grade
 *   C: 45-61  — Community grade
 *   D: 0-44   — Pilot / research only
 */

import { logger } from '../utils/logger';

// ── Score Dimensions ─────────────────────────────────────
export interface AtmosScoreDimensions {
  activityDetection: number;     // 0-100: Satellite confirms project activity
  satelliteConsistency: number;  // 0-100: NDVI/biomass aligns with claims
  dataQuality: number;           // 0-100: Metadata completeness
  fraudRisk: number;             // 0-100: Safety score (100 = no fraud risk)
  methodologyMatch: number;      // 0-100: Alignment with carbon standard
  permanenceScore: number;       // 0-100: Carbon durability over time
  coBenefitScore: number;        // 0-100: SDG co-benefits impact
  seasonalValidity: number;      // 0-100: Seasonal/temporal appropriateness
}

export interface AtmosScoreResult {
  score: number;                 // 0-100 composite
  grade: 'S' | 'A' | 'B' | 'C' | 'D';
  gradeNumeric: number;          // 4=S, 3=A, 2=B, 1=C, 0=D
  dimensions: AtmosScoreDimensions;
  riskLevel: 'low' | 'medium' | 'high';
  investmentGrade: boolean;      // Score >= 78
  summary: string;
  priceMultiplier: number;       // Grade-based price premium
}

// ── Weights (must sum to 1.0) ────────────────────────────
const WEIGHTS = {
  activityDetection:    0.20,
  satelliteConsistency: 0.20,
  fraudRisk:            0.20,
  dataQuality:          0.15,
  methodologyMatch:     0.10,
  permanenceScore:      0.05,
  coBenefitScore:       0.05,
  seasonalValidity:     0.05,
};

// ── Grade Assignment ─────────────────────────────────────
function assignGrade(score: number, fraudRisk: number): {
  grade: 'S' | 'A' | 'B' | 'C' | 'D';
  gradeNumeric: number;
} {
  // High fraud overrides everything
  if (fraudRisk < 40) return { grade: 'D', gradeNumeric: 0 };

  if (score >= 90 && fraudRisk >= 80) return { grade: 'S', gradeNumeric: 4 };
  if (score >= 78 && fraudRisk >= 70) return { grade: 'A', gradeNumeric: 3 };
  if (score >= 62)                    return { grade: 'B', gradeNumeric: 2 };
  if (score >= 45)                    return { grade: 'C', gradeNumeric: 1 };
  return { grade: 'D', gradeNumeric: 0 };
}

// ── Risk Level ───────────────────────────────────────────
function getRiskLevel(fraudRisk: number): 'low' | 'medium' | 'high' {
  if (fraudRisk >= 70) return 'low';
  if (fraudRisk >= 40) return 'medium';
  return 'high';
}

// ── Price Multiplier by Grade ────────────────────────────
function getPriceMultiplier(grade: string): number {
  const map: Record<string, number> = {
    S: 1.50,
    A: 1.25,
    B: 1.00,
    C: 0.75,
    D: 0.40,
  };
  return map[grade] || 1.0;
}

// ── Summary Generator ────────────────────────────────────
function generateSummary(
  score: number,
  grade: string,
  riskLevel: string,
  dimensions: AtmosScoreDimensions
): string {
  const weakest = Object.entries(dimensions)
    .sort(([, a], [, b]) => a - b)[0];

  const strongest = Object.entries(dimensions)
    .sort(([, a], [, b]) => b - a)[0];

  let summary = `Atmos Score ${score}/100 (Grade ${grade}). `;

  if (riskLevel === 'high') {
    summary += `HIGH RISK — elevated fraud signals detected. `;
  } else if (riskLevel === 'low') {
    summary += `Low risk profile with strong verification. `;
  }

  summary += `Strongest: ${formatDimensionName(strongest[0])} (${strongest[1]}). `;
  summary += `Needs improvement: ${formatDimensionName(weakest[0])} (${weakest[1]}).`;

  return summary;
}

function formatDimensionName(key: string): string {
  const map: Record<string, string> = {
    activityDetection: 'Activity Detection',
    satelliteConsistency: 'Satellite Consistency',
    dataQuality: 'Data Quality',
    fraudRisk: 'Fraud Safety',
    methodologyMatch: 'Methodology Alignment',
    permanenceScore: 'Carbon Permanence',
    coBenefitScore: 'SDG Co-Benefits',
    seasonalValidity: 'Seasonal Validity',
  };
  return map[key] || key;
}

// ── MAIN: Calculate Atmos Score ──────────────────────────
export function calculateAtmosScore(
  dimensions: AtmosScoreDimensions
): AtmosScoreResult {
  // Clamp all dimensions to 0-100
  const clamped: AtmosScoreDimensions = {
    activityDetection:    clamp(dimensions.activityDetection),
    satelliteConsistency: clamp(dimensions.satelliteConsistency),
    dataQuality:          clamp(dimensions.dataQuality),
    fraudRisk:            clamp(dimensions.fraudRisk),
    methodologyMatch:     clamp(dimensions.methodologyMatch),
    permanenceScore:      clamp(dimensions.permanenceScore),
    coBenefitScore:       clamp(dimensions.coBenefitScore),
    seasonalValidity:     clamp(dimensions.seasonalValidity),
  };

  // Weighted average
  const score = Math.round(
    clamped.activityDetection    * WEIGHTS.activityDetection +
    clamped.satelliteConsistency * WEIGHTS.satelliteConsistency +
    clamped.fraudRisk            * WEIGHTS.fraudRisk +
    clamped.dataQuality          * WEIGHTS.dataQuality +
    clamped.methodologyMatch     * WEIGHTS.methodologyMatch +
    clamped.permanenceScore      * WEIGHTS.permanenceScore +
    clamped.coBenefitScore       * WEIGHTS.coBenefitScore +
    clamped.seasonalValidity     * WEIGHTS.seasonalValidity
  );

  const { grade, gradeNumeric } = assignGrade(score, clamped.fraudRisk);
  const riskLevel = getRiskLevel(clamped.fraudRisk);
  const priceMultiplier = getPriceMultiplier(grade);
  const summary = generateSummary(score, grade, riskLevel, clamped);

  logger.info('Atmos Score calculated', { score, grade, riskLevel });

  return {
    score: clamp(score),
    grade,
    gradeNumeric,
    dimensions: clamped,
    riskLevel,
    investmentGrade: score >= 78,
    summary,
    priceMultiplier,
  };
}

// ── Price Recommendation ─────────────────────────────────
export interface PriceRecommendation {
  minUsd: number;
  maxUsd: number;
  midUsd: number;
  pricePerTonne: number;
  forecast12m: number;
}

export function recommendPrice(
  grade: string,
  entityType: string,
  co2eTonnes: number
): PriceRecommendation {
  // Base USD price per tonne by grade
  const basePriceUsd: Record<string, [number, number]> = {
    S: [35, 65],
    A: [22, 42],
    B: [12, 25],
    C: [5, 15],
    D: [2, 8],
  };

  // Methodology premium
  const methodologyMultiplier: Record<string, number> = {
    biochar:       1.30,  // CCP-eligible, high permanence
    agroforestry:  1.15,
    soil_carbon:   1.10,
    crop_residue:  1.00,
    solar_energy:  0.90,
    ev_fleet:      0.95,
    building:      0.88,
    shipping:      0.85,
    aviation:      0.82,
    city:          0.90,
    individual:    0.70,
  };

  const [baseMin, baseMax] = basePriceUsd[grade] || [5, 15];
  const mult = methodologyMultiplier[entityType] || 1.0;

  const min = Math.round(baseMin * mult * 100) / 100;
  const max = Math.round(baseMax * mult * 100) / 100;
  const mid = Math.round(((min + max) / 2) * 100) / 100;

  return {
    minUsd: min,
    maxUsd: max,
    midUsd: mid,
    pricePerTonne: mid,
    forecast12m: Math.round(mid * 1.18 * 100) / 100, // 18% annual appreciation trend
  };
}

function clamp(v: number): number {
  return Math.min(100, Math.max(0, Math.round(v)));
}
