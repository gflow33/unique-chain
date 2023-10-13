// Template adopted from https://github.com/paritytech/substrate/blob/master/.maintain/frame-weight-template.hbs

//! Autogenerated weights for pallet_common
//!
//! THIS FILE WAS AUTO-GENERATED USING THE SUBSTRATE BENCHMARK CLI VERSION 4.0.0-dev
//! DATE: 2023-10-13, STEPS: `50`, REPEAT: `80`, LOW RANGE: `[]`, HIGH RANGE: `[]`
//! WORST CASE MAP SIZE: `1000000`
//! HOSTNAME: `hearthstone`, CPU: `AMD Ryzen 9 7950X3D 16-Core Processor`
//! EXECUTION: , WASM-EXECUTION: Compiled, CHAIN: None, DB CACHE: 1024

// Executed Command:
// ./target/production/unique-collator
// benchmark
// pallet
// --pallet
// pallet-common
// --wasm-execution
// compiled
// --extrinsic
// *
// --template=.maintain/frame-weight-template.hbs
// --steps=50
// --repeat=80
// --heap-pages=4096
// --output=./pallets/common/src/weights.rs

#![cfg_attr(rustfmt, rustfmt_skip)]
#![allow(unused_parens)]
#![allow(unused_imports)]

use frame_support::{traits::Get, weights::{Weight, constants::RocksDbWeight}};
use sp_std::marker::PhantomData;

/// Weight functions needed for pallet_common.
pub trait WeightInfo {
	fn set_collection_properties(b: u32, ) -> Weight;
	fn check_accesslist() -> Weight;
	fn property_writer_load_collection_info() -> Weight;
}

/// Weights for pallet_common using the Substrate node and recommended hardware.
pub struct SubstrateWeight<T>(PhantomData<T>);
impl<T: frame_system::Config> WeightInfo for SubstrateWeight<T> {
	/// Storage: `Common::CollectionProperties` (r:1 w:1)
	/// Proof: `Common::CollectionProperties` (`max_values`: None, `max_size`: Some(40992), added: 43467, mode: `MaxEncodedLen`)
	/// The range of component `b` is `[0, 64]`.
	fn set_collection_properties(b: u32, ) -> Weight {
		// Proof Size summary in bytes:
		//  Measured:  `298`
		//  Estimated: `44457`
		// Minimum execution time: 4_560_000 picoseconds.
		Weight::from_parts(28_643_440, 44457)
			// Standard Error: 28_941
			.saturating_add(Weight::from_parts(18_277_422, 0).saturating_mul(b.into()))
			.saturating_add(T::DbWeight::get().reads(1_u64))
			.saturating_add(T::DbWeight::get().writes(1_u64))
	}
	/// Storage: `Common::Allowlist` (r:1 w:0)
	/// Proof: `Common::Allowlist` (`max_values`: None, `max_size`: Some(70), added: 2545, mode: `MaxEncodedLen`)
	fn check_accesslist() -> Weight {
		// Proof Size summary in bytes:
		//  Measured:  `373`
		//  Estimated: `3535`
		// Minimum execution time: 4_290_000 picoseconds.
		Weight::from_parts(4_460_000, 3535)
			.saturating_add(T::DbWeight::get().reads(1_u64))
	}
	/// Storage: `Common::IsAdmin` (r:1 w:0)
	/// Proof: `Common::IsAdmin` (`max_values`: None, `max_size`: Some(70), added: 2545, mode: `MaxEncodedLen`)
	/// Storage: `Common::CollectionPropertyPermissions` (r:1 w:0)
	/// Proof: `Common::CollectionPropertyPermissions` (`max_values`: None, `max_size`: Some(16726), added: 19201, mode: `MaxEncodedLen`)
	fn property_writer_load_collection_info() -> Weight {
		// Proof Size summary in bytes:
		//  Measured:  `326`
		//  Estimated: `20191`
		// Minimum execution time: 6_100_000 picoseconds.
		Weight::from_parts(6_350_000, 20191)
			.saturating_add(T::DbWeight::get().reads(2_u64))
	}
}

// For backwards compatibility and tests
impl WeightInfo for () {
	/// Storage: `Common::CollectionProperties` (r:1 w:1)
	/// Proof: `Common::CollectionProperties` (`max_values`: None, `max_size`: Some(40992), added: 43467, mode: `MaxEncodedLen`)
	/// The range of component `b` is `[0, 64]`.
	fn set_collection_properties(b: u32, ) -> Weight {
		// Proof Size summary in bytes:
		//  Measured:  `298`
		//  Estimated: `44457`
		// Minimum execution time: 4_560_000 picoseconds.
		Weight::from_parts(28_643_440, 44457)
			// Standard Error: 28_941
			.saturating_add(Weight::from_parts(18_277_422, 0).saturating_mul(b.into()))
			.saturating_add(RocksDbWeight::get().reads(1_u64))
			.saturating_add(RocksDbWeight::get().writes(1_u64))
	}
	/// Storage: `Common::Allowlist` (r:1 w:0)
	/// Proof: `Common::Allowlist` (`max_values`: None, `max_size`: Some(70), added: 2545, mode: `MaxEncodedLen`)
	fn check_accesslist() -> Weight {
		// Proof Size summary in bytes:
		//  Measured:  `373`
		//  Estimated: `3535`
		// Minimum execution time: 4_290_000 picoseconds.
		Weight::from_parts(4_460_000, 3535)
			.saturating_add(RocksDbWeight::get().reads(1_u64))
	}
	/// Storage: `Common::IsAdmin` (r:1 w:0)
	/// Proof: `Common::IsAdmin` (`max_values`: None, `max_size`: Some(70), added: 2545, mode: `MaxEncodedLen`)
	/// Storage: `Common::CollectionPropertyPermissions` (r:1 w:0)
	/// Proof: `Common::CollectionPropertyPermissions` (`max_values`: None, `max_size`: Some(16726), added: 19201, mode: `MaxEncodedLen`)
	fn property_writer_load_collection_info() -> Weight {
		// Proof Size summary in bytes:
		//  Measured:  `326`
		//  Estimated: `20191`
		// Minimum execution time: 6_100_000 picoseconds.
		Weight::from_parts(6_350_000, 20191)
			.saturating_add(RocksDbWeight::get().reads(2_u64))
	}
}

