/**
 * ATMOS Protocol — API Server (Casper Edition)
 * ─────────────────────────────────────────────────────
 * The AI-powered trust and intelligence layer
 * for the global carbon economy.
 *
 * Endpoints:
 *   GET  /api/health              — Health check
 *   GET  /api/stats               — Protocol statistics
 *   POST /api/verify              — Run full MRV pipeline
 *   GET  /api/passport/:id        — Get carbon passport (PUBLIC)
 *   GET  /api/passports           — List all passports
 *   POST /api/passport/:id/retire — Retire a passport
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import { logger } from './utils/logger';
import { runSatelliteAnalysis, type SatelliteResult } from './services/satellite';
import { runAIVerification } from './services/ai';
import { calculateAtmosScore, recommendPrice } from './services/atmos-score';
import {
  createPassport,
  getPassport,
  listPassports,
  retirePassport,
  getProtocolStats,
} from './services/passport';
import {
  createPassportOnCasper,
  retirePassportOnCasper,
  casperHealthCheck,
  getDeployInfo,
} from './services/casper';

const app = express();
const PORT = parseInt(process.env.PORT || '3001');

// ── Middleware ────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Health Check ─────────────────────────────────────
app.get('/api/health', async (_req, res) => {
  const casper = await casperHealthCheck();
  res.json({
    status: 'ok',
    service: 'atmos-casper-backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    casper,
  });
});

// ── Protocol Stats ───────────────────────────────────
app.get('/api/stats', (_req, res) => {
  const stats = getProtocolStats();
  res.json(stats);
});

// ── Full MRV Pipeline ────────────────────────────────
// This is the CORE endpoint. It runs:
//   1. Satellite analysis
//   2. AI verification
//   3. Atmos Score calculation
//   4. Casper passport creation
//   5. Returns the complete passport
app.post('/api/verify', async (req, res) => {
  try {
    const {
      projectName,
      entityType = 'biochar',
      lat = 23.0,
      lng = 72.6,
      areaHa = 5,
      metadata = {},
    } = req.body;

    const projectId = req.body.projectId || `proj_${crypto.randomBytes(6).toString('hex')}`;

    logger.info('MRV Pipeline started', { projectId, entityType, projectName });

    // ── STEP 1: Satellite Analysis ──────────────────
    const satellite: SatelliteResult = await runSatelliteAnalysis({
      projectId,
      lat,
      lng,
      areaHa,
      entityType,
    });

    // ── STEP 2: AI Verification ─────────────────────
    const aiResult = await runAIVerification(
      projectId,
      entityType,
      { ...metadata, areaHa },
      satellite
    );

    // ── STEP 3: Atmos Score ─────────────────────────
    const atmosScore = calculateAtmosScore({
      activityDetection:    aiResult.confidence.activityDetection,
      satelliteConsistency: aiResult.confidence.satelliteConsistency,
      dataQuality:          aiResult.confidence.dataQuality,
      fraudRisk:            aiResult.confidence.fraudRisk,
      methodologyMatch:     aiResult.confidence.methodologyMatch,
      permanenceScore:      aiResult.confidence.permanenceScore,
      coBenefitScore:       aiResult.confidence.coBenefitScore,
      seasonalValidity:     aiResult.confidence.seasonalValidity,
    });

    // ── STEP 4: ZK Proof Hash (simplified) ──────────
    const zkProofHash = 'zk_' + crypto.createHash('sha256')
      .update(JSON.stringify({
        projectId,
        co2e: aiResult.co2eEstimated,
        grade: atmosScore.grade,
        timestamp: Date.now(),
      }))
      .digest('hex')
      .substring(0, 24);

    // Satellite evidence hash
    const satEvidenceHash = crypto.createHash('sha256')
      .update(JSON.stringify({
        ndvi: satellite.ndviCurrent,
        landUse: satellite.landUse,
        fireDetected: satellite.fireDetected,
        imageDate: satellite.imageDate,
      }))
      .digest('hex')
      .substring(0, 24);

    // ── STEP 5: Price Recommendation ────────────────
    const price = recommendPrice(atmosScore.grade, entityType, aiResult.co2eEstimated);

    // ── STEP 6: Create Passport on Casper ───────────
    const casperResult = await createPassportOnCasper({
      projectId,
      projectName: projectName || `${entityType} Project`,
      ownerPublicKeyHex: req.body.ownerPublicKey || '0x' + '0'.repeat(64),
      co2eTonnesKg: Math.round(aiResult.co2eEstimated * 1000),
      atmosScore: atmosScore.score,
      grade: atmosScore.gradeNumeric,
      methodology: aiResult.methodology,
      vintageYear: aiResult.vintageYear,
      confidenceScore: aiResult.confidence.overall,
      fraudRiskScore: Math.round((1 - aiResult.fraud.score) * 100),
      zkProofHash,
      satelliteEvidenceHash: satEvidenceHash,
      verificationTimestamp: Date.now(),
      activityDetection: aiResult.confidence.activityDetection,
      satelliteConsistency: aiResult.confidence.satelliteConsistency,
      dataQuality: aiResult.confidence.dataQuality,
      methodologyMatch: aiResult.confidence.methodologyMatch,
      permanenceScore: aiResult.confidence.permanenceScore,
      coBenefitScore: aiResult.confidence.coBenefitScore,
      entityType,
    });

    // ── STEP 7: Create Local Passport ───────────────
    const passport = createPassport(
      projectId,
      projectName || `${entityType} Project`,
      entityType,
      req.body.ownerPublicKey || 'demo-owner',
      atmosScore,
      {
        co2eEstimated: aiResult.co2eEstimated,
        co2eLowerBound: aiResult.co2eLowerBound,
        co2eUpperBound: aiResult.co2eUpperBound,
        entityType,
        methodology: aiResult.methodology,
        vintageYear: aiResult.vintageYear,
      },
      {
        ndviCurrent: satellite.ndviCurrent,
        ndviBaseline: satellite.ndviBaseline,
        ndviChange: satellite.ndviCurrent - satellite.ndviBaseline,
        landUse: satellite.landUse,
        landConsistency: satellite.landConsistency,
        fireDetected: satellite.fireDetected,
        cloudCoverPct: satellite.cloudCoverPct,
        imageDate: satellite.imageDate,
        biomassTonesPerHa: satellite.biomassTonesPerHa,
        confidenceScore: satellite.confidenceScore,
      },
      zkProofHash,
      price,
      casperResult.deployHash,
      casperResult.casperExplorerUrl,
    );

    logger.info('MRV Pipeline complete', {
      projectId,
      score: atmosScore.score,
      grade: atmosScore.grade,
      co2e: aiResult.co2eEstimated,
      casperDeploy: casperResult.deployHash.slice(0, 12),
    });

    res.json({
      success: true,
      passport,
      pipeline: {
        satellite: {
          ndviCurrent: satellite.ndviCurrent,
          ndviBaseline: satellite.ndviBaseline,
          landUse: satellite.landUse,
          fireDetected: satellite.fireDetected,
          confidence: satellite.confidenceScore,
        },
        ai: {
          co2eEstimated: aiResult.co2eEstimated,
          confidence: aiResult.confidence.overall,
          grade: aiResult.grade,
          fraudRisk: aiResult.fraud.risk,
          fraudSignals: aiResult.fraud.signals,
          methodology: aiResult.methodology,
          analysisSummary: aiResult.analysisSummary,
        },
        atmosScore: {
          score: atmosScore.score,
          grade: atmosScore.grade,
          dimensions: atmosScore.dimensions,
          riskLevel: atmosScore.riskLevel,
          investmentGrade: atmosScore.investmentGrade,
        },
        casper: casperResult,
        zkProofHash,
        price,
      },
    });
  } catch (err: any) {
    logger.error('MRV Pipeline failed', { error: err.message, stack: err.stack });
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

// ── Get Passport (PUBLIC) ────────────────────────────
app.get('/api/passport/:projectId', (req, res) => {
  const passport = getPassport(req.params.projectId);
  if (!passport) {
    return res.status(404).json({ error: 'Passport not found' });
  }
  res.json(passport);
});

// ── List All Passports ───────────────────────────────
app.get('/api/passports', (_req, res) => {
  res.json(listPassports());
});

// ── Retire Passport ──────────────────────────────────
app.post('/api/passport/:projectId/retire', async (req, res) => {
  const { projectId } = req.params;
  const { organisation = 'Unknown', esgReference = '' } = req.body;

  // Retire on Casper
  const casperResult = await retirePassportOnCasper(
    projectId,
    organisation,
    esgReference
  );

  // Retire locally
  const passport = retirePassport(
    projectId,
    req.body.retiredBy || 'demo-user',
    organisation,
    casperResult.deployHash,
  );

  if (!passport) {
    return res.status(404).json({ error: 'Passport not found' });
  }

  res.json({ success: true, passport, casperDeploy: casperResult });
});

// ── Get Casper Deploy Info ───────────────────────────
app.get('/api/deploy/:hash', async (req, res) => {
  const info = await getDeployInfo(req.params.hash);
  res.json(info);
});

// ── Start Server ─────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    logger.info(\`ATMOS API Server running on port \${PORT}\`);
  });
}

export default app;
