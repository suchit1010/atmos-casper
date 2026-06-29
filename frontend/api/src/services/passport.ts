/**
 * ATMOS Carbon Passport Service
 * ─────────────────────────────────────────────────────
 * The Passport is the public-facing identity of every climate asset.
 * 
 * Think:
 *   Car → VIN Number
 *   Human → Passport
 *   Carbon Asset → Atmos Passport
 *
 * Every passport bundles:
 *   - Atmos Score™ with dimension breakdown
 *   - AI verification results
 *   - Satellite evidence summary
 *   - ZK proof hash
 *   - Casper blockchain proof (deploy hash)
 *   - Full verification history
 *
 * Public URL: /api/passport/:projectId
 * Anyone can verify any carbon asset. No login required.
 */

import crypto from 'crypto';
import { logger } from '../utils/logger';
import { AtmosScoreResult, PriceRecommendation } from './atmos-score';

// ── In-memory passport store (demo) ──────────────────────
// In production: PostgreSQL + Casper chain as source of truth
const passportStore = new Map<string, AtmosPassport>();

// ── Types ────────────────────────────────────────────────
export interface SatelliteEvidence {
  ndviCurrent: number;
  ndviBaseline: number;
  ndviChange: number;
  landUse: string;
  landConsistency: string;
  fireDetected: boolean;
  cloudCoverPct: number;
  imageDate: string;
  biomassTonesPerHa: number;
  confidenceScore: number;
}

export interface VerificationResult {
  co2eEstimated: number;
  co2eLowerBound: number;
  co2eUpperBound: number;
  entityType: string;
  methodology: string;
  vintageYear: number;
  analysisSummary?: string;
}

export interface HistoryEntry {
  timestamp: number;
  event: string;
  details: string;
  casperDeployHash?: string;
}

export interface AtmosPassport {
  // Identity
  passportId: string;           // Unique passport identifier
  projectId: string;
  projectName: string;
  entityType: string;
  owner: string;
  createdAt: number;

  // The Score™
  atmosScore: AtmosScoreResult;

  // Verification
  verification: VerificationResult;
  satellite: SatelliteEvidence;
  zkProofHash: string;

  // Pricing
  price: PriceRecommendation;

  // Blockchain
  casperDeployHash: string;
  casperExplorerUrl: string;

  // State
  retired: boolean;
  retiredAt: number | null;
  retiredBy: string | null;
  retirementOrg: string | null;

  // History
  history: HistoryEntry[];

  // Public URL
  publicUrl: string;
  qrCodeData: string;
}

// ── Generate Passport ID ─────────────────────────────────
function generatePassportId(projectId: string): string {
  const hash = crypto.createHash('sha256')
    .update(`atmos_passport_${projectId}_${Date.now()}`)
    .digest('hex')
    .substring(0, 12);
  return `ATMOS-${hash.toUpperCase()}`;
}

// ── Create Passport ──────────────────────────────────────
export function createPassport(
  projectId: string,
  projectName: string,
  entityType: string,
  owner: string,
  atmosScore: AtmosScoreResult,
  verification: VerificationResult,
  satellite: SatelliteEvidence,
  zkProofHash: string,
  price: PriceRecommendation,
  casperDeployHash: string,
  casperExplorerUrl: string,
): AtmosPassport {
  const passportId = generatePassportId(projectId);
  const now = Date.now();
  const baseUrl = process.env.PUBLIC_URL || 'https://atmos-casper.vercel.app';

  const passport: AtmosPassport = {
    passportId,
    projectId,
    projectName,
    entityType,
    owner,
    createdAt: now,
    atmosScore,
    verification,
    satellite,
    zkProofHash,
    price,
    casperDeployHash,
    casperExplorerUrl,
    retired: false,
    retiredAt: null,
    retiredBy: null,
    retirementOrg: null,
    history: [
      {
        timestamp: now,
        event: 'passport_created',
        details: `Atmos Passport ${passportId} created. Score: ${atmosScore.score}/100 (Grade ${atmosScore.grade}). CO2e: ${verification.co2eEstimated} tonnes. Methodology: ${verification.methodology}.`,
        casperDeployHash,
      },
    ],
    publicUrl: `${baseUrl}/passport/${projectId}`,
    qrCodeData: JSON.stringify({
      type: 'atmos_passport',
      id: passportId,
      project: projectId,
      score: atmosScore.score,
      grade: atmosScore.grade,
      co2e: verification.co2eEstimated,
      casper: casperDeployHash,
      verify: `${baseUrl}/api/passport/${projectId}`,
    }),
  };

  // Store
  passportStore.set(projectId, passport);

  logger.info('Atmos Passport created', {
    passportId,
    projectId,
    score: atmosScore.score,
    grade: atmosScore.grade,
  });

  return passport;
}

// ── Get Passport ─────────────────────────────────────────
export function getPassport(projectId: string): AtmosPassport | null {
  return passportStore.get(projectId) || null;
}

// ── List All Passports ───────────────────────────────────
export function listPassports(): AtmosPassport[] {
  return Array.from(passportStore.values())
    .sort((a, b) => b.createdAt - a.createdAt);
}

// ── Retire Passport ──────────────────────────────────────
export function retirePassport(
  projectId: string,
  retiredBy: string,
  organisation: string,
  casperDeployHash: string,
): AtmosPassport | null {
  const passport = passportStore.get(projectId);
  if (!passport) return null;
  if (passport.retired) return passport;

  const now = Date.now();
  passport.retired = true;
  passport.retiredAt = now;
  passport.retiredBy = retiredBy;
  passport.retirementOrg = organisation;

  passport.history.push({
    timestamp: now,
    event: 'passport_retired',
    details: `Passport retired by ${organisation}. ${passport.verification.co2eEstimated} tonnes CO2e permanently offset.`,
    casperDeployHash,
  });

  logger.info('Passport retired', { projectId, organisation });
  return passport;
}

// ── Add History Entry ────────────────────────────────────
export function addHistoryEntry(
  projectId: string,
  event: string,
  details: string,
  casperDeployHash?: string,
): boolean {
  const passport = passportStore.get(projectId);
  if (!passport) return false;

  passport.history.push({
    timestamp: Date.now(),
    event,
    details,
    casperDeployHash,
  });

  return true;
}

// ── Protocol Stats ───────────────────────────────────────
export function getProtocolStats(): {
  totalPassports: number;
  totalCo2eKg: number;
  totalRetired: number;
  averageScore: number;
  gradeDistribution: Record<string, number>;
} {
  const passports = Array.from(passportStore.values());
  const totalCo2eKg = passports.reduce(
    (sum, p) => sum + Math.round(p.verification.co2eEstimated * 1000),
    0
  );
  const totalRetired = passports.filter(p => p.retired).length;
  const averageScore = passports.length > 0
    ? Math.round(passports.reduce((sum, p) => sum + p.atmosScore.score, 0) / passports.length)
    : 0;

  const gradeDistribution: Record<string, number> = { S: 0, A: 0, B: 0, C: 0, D: 0 };
  passports.forEach(p => {
    gradeDistribution[p.atmosScore.grade] = (gradeDistribution[p.atmosScore.grade] || 0) + 1;
  });

  return {
    totalPassports: passports.length,
    totalCo2eKg,
    totalRetired,
    averageScore,
    gradeDistribution,
  };
}
