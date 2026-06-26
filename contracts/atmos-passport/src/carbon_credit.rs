use odra::prelude::*;

#[odra::module]
pub struct CarbonCredit {
    pub tonnes: Var<u64>,
    pub grade: Var<u8>,
    pub methodology: Var<String>,
    pub zk_hash: Var<String>,
    pub owner: Var<Address>,
    pub retired: Var<bool>,
}

#[odra::module]
impl CarbonCredit {
    #[odra(init)]
    pub fn init(&mut self, tonnes: u64, grade: u8, methodology: String, zk_hash: String) {
        self.tonnes.set(tonnes);
        self.grade.set(grade);
        self.methodology.set(methodology);
        self.zk_hash.set(zk_hash);
        self.owner.set(self.env().caller());
        self.retired.set(false);
    }

    pub fn transfer(&mut self, to: Address) {
        let caller = self.env().caller();
        if caller != self.owner.get_or_default() {
            self.env().revert(Error::NotOwner);
        }
        if self.retired.get_or_default() {
            self.env().revert(Error::AlreadyRetired);
        }
        self.owner.set(to);
    }

    pub fn retire(&mut self) {
        let caller = self.env().caller();
        if caller != self.owner.get_or_default() {
            self.env().revert(Error::NotOwner);
        }
        if self.retired.get_or_default() {
            self.env().revert(Error::AlreadyRetired);
        }
        self.retired.set(true);
        
        self.env().emit_event(CreditRetired {
            tonnes: self.tonnes.get_or_default(),
            retired_by: caller,
        });
    }

    pub fn get_owner(&self) -> Address {
        self.owner.get_or_default()
    }
}

#[odra::event]
pub struct CreditRetired {
    pub tonnes: u64,
    pub retired_by: Address,
}

#[derive(odra::OdraError)]
pub enum Error {
    NotOwner = 1,
    AlreadyRetired = 2,
}

#[cfg(test)]
mod tests {
    use super::*;
    use odra::host::{Deployer, HostEnv};

    #[test]
    fn test_init() {
        let env = odra_test::env();
        let init_args = CarbonCreditInitArgs {
            tonnes: 1000,
            grade: 3,
            methodology: "VM0044".to_string(),
            zk_hash: "0x123".to_string(),
        };
        let contract = CarbonCreditHostRef::deploy(&env, init_args);
        
        assert_eq!(contract.get_owner(), env.caller());
    }
}
