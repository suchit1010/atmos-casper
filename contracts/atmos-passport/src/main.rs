#![no_std]
#![no_main]

/// ATMOS Protocol — Carbon Passport Smart Contract (Casper)
/// =========================================================
/// Every verified climate asset gets an immutable digital passport
/// stored on the Casper blockchain. The passport contains:
///   - Atmos Score™ (0-100 composite trust score)
///   - AI verification results (CO2e, confidence, grade, fraud risk)
///   - Satellite evidence hash (Sentinel-2 NDVI + imagery)
///   - ZK proof hash (privacy-preserving verification proof)
///   - Full verification history (immutable audit trail)
///   - Ownership + retirement status
///
/// Why Casper?
///   - Enterprise-grade: Weighted PoS with validator accountability
///   - Upgradeable contracts: Future-proof for evolving methodologies
///   - Named keys: Human-readable on-chain storage
///   - Predictable gas costs: Critical for high-volume MRV operations
///   - Highway consensus: Finality guarantees for regulatory compliance

extern crate alloc;

use alloc::string::{String, ToString};
use alloc::vec;
use alloc::vec::Vec;
use alloc::format;

use casper_contract::{
    contract_api::{runtime, storage},
    unwrap_or_revert::UnwrapOrRevert,
};
use casper_types::{
    ApiError, CLType, CLValue, EntryPoint, EntryPointAccess, EntryPointType,
    EntryPoints, Key, Parameter, RuntimeArgs, URef, U256, U512,
    account::AccountHash,
    contracts::NamedKeys,
};

// ── Error Codes ──────────────────────────────────────────
#[repr(u16)]
enum AtmosError {
    AlreadyRetired = 1,
    InvalidScore = 2,
    NotAuthorized = 3,
    PassportNotFound = 4,
    InvalidGrade = 5,
    ProtocolPaused = 6,
    InvalidAmount = 7,
    DuplicatePassport = 8,
}

impl From<AtmosError> for ApiError {
    fn from(e: AtmosError) -> Self {
        ApiError::User(e as u16)
    }
}

// ── Storage Key Constants ────────────────────────────────
const CONTRACT_KEY: &str = "atmos_passport_contract";
const CONTRACT_HASH_KEY: &str = "atmos_passport_contract_hash";
const CONTRACT_PACKAGE_KEY: &str = "atmos_passport_package";
const ADMIN_KEY: &str = "admin";
const PAUSED_KEY: &str = "paused";
const TOTAL_PASSPORTS_KEY: &str = "total_passports";
const TOTAL_CO2E_KG_KEY: &str = "total_co2e_kg";
const TOTAL_RETIRED_KEY: &str = "total_retired";
const PASSPORT_COUNT_KEY: &str = "passport_count";

// ── Grade Constants ──────────────────────────────────────
const GRADE_S: u8 = 4;
const GRADE_A: u8 = 3;
const GRADE_B: u8 = 2;
const GRADE_C: u8 = 1;
const GRADE_D: u8 = 0;

// ── Helper: Build passport dictionary key ────────────────
fn passport_key(project_id: &str) -> String {
    format!("passport_{}", project_id)
}

fn history_key(project_id: &str) -> String {
    format!("history_{}", project_id)
}

fn history_count_key(project_id: &str) -> String {
    format!("history_count_{}", project_id)
}

// ── Entry Point: Initialize ──────────────────────────────
/// Called once at deploy. Sets up admin and protocol counters.
#[no_mangle]
pub extern "C" fn init() {
    let admin: AccountHash = runtime::get_named_arg("admin");

    // Store admin
    let admin_uref = storage::new_uref(admin);
    runtime::put_key(ADMIN_KEY, admin_uref.into());

    // Protocol counters
    let total_passports_uref = storage::new_uref(0u64);
    runtime::put_key(TOTAL_PASSPORTS_KEY, total_passports_uref.into());

    let total_co2e_uref = storage::new_uref(0u64);
    runtime::put_key(TOTAL_CO2E_KG_KEY, total_co2e_uref.into());

    let total_retired_uref = storage::new_uref(0u64);
    runtime::put_key(TOTAL_RETIRED_KEY, total_retired_uref.into());

    let paused_uref = storage::new_uref(false);
    runtime::put_key(PAUSED_KEY, paused_uref.into());
}

