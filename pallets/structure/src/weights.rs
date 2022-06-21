// Template adopted from https://github.com/paritytech/substrate/blob/master/.maintain/frame-weight-template.hbs

//! Autogenerated weights for pallet_structure
//!
//! THIS FILE WAS AUTO-GENERATED USING THE SUBSTRATE BENCHMARK CLI VERSION 4.0.0-dev
//! DATE: 2022-06-15, STEPS: `50`, REPEAT: 200, LOW RANGE: `[]`, HIGH RANGE: `[]`
//! EXECUTION: None, WASM-EXECUTION: Compiled, CHAIN: None, DB CACHE: 1024

// Executed Command:
// target/release/unique-collator
// benchmark
// pallet
// --pallet
// pallet-structure
// --wasm-execution
// compiled
// --extrinsic
// *
// --template
// .maintain/frame-weight-template.hbs
// --steps=50
// --repeat=200
// --heap-pages=4096
// --output=./pallets/structure/src/weights.rs

#![cfg_attr(rustfmt, rustfmt_skip)]
#![allow(unused_parens)]
#![allow(unused_imports)]
#![allow(clippy::unnecessary_cast)]

use frame_support::{traits::Get, weights::{Weight, constants::RocksDbWeight}};
use sp_std::marker::PhantomData;

/// Weight functions needed for pallet_structure.
pub trait WeightInfo {
	fn find_parent() -> Weight;
}

/// Weights for pallet_structure using the Substrate node and recommended hardware.
pub struct SubstrateWeight<T>(PhantomData<T>);
impl<T: frame_system::Config> WeightInfo for SubstrateWeight<T> {
	// Storage: Common CollectionById (r:1 w:0)
	// Storage: Nonfungible TokenData (r:1 w:0)
	fn find_parent() -> Weight {
		(7_013_000 as Weight)
			.saturating_add(T::DbWeight::get().reads(2 as Weight))
	}
}

// For backwards compatibility and tests
impl WeightInfo for () {
	// Storage: Common CollectionById (r:1 w:0)
	// Storage: Nonfungible TokenData (r:1 w:0)
	fn find_parent() -> Weight {
		(7_013_000 as Weight)
			.saturating_add(RocksDbWeight::get().reads(2 as Weight))
	}
}
