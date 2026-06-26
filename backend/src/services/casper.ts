/**
 * ATMOS Casper Blockchain Service
 * ─────────────────────────────────────────────────────
 * Integrates with Casper Network to:
 *   1. Deploy Atmos Passport contract
 *   2. Create passport entries for verified projects
 *   3. Retire passports for ESG compliance
 *   4. Update Atmos Scores on re-verification
 *   5. Query protocol stats and passport data
 *
 * Casper advantages for carbon passports:
 *   - Enterprise-grade PoS with validator accountability
 *   - Upgradeable contracts via contract packages
 *   - Named keys for human-readable storage
 *   - Predictable gas costs for MRV operations
 *   - Highway consensus for finality guarantees
 */

import {
  CasperClient,
  CLPublicKey,
  CLValueBuilder,
  DeployUtil,
  RuntimeArgs,
  Contracts,
  Keys,
  CLAccountHash,
  CLString,
  CLU8,
  CLU64,
  CLBool,
  decodeBase16,
} from 'casper-js-sdk';
import crypto from 'crypto';
import { logger } from '../utils/logger';

// ── Configuration ────────────────────────────────────────
const CASPER_NODE_URL = process.env.CASPER_NODE_URL || 'https://rpc.testnet.casperlabs.io/rpc';
const CASPER_CHAIN_NAME = process.env.CASPER_CHAIN_NAME || 'casper-test';
const CONTRACT_HASH = process.env.ATMOS_CONTRACT_HASH || '';
const DEPLOY_GAS = 50_000_000_000; // 50 CSPR for contract calls
const DEPLOY_TTL = 1_800_000;       // 30 minutes

// ── Client singleton ─────────────────────────────────────
let casperClient: CasperClient;

function getClient(): CasperClient {
  if (!casperClient) {
    casperClient = new CasperClient(CASPER_NODE_URL);
    logger.info('Casper client initialized', { node: CASPER_NODE_URL, chain: CASPER_CHAIN_NAME });
  }
  return casperClient;
}

// ── Keypair management ───────────────────────────────────
let deployerKeys: Keys.AsymmetricKey | null = null;

function getDeployerKeys(): Keys.AsymmetricKey {
  if (!deployerKeys) {
    const secretKeyHex = process.env.CASPER_SECRET_KEY_HEX;
    if (secretKeyHex) {
      try {
        deployerKeys = Keys.Ed25519.parseKeyPair(
          Buffer.from(secretKeyHex, 'hex').subarray(32),
          Buffer.from(secretKeyHex, 'hex')
        );
        logger.info('Casper deployer keys loaded', {
          publicKey: deployerKeys.publicKey.toHex(),
        });
      } catch {
        logger.warn('Invalid CASPER_SECRET_KEY_HEX — using ephemeral keys');
        deployerKeys = Keys.Ed25519.new();
      }
    } else {
      deployerKeys = Keys.Ed25519.new();
      logger.warn('No CASPER_SECRET_KEY_HEX — using ephemeral keys (demo only)', {
        publicKey: deployerKeys.publicKey.toHex(),
      });
    }
  }
  return deployerKeys;
}

// ── Mock result for demo mode ────────────────────────────
function mockDeployHash(): string {
  return crypto.randomBytes(24).toString('hex') + '-demo-mock';
}

function isDemoMode(): boolean {
  return !CONTRACT_HASH || CONTRACT_HASH === '';
}

// ── Types ────────────────────────────────────────────────
export interface CreatePassportInput {
  projectId: string;
  projectName: string;
  ownerPublicKeyHex: string;
  co2eTonnesKg: number;
  atmosScore: number;
  grade: number;
  methodology: string;
  vintageYear: number;
  confidenceScore: number;
  fraudRiskScore: number;
  zkProofHash: string;
  satelliteEvidenceHash: string;
  verificationTimestamp: number;
  activityDetection: number;
  satelliteConsistency: number;
  dataQuality: number;
  methodologyMatch: number;
  permanenceScore: number;
  coBenefitScore: number;
  entityType: string;
}

export interface PassportDeployResult {
  deployHash: string;
  projectId: string;
  atmosScore: number;
  status: 'submitted' | 'mock';
  casperExplorerUrl: string;
}

export interface RetireResult {
  deployHash: string;
  projectId: string;
  status: 'submitted' | 'mock';
}