// ── Entry Point: Create Passport ─────────────────────────
/// Creates a new Atmos Passport for a verified carbon project.
/// Called by the backend after the full MRV pipeline completes:
///   Satellite → AI Verification → ZK Proof → Casper Passport
///
/// Stores rich metadata on-chain that makes each carbon asset
/// independently verifiable by anyone, anywhere.
#[no_mangle]
pub extern "C" fn create_passport() {
    // Check not paused
    let paused_uref: URef = runtime::get_key(PAUSED_KEY)
        .unwrap_or_revert_with(ApiError::MissingKey)
        .into_uref()
        .unwrap_or_revert();
    let paused: bool = storage::read(paused_uref)
        .unwrap_or_revert()
        .unwrap_or_revert();
    if paused {
        runtime::revert(AtmosError::ProtocolPaused);
    }

    // Read arguments
    let project_id: String = runtime::get_named_arg("project_id");
    let project_name: String = runtime::get_named_arg("project_name");
    let owner: AccountHash = runtime::get_named_arg("owner");

    // Carbon data
    let co2e_tonnes_kg: u64 = runtime::get_named_arg("co2e_tonnes_kg");
    let atmos_score: u8 = runtime::get_named_arg("atmos_score");
    let grade: u8 = runtime::get_named_arg("grade");
    let methodology: String = runtime::get_named_arg("methodology");
    let vintage_year: u64 = runtime::get_named_arg("vintage_year");

    // Verification provenance
    let confidence_score: u8 = runtime::get_named_arg("confidence_score");
    let fraud_risk_score: u8 = runtime::get_named_arg("fraud_risk_score");
    let zk_proof_hash: String = runtime::get_named_arg("zk_proof_hash");
    let satellite_evidence_hash: String = runtime::get_named_arg("satellite_evidence_hash");
    let verification_timestamp: u64 = runtime::get_named_arg("verification_timestamp");

    // AI analysis dimensions
    let activity_detection: u8 = runtime::get_named_arg("activity_detection");
    let satellite_consistency: u8 = runtime::get_named_arg("satellite_consistency");
    let data_quality: u8 = runtime::get_named_arg("data_quality");
    let methodology_match: u8 = runtime::get_named_arg("methodology_match");
    let permanence_score: u8 = runtime::get_named_arg("permanence_score");
    let co_benefit_score: u8 = runtime::get_named_arg("co_benefit_score");

    // Entity type
    let entity_type: String = runtime::get_named_arg("entity_type");

    // Validate
    if co2e_tonnes_kg == 0 {
        runtime::revert(AtmosError::InvalidAmount);
    }
    if atmos_score > 100 {
        runtime::revert(AtmosError::InvalidScore);
    }
    if grade > GRADE_S {
        runtime::revert(AtmosError::InvalidGrade);
    }

    // Check no duplicate
    let p_key = passport_key(&project_id);
    if runtime::has_key(&p_key) {
        runtime::revert(AtmosError::DuplicatePassport);
    }

    // ── Store passport data as named keys ────────────────
    // Each field stored separately for efficient on-chain querying
    let prefix = format!("p_{}_", project_id);

    // Identity
    storage_put(&format!("{}name", prefix), project_name);
    storage_put(&format!("{}owner", prefix), owner);
    storage_put(&format!("{}entity_type", prefix), entity_type);

    // Carbon data
    storage_put(&format!("{}co2e_kg", prefix), co2e_tonnes_kg);
    storage_put(&format!("{}atmos_score", prefix), atmos_score);
    storage_put(&format!("{}grade", prefix), grade);
    storage_put(&format!("{}methodology", prefix), methodology);
    storage_put(&format!("{}vintage_year", prefix), vintage_year);

    // Verification
    storage_put(&format!("{}confidence", prefix), confidence_score);
    storage_put(&format!("{}fraud_risk", prefix), fraud_risk_score);
    storage_put(&format!("{}zk_proof_hash", prefix), zk_proof_hash.clone());
    storage_put(&format!("{}sat_evidence", prefix), satellite_evidence_hash.clone());
    storage_put(&format!("{}verified_at", prefix), verification_timestamp);

    // AI dimensions
    storage_put(&format!("{}ai_activity", prefix), activity_detection);
    storage_put(&format!("{}ai_sat_consistency", prefix), satellite_consistency);
    storage_put(&format!("{}ai_data_quality", prefix), data_quality);
    storage_put(&format!("{}ai_methodology", prefix), methodology_match);
    storage_put(&format!("{}ai_permanence", prefix), permanence_score);
    storage_put(&format!("{}ai_cobenefit", prefix), co_benefit_score);

    // State
    storage_put(&format!("{}retired", prefix), false);
    storage_put(&format!("{}retired_by", prefix), String::new());
    storage_put(&format!("{}retired_at", prefix), 0u64);
    storage_put(&format!("{}retirement_org", prefix), String::new());

    // Mark passport as existing
    storage_put(&p_key, true);

    // Initialize history counter
    storage_put(&history_count_key(&project_id), 0u64);

    // Store first history entry: "created"
    append_history(
        &project_id,
        "created",
        &format!(
            "Passport created. Score: {}, Grade: {}, CO2e: {}kg, ZK: {}, Satellite: {}",
            atmos_score,
            grade_to_str(grade),
            co2e_tonnes_kg,
            &zk_proof_hash[..core::cmp::min(12, zk_proof_hash.len())],
            &satellite_evidence_hash[..core::cmp::min(12, satellite_evidence_hash.len())]
        ),
        verification_timestamp,
    );

    // Update protocol counters
    increment_counter(TOTAL_PASSPORTS_KEY, 1);
    increment_counter(TOTAL_CO2E_KG_KEY, co2e_tonnes_kg);
}

