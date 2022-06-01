// SPDX-License-Identifier: OTHER
// This code is automatically generated

pragma solidity >=0.8.0 <0.9.0;

// Anonymous struct
struct Tuple0 {
	uint256 field_0;
	string field_1;
}

// Common stubs holder
interface Dummy {

}

interface ERC165 is Dummy {
	function supportsInterface(bytes4 interfaceID) external view returns (bool);
}

// Inline
interface ERC721Events {
	event Transfer(
		address indexed from,
		address indexed to,
		uint256 indexed tokenId
	);
	event Approval(
		address indexed owner,
		address indexed approved,
		uint256 indexed tokenId
	);
	event ApprovalForAll(
		address indexed owner,
		address indexed operator,
		bool approved
	);
}

// Inline
interface ERC721MintableEvents {
	event MintingFinished();
}

// Selector: 41369377
interface TokenProperties is Dummy, ERC165 {
	// Selector: setTokenPropertyPermission(string,bool,bool,bool) 222d97fa
	function setTokenPropertyPermission(
		string memory key,
		bool isMutable,
		bool collectionAdmin,
		bool tokenOwner
	) external;

	// Selector: setProperty(uint256,string,bytes) 1752d67b
	function setProperty(
		uint256 tokenId,
		string memory key,
		bytes memory value
	) external;

	// Selector: deleteProperty(uint256,string) 066111d1
	function deleteProperty(uint256 tokenId, string memory key) external;

	// Throws error if key not found
	//
	// Selector: property(uint256,string) 7228c327
	function property(uint256 tokenId, string memory key)
		external
		view
		returns (bytes memory);
}

// Selector: 42966c68
interface ERC721Burnable is Dummy, ERC165 {
	// Selector: burn(uint256) 42966c68
	function burn(uint256 tokenId) external;
}

// Selector: 58800161
interface ERC721 is Dummy, ERC165, ERC721Events {
	// Selector: balanceOf(address) 70a08231
	function balanceOf(address owner) external view returns (uint256);

	// Selector: ownerOf(uint256) 6352211e
	function ownerOf(uint256 tokenId) external view returns (address);

	// Not implemented
	//
	// Selector: safeTransferFromWithData(address,address,uint256,bytes) 60a11672
	function safeTransferFromWithData(
		address from,
		address to,
		uint256 tokenId,
		bytes memory data
	) external;

	// Not implemented
	//
	// Selector: safeTransferFrom(address,address,uint256) 42842e0e
	function safeTransferFrom(
		address from,
		address to,
		uint256 tokenId
	) external;

	// Selector: transferFrom(address,address,uint256) 23b872dd
	function transferFrom(
		address from,
		address to,
		uint256 tokenId
	) external;

	// Selector: approve(address,uint256) 095ea7b3
	function approve(address approved, uint256 tokenId) external;

	// Not implemented
	//
	// Selector: setApprovalForAll(address,bool) a22cb465
	function setApprovalForAll(address operator, bool approved) external;

	// Not implemented
	//
	// Selector: getApproved(uint256) 081812fc
	function getApproved(uint256 tokenId) external view returns (address);

	// Not implemented
	//
	// Selector: isApprovedForAll(address,address) e985e9c5
	function isApprovedForAll(address owner, address operator)
		external
		view
		returns (address);
}

// Selector: 5b5e139f
interface ERC721Metadata is Dummy, ERC165 {
	// Selector: name() 06fdde03
	function name() external view returns (string memory);

	// Selector: symbol() 95d89b41
	function symbol() external view returns (string memory);

	// Returns token's const_metadata
	//
	// Selector: tokenURI(uint256) c87b56dd
	function tokenURI(uint256 tokenId) external view returns (string memory);
}

// Selector: 68ccfe89
interface ERC721Mintable is Dummy, ERC165, ERC721MintableEvents {
	// Selector: mintingFinished() 05d2035b
	function mintingFinished() external view returns (bool);