// ── Create Passport on Casper ────────────────────────────
export async function createPassportOnCasper(
  input: CreatePassportInput
): Promise<PassportDeployResult> {
  logger.info('Creating passport on Casper', {
    projectId: input.projectId,
    atmosScore: input.atmosScore,
    co2eKg: input.co2eTonnesKg,
  });

  // Demo mode — return mock
  if (isDemoMode()) {
    const hash = mockDeployHash();
    logger.info('Demo mode — returning mock deploy hash', { deployHash: hash });
    return {
      deployHash: hash,
      projectId: input.projectId,
      atmosScore: input.atmosScore,
      status: 'mock',
      casperExplorerUrl: `https://testnet.cspr.live/deploy/${hash}`,
    };
  }

  const client = getClient();
  const keys = getDeployerKeys();

  // Build runtime args
  const args = RuntimeArgs.fromMap({
    project_id: CLValueBuilder.string(input.projectId),
    project_name: CLValueBuilder.string(input.projectName),
    owner: CLValueBuilder.byteArray(
      decodeBase16(input.ownerPublicKeyHex.length === 66
        ? input.ownerPublicKeyHex.slice(2)
        : input.ownerPublicKeyHex)
    ),
    co2e_tonnes_kg: CLValueBuilder.u64(input.co2eTonnesKg),
    atmos_score: CLValueBuilder.u8(input.atmosScore),
    grade: CLValueBuilder.u8(input.grade),
    methodology: CLValueBuilder.string(input.methodology),
    vintage_year: CLValueBuilder.u64(input.vintageYear),
    confidence_score: CLValueBuilder.u8(input.confidenceScore),
    fraud_risk_score: CLValueBuilder.u8(input.fraudRiskScore),
    zk_proof_hash: CLValueBuilder.string(input.zkProofHash),
    satellite_evidence_hash: CLValueBuilder.string(input.satelliteEvidenceHash),
    verification_timestamp: CLValueBuilder.u64(input.verificationTimestamp),
    activity_detection: CLValueBuilder.u8(input.activityDetection),
    satellite_consistency: CLValueBuilder.u8(input.satelliteConsistency),
    data_quality: CLValueBuilder.u8(input.dataQuality),
    methodology_match: CLValueBuilder.u8(input.methodologyMatch),
    permanence_score: CLValueBuilder.u8(input.permanenceScore),
    co_benefit_score: CLValueBuilder.u8(input.coBenefitScore),
    entity_type: CLValueBuilder.string(input.entityType),
  });

  // Build deploy
  const contractHashBytes = Contracts.contractHashToByteArray(CONTRACT_HASH);
  const deploy = DeployUtil.makeDeploy(
    new DeployUtil.DeployParams(keys.publicKey, CASPER_CHAIN_NAME, 1, DEPLOY_TTL),
    DeployUtil.ExecutableDeployItem.newStoredContractByHash(
      contractHashBytes,
      'create_passport',
      args
    ),
    DeployUtil.standardPayment(DEPLOY_GAS)
  );

  // Sign and send
  const signedDeploy = DeployUtil.signDeploy(deploy, keys);

  try {
    const result = await client.putDeploy(signedDeploy);
    logger.info('Passport deploy submitted to Casper', { deployHash: result });

    return {
      deployHash: result,
      projectId: input.projectId,
      atmosScore: input.atmosScore,
      status: 'submitted',
      casperExplorerUrl: `https://testnet.cspr.live/deploy/${result}`,
    };
  } catch (err: any) {
    logger.error('Casper deploy failed', { error: err.message });
    // Return mock for demo resilience
    const hash = mockDeployHash();
    return {
      deployHash: hash,
      projectId: input.projectId,
      atmosScore: input.atmosScore,
      status: 'mock',
      casperExplorerUrl: `https://testnet.cspr.live/deploy/${hash}`,
    };
  }
}

// ── Retire Passport on Casper ────────────────────────────
export async function retirePassportOnCasper(
  projectId: string,
  organisation: string,
  esgReference: string
): Promise<RetireResult> {
  logger.info('Retiring passport on Casper', { projectId, organisation });

  if (isDemoMode()) {
    return {
      deployHash: mockDeployHash(),
      projectId,
      status: 'mock',
    };
  }

  const client = getClient();
  const keys = getDeployerKeys();

  const args = RuntimeArgs.fromMap({
    project_id: CLValueBuilder.string(projectId),
    organisation: CLValueBuilder.string(organisation),
    esg_reference: CLValueBuilder.string(esgReference),
    timestamp: CLValueBuilder.u64(Date.now()),
  });

  const contractHashBytes = Contracts.contractHashToByteArray(CONTRACT_HASH);
  const deploy = DeployUtil.makeDeploy(
    new DeployUtil.DeployParams(keys.publicKey, CASPER_CHAIN_NAME, 1, DEPLOY_TTL),
    DeployUtil.ExecutableDeployItem.newStoredContractByHash(
      contractHashBytes,
      'retire_passport',
      args
    ),
    DeployUtil.standardPayment(DEPLOY_GAS)
  );

  const signedDeploy = DeployUtil.signDeploy(deploy, keys);

  try {
    const result = await client.putDeploy(signedDeploy);
    return { deployHash: result, projectId, status: 'submitted' };
  } catch (err: any) {
    logger.error('Casper retire failed', { error: err.message });
    return { deployHash: mockDeployHash(), projectId, status: 'mock' };
  }
}

// ── Health Check ─────────────────────────────────────────
export async function casperHealthCheck(): Promise<{
  ok: boolean;
  network: string;
  latestBlock: string;
}> {
  try {
    const client = getClient();
    const info = await client.nodeClient.getStatus();
    return {
      ok: true,
      network: CASPER_CHAIN_NAME,
      latestBlock: info.last_added_block_info?.hash || 'unknown',
    };
  } catch {
    return { ok: false, network: CASPER_CHAIN_NAME, latestBlock: 'unreachable' };
  }
}

// ── Get Deploy Info ──────────────────────────────────────
export async function getDeployInfo(deployHash: string): Promise<{
  status: 'success' | 'failed' | 'pending' | 'not_found';
  cost: string;
  blockHash: string;
}> {
  try {
    const client = getClient();
    const result = await client.nodeClient.getDeployInfo(deployHash);

    const execResult = result.execution_results?.[0];
    if (!execResult) {
      return { status: 'pending', cost: '0', blockHash: '' };
    }

    const isSuccess = 'Success' in execResult.result;
    return {
      status: isSuccess ? 'success' : 'failed',
      cost: isSuccess
        ? (execResult.result as any).Success?.cost || '0'
        : '0',
      blockHash: execResult.block_hash || '',
    };
  } catch {
    return { status: 'not_found', cost: '0', blockHash: '' };
  }
}