// ── Entry Point: Retire Passport ─────────────────────────
/// Permanently retires a carbon passport. Irreversible.
/// Records the retiring organization for ESG/BRSR compliance.
#[no_mangle]
pub extern "C" fn retire_passport() {
    let project_id: String = runtime::get_named_arg("project_id");
    let organisation: String = runtime::get_named_arg("organisation");
    let esg_reference: String = runtime::get_named_arg("esg_reference");
    let timestamp: u64 = runtime::get_named_arg("timestamp");

    let prefix = format!("p_{}_", project_id);

    // Check exists
    let p_key = passport_key(&project_id);
    if !runtime::has_key(&p_key) {
        runtime::revert(AtmosError::PassportNotFound);
    }

    // Check not already retired
    let retired_uref: URef = runtime::get_key(&format!("{}retired", prefix))
        .unwrap_or_revert_with(ApiError::MissingKey)
        .into_uref()
        .unwrap_or_revert();
    let retired: bool = storage::read(retired_uref)
        .unwrap_or_revert()
        .unwrap_or_revert();
    if retired {
        runtime::revert(AtmosError::AlreadyRetired);
    }

    let caller = runtime::get_caller();

    // Update retirement state
    storage::write(retired_uref, true);

    let retired_by_uref: URef = runtime::get_key(&format!("{}retired_by", prefix))
        .unwrap_or_revert()
        .into_uref()
        .unwrap_or_revert();
    storage::write(retired_by_uref, caller.to_string());

    let retired_at_uref: URef = runtime::get_key(&format!("{}retired_at", prefix))
        .unwrap_or_revert()
        .into_uref()
        .unwrap_or_revert();
    storage::write(retired_at_uref, timestamp);

    let org_uref: URef = runtime::get_key(&format!("{}retirement_org", prefix))
        .unwrap_or_revert()
        .into_uref()
        .unwrap_or_revert();
    storage::write(org_uref, organisation.clone());

    // Read CO2e for counter update
    let co2e_uref: URef = runtime::get_key(&format!("{}co2e_kg", prefix))
        .unwrap_or_revert()
        .into_uref()
        .unwrap_or_revert();
    let co2e_kg: u64 = storage::read(co2e_uref)
        .unwrap_or_revert()
        .unwrap_or_revert();

    // History entry
    append_history(
        &project_id,
        "retired",
        &format!(
            "Passport retired by {} for ESG ref: {}. {} kg CO2e permanently offset.",
            organisation, esg_reference, co2e_kg
        ),
        timestamp,
    );

    // Update protocol counter
    increment_counter(TOTAL_RETIRED_KEY, co2e_kg);
}

