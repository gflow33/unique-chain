// Template adopted from https://github.com/paritytech/substrate/blob/master/.maintain/frame-weight-template.hbs

//! Autogenerated weights for pallet_common
//!
//! THIS FILE WAS AUTO-GENERATED USING THE SUBSTRATE BENCHMARK CLI VERSION 4.0.0-dev
//! DATE: 2022-05-23, STEPS: `50`, REPEAT: 1, LOW RANGE: `[]`, HIGH RANGE: `[]`
//! EXECUTION: None, WASM-EXECUTION: Compiled, CHAIN: None, DB CACHE: 1024

// Executed Command:
// target/release/unique-collator
// benchmark
// pallet
// --pallet
// pallet-common
// --wasm-execution
// compiled
// --extrinsic
// *
// --template
// .maintain/frame-weight-template.hbs
// --steps=50
// --repeat=1
// --heap-pages=4096
// --output=./pallets/common/src/weights.rs

#![cfg_attr(rustfmt, rustfmt_skip)]
#![allow(unused_parens)]
#![allow(unused_imports)]
#![allow(clippy::unnecessary_cast)]

use frame_support::{traits::Get, weights::{Weight, constants::RocksDbWeight}};
use sp_std::marker::PhantomData;

/// Weight functions needed for pallet_common.
pub trait WeightInfo {
	fn set_collection_properties(b: u32, ) -> Weight;
	fn delete_collection_properties(b: u32, ) -> Weight;
}

/// Weights for pallet_common using the Substrate node and recommended hardware.
pub struct SubstrateWeight<T>(PhantomData<T>);
impl<T: frame_system::Config> WeightInfo for SubstrateWeight<T> {
	// Storage: Common CollectionProperties (r:1 w:1)
	fn set_collection_properties(b: u32, ) -> Weight {
		(0 as Weight)
			// Standard Error: 142_818_000
			.saturating_add((2_786_252_000 as Weight).saturating_mul(b as Weight))
			.saturating_add(T::DbWeight::get().reads(1 as Weight))
			.saturating_add(T::DbWeight::get().writes(1 as Weight))
	}
	// Storage: Common CollectionProperties (r:1 w:1)
	fn delete_collection_properties(b: u32, ) -> Weight {
		(0 as Weight)
			// Standard Error: 101_087_000
			.saturating_add((2_739_521_000 as Weight).saturating_mul(b as Weight))
			.saturating_add(T::DbWeight::get().reads(1 as Weight))
			.saturating_add(T::DbWeight::get().writes(1 as Weight))
	}
}

// For backwards compatibility and tests
impl WeightInfo for () {
	// Storage: Common CollectionProperties (r:1 w:1)
	fn set_collection_properties(b: u32, ) -> Weight {
		(0 as Weight)
			// Standard Error: 142_818_000
			.saturating_add((2_786_252_000 as Weight).saturating_mul(b as Weight))
			.saturating_add(RocksDbWeight::get().reads(1 as Weight))
			.saturating_add(RocksDbWeight::get().writes(1 as Weight))
	}
	// Storage: Common CollectionProperties (r:1 w:1)
	fn delete_collection_properties(b: u32, ) -> Weight {
		(0 as Weight)
			// Standard Error: 101_087_000
			.saturating_add((2_739_521_000 as Weight).saturating_mul(b as Weight))
			.saturating_add(RocksDbWeight::get().reads(1 as Weight))
			.saturating_add(RocksDbWeight::get().writes(1 as Weight))
	}
}