	// `token_id` should be obtained with `next_token_id` method,
	// unlike standard, you can't specify it manually
	//
	// Selector: mint(address,uint256) 40c10f19
	function mint(address to, uint256 tokenId) external returns (bool);

	// `token_id` should be obtained with `next_token_id` method,
	// unlike standard, you can't specify it manually
	//
	// Selector: mintWithTokenURI(address,uint256,string) 50bb4e7f
	function mintWithTokenURI(
		address to,
		uint256 tokenId,
		string memory tokenUri
	) external returns (bool);

	// Not implemented
	//
	// Selector: finishMinting() 7d64bcb4
	function finishMinting() external returns (bool);
}

// Selector: 780e9d63
interface ERC721Enumerable is Dummy, ERC165 {
	// Selector: tokenByIndex(uint256) 4f6ccce7
	function tokenByIndex(uint256 index) external view returns (uint256);

	// Not implemented
	//
	// Selector: tokenOfOwnerByIndex(address,uint256) 2f745c59
	function tokenOfOwnerByIndex(address owner, uint256 index)
		external
		view
		returns (uint256);

	// Selector: totalSupply() 18160ddd
	function totalSupply() external view returns (uint256);
}

// Selector: d74d154f
interface ERC721UniqueExtensions is Dummy, ERC165 {
	// Selector: transfer(address,uint256) a9059cbb
	function transfer(address to, uint256 tokenId) external;

	// Selector: burnFrom(address,uint256) 79cc6790
	function burnFrom(address from, uint256 tokenId) external;

	// Selector: nextTokenId() 75794a3c
	function nextTokenId() external view returns (uint256);

	// Selector: mintBulk(address,uint256[]) 44a9945e
	function mintBulk(address to, uint256[] memory tokenIds)
		external
		returns (bool);

	// Selector: mintBulkWithTokenURI(address,(uint256,string)[]) 36543006
	function mintBulkWithTokenURI(address to, Tuple0[] memory tokens)
		external
		returns (bool);
}

// Selector: f56cd7fa
interface Collection is Dummy, ERC165 {
	// Selector: setCollectionProperty(string,bytes) 2f073f66
	function setCollectionProperty(string memory key, bytes memory value)
		external;

	// Selector: deleteCollectionProperty(string) 7b7debce
	function deleteCollectionProperty(string memory key) external;

	// Throws error if key not found
	//
	// Selector: collectionProperty(string) cf24fd6d
	function collectionProperty(string memory key)
		external
		view
		returns (bytes memory);

	// Selector: ethSetSponsor(address) 8f9af356
	function ethSetSponsor(address sponsor) external;

	// Selector: ethConfirmSponsorship() a8580d1a
	function ethConfirmSponsorship() external;

	// Selector: setLimit(string,uint32) 68db30ca
	function setLimit(string memory limit, uint32 value) external;

	// Selector: setLimit(string,bool) ea67e4c2
	function setLimit(string memory limit, bool value) external;

	// Selector: contractAddress() f6b4dfb4
	function contractAddress() external view returns (address);

	// Selector: addAdmin(address) 70480275
	function addAdmin(address newAdmin) external view;

	// Selector: removeAdmin(address) 1785f53c
	function removeAdmin(address admin) external view;

	// Selector: setNesting(bool) e8fc50dd
	function setNesting(bool enable) external;

	// Selector: setNesting(bool,address[]) 7df12a9a
	function setNesting(bool enable, address[] memory collections) external;

	// Selector: setAccess(string) 488f56aa
	function setAccess(string memory mode) external;

	// Selector: addToAllowList(address) 31f59102
	function addToAllowList(address user) external view;

	// Selector: removeFromAllowList(address) eba8dabc
	function removeFromAllowList(address user) external view;

	// Selector: setMintMode(bool) 5dea9bd5
	function setMintMode(bool mode) external;
}

interface UniqueNFT is
	Dummy,
	ERC165,
	ERC721,
	ERC721Metadata,
	ERC721Enumerable,
	ERC721UniqueExtensions,
	ERC721Mintable,
	ERC721Burnable,
	Collection,
	TokenProperties
{}