// ── Entry Point: Update Score ────────────────────────────
/// Updates the Atmos Score after re-verification.
/// Score changes are recorded in the immutable history.
#[no_mangle]
pub extern "C" fn update_score() {
    let project_id: String = runtime::get_named_arg("project_id");
    let new_score: u8 = runtime::get_named_arg("new_score");
    let new_grade: u8 = runtime::get_named_arg("new_grade");
    let reason: String = runtime::get_named_arg("reason");
    let timestamp: u64 = runtime::get_named_arg("timestamp");

    if new_score > 100 {
        runtime::revert(AtmosError::InvalidScore);
    }
    if new_grade > GRADE_S {
        runtime::revert(AtmosError::InvalidGrade);
    }

    let prefix = format!("p_{}_", project_id);

    // Check exists
    if !runtime::has_key(&passport_key(&project_id)) {
        runtime::revert(AtmosError::PassportNotFound);
    }

    // Read old score for history
    let score_uref: URef = runtime::get_key(&format!("{}atmos_score", prefix))
        .unwrap_or_revert()
        .into_uref()
        .unwrap_or_revert();
    let old_score: u8 = storage::read(score_uref)
        .unwrap_or_revert()
        .unwrap_or_revert();

    // Update
    storage::write(score_uref, new_score);

    let grade_uref: URef = runtime::get_key(&format!("{}grade", prefix))
        .unwrap_or_revert()
        .into_uref()
        .unwrap_or_revert();
    storage::write(grade_uref, new_grade);

    // History
    append_history(
        &project_id,
        "score_updated",
        &format!(
            "Atmos Score: {} → {}. Grade: {}. Reason: {}",
            old_score, new_score, grade_to_str(new_grade), reason
        ),
        timestamp,
    );
}

// ── Entry Point: Pause / Unpause ─────────────────────────
#[no_mangle]
pub extern "C" fn set_paused() {
    // Only admin can pause
    let admin_uref: URef = runtime::get_key(ADMIN_KEY)
        .unwrap_or_revert()
        .into_uref()
        .unwrap_or_revert();
    let admin: AccountHash = storage::read(admin_uref)
        .unwrap_or_revert()
        .unwrap_or_revert();

    if runtime::get_caller() != admin {
        runtime::revert(AtmosError::NotAuthorized);
    }

    let paused_value: bool = runtime::get_named_arg("paused");
    let paused_uref: URef = runtime::get_key(PAUSED_KEY)
        .unwrap_or_revert()
        .into_uref()
        .unwrap_or_revert();
    storage::write(paused_uref, paused_value);
}

// ── Entry Point: Get Protocol Stats ──────────────────────
#[no_mangle]
pub extern "C" fn get_protocol_stats() {
    let total_passports = read_counter(TOTAL_PASSPORTS_KEY);
    let total_co2e = read_counter(TOTAL_CO2E_KG_KEY);
    let total_retired = read_counter(TOTAL_RETIRED_KEY);

    // Return as named values via runtime::ret
    let result = format!(
        "{{\"total_passports\":{},\"total_co2e_kg\":{},\"total_retired_kg\":{}}}",
        total_passports, total_co2e, total_retired
    );
    runtime::ret(CLValue::from_t(result).unwrap_or_revert());
}

// ── Helper Functions ─────────────────────────────────────

fn storage_put<T: casper_types::CLTyped + casper_types::bytesrepr::ToBytes>(
    key: &str,
    value: T,
) {
    let uref = storage::new_uref(value);
    runtime::put_key(key, uref.into());
}

fn increment_counter(key: &str, amount: u64) {
    let uref: URef = runtime::get_key(key)
        .unwrap_or_revert()
        .into_uref()
        .unwrap_or_revert();
    let current: u64 = storage::read(uref)
        .unwrap_or_revert()
        .unwrap_or_revert();
    storage::write(uref, current + amount);
}

fn read_counter(key: &str) -> u64 {
    let uref: URef = runtime::get_key(key)
        .unwrap_or_revert()
        .into_uref()
        .unwrap_or_revert();
    storage::read(uref)
        .unwrap_or_revert()
        .unwrap_or_revert()
}

fn append_history(project_id: &str, event_type: &str, details: &str, timestamp: u64) {
    let count_key = history_count_key(project_id);
    let count_uref: URef = runtime::get_key(&count_key)
        .unwrap_or_revert()
        .into_uref()
        .unwrap_or_revert();
    let count: u64 = storage::read(count_uref)
        .unwrap_or_revert()
        .unwrap_or_revert();

    // Store history entry
    let entry_key = format!("h_{}_{}", project_id, count);
    let entry = format!(
        "{{\"index\":{},\"event\":\"{}\",\"details\":\"{}\",\"timestamp\":{}}}",
        count, event_type, details, timestamp
    );
    storage_put(&entry_key, entry);

    // Increment counter
    storage::write(count_uref, count + 1);
}

fn grade_to_str(grade: u8) -> &'static str {
    match grade {
        4 => "S",
        3 => "A",
        2 => "B",
        1 => "C",
        _ => "D",
    }
}

// ── Contract Installation ────────────────────────────────
/// Installs the Atmos Passport contract on Casper.
/// Defines all entry points and their parameters.
#[no_mangle]
pub extern "C" fn call() {
    let mut entry_points = EntryPoints::new();

    // init
    entry_points.add_entry_point(EntryPoint::new(
        "init",
        vec![Parameter::new("admin", CLType::ByteArray(32))],
        CLType::Unit,
        EntryPointAccess::Public,
        EntryPointType::Contract,
    ));

    // create_passport
    entry_points.add_entry_point(EntryPoint::new(
        "create_passport",
        vec![
            Parameter::new("project_id", CLType::String),
            Parameter::new("project_name", CLType::String),
            Parameter::new("owner", CLType::ByteArray(32)),
            Parameter::new("co2e_tonnes_kg", CLType::U64),
            Parameter::new("atmos_score", CLType::U8),
            Parameter::new("grade", CLType::U8),
            Parameter::new("methodology", CLType::String),
            Parameter::new("vintage_year", CLType::U64),
            Parameter::new("confidence_score", CLType::U8),
            Parameter::new("fraud_risk_score", CLType::U8),
            Parameter::new("zk_proof_hash", CLType::String),
            Parameter::new("satellite_evidence_hash", CLType::String),
            Parameter::new("verification_timestamp", CLType::U64),
            Parameter::new("activity_detection", CLType::U8),
            Parameter::new("satellite_consistency", CLType::U8),
            Parameter::new("data_quality", CLType::U8),
            Parameter::new("methodology_match", CLType::U8),
            Parameter::new("permanence_score", CLType::U8),
            Parameter::new("co_benefit_score", CLType::U8),
            Parameter::new("entity_type", CLType::String),
        ],
        CLType::Unit,
        EntryPointAccess::Public,
        EntryPointType::Contract,
    ));

    // retire_passport
    entry_points.add_entry_point(EntryPoint::new(
        "retire_passport",
        vec![
            Parameter::new("project_id", CLType::String),
            Parameter::new("organisation", CLType::String),
            Parameter::new("esg_reference", CLType::String),
            Parameter::new("timestamp", CLType::U64),
        ],
        CLType::Unit,
        EntryPointAccess::Public,
        EntryPointType::Contract,
    ));

    // update_score
    entry_points.add_entry_point(EntryPoint::new(
        "update_score",
        vec![
            Parameter::new("project_id", CLType::String),
            Parameter::new("new_score", CLType::U8),
            Parameter::new("new_grade", CLType::U8),
            Parameter::new("reason", CLType::String),
            Parameter::new("timestamp", CLType::U64),
        ],
        CLType::Unit,
        EntryPointAccess::Public,
        EntryPointType::Contract,
    ));

    // set_paused
    entry_points.add_entry_point(EntryPoint::new(
        "set_paused",
        vec![Parameter::new("paused", CLType::Bool)],
        CLType::Unit,
        EntryPointAccess::Public,
        EntryPointType::Contract,
    ));

    // get_protocol_stats
    entry_points.add_entry_point(EntryPoint::new(
        "get_protocol_stats",
        vec![],
        CLType::String,
        EntryPointAccess::Public,
        EntryPointType::Contract,
    ));

    // Install contract
    let mut named_keys = NamedKeys::new();

    let (contract_hash, _contract_version) = storage::new_contract(
        entry_points,
        Some(named_keys),
        Some(CONTRACT_PACKAGE_KEY.to_string()),
        Some(CONTRACT_HASH_KEY.to_string()),
    );

    runtime::put_key(CONTRACT_KEY, contract_hash.into());

    // Call init with deployer as admin
    let caller = runtime::get_caller();
    runtime::call_contract::<()>(
        contract_hash,
        "init",
        {
            let mut args = RuntimeArgs::new();
            args.insert("admin", caller).unwrap_or_revert();
            args
        },
    );
}
