// SPDX-License-Identifier: OTHER

pragma solidity >=0.8.0 <0.9.0;

import "../api/UniqueNFT.sol";

contract UniqueNFTProxy is UniqueNFT {
    UniqueNFT proxied;

    constructor(address _proxied) UniqueNFT() {
        proxied = UniqueNFT(_proxied);
    }

    function name() external view override returns (string memory) {
        return proxied.name();
    }

    function symbol() external view override returns (string memory) {
        return proxied.symbol();
    }

    function totalSupply() external view override returns (uint256) {
        return proxied.totalSupply();
    }

    function balanceOf(address owner) external view override returns (uint256) {
        return proxied.balanceOf(owner);
    }

    function ownerOf(uint256 tokenId) external view override returns (address) {
        return proxied.ownerOf(tokenId);
    }

    function safeTransferFromWithData(
        address from,
        address to,
        uint256 tokenId,
        bytes memory data
    ) external override {
        return proxied.safeTransferFromWithData(from, to, tokenId, data);
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId
    ) external override {
        return proxied.safeTransferFrom(from, to, tokenId);
    }

    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) external override {
        return proxied.transferFrom(from, to, tokenId);
    }

    function approve(address approved, uint256 tokenId) external override {
        return proxied.approve(approved, tokenId);
    }

    function setApprovalForAll(address operator, bool approved)
        external
        override
    {
        return proxied.setApprovalForAll(operator, approved);
    }

    function getApproved(uint256 tokenId)
        external
        view
        override
        returns (address)
    {
        return proxied.getApproved(tokenId);
    }

    function isApprovedForAll(address owner, address operator)
        external
        view
        override
        returns (address)
    {
        return proxied.isApprovedForAll(owner, operator);
    }

    function burn(uint256 tokenId) external override {
        return proxied.burn(tokenId);
    }

    function tokenByIndex(uint256 index)
        external
        view
        override
        returns (uint256)
    {
        return proxied.tokenByIndex(index);
    }

    function tokenOfOwnerByIndex(address owner, uint256 index)
        external
        view
        override
        returns (uint256)
    {
        return proxied.tokenOfOwnerByIndex(owner, index);
    }

    function tokenURI(uint256 tokenId)
        external
        view
        override
        returns (string memory)
    {
        return proxied.tokenURI(tokenId);
    }

    function mintingFinished() external view override returns (bool) {
        return proxied.mintingFinished();
    }

    function mint(address to, uint256 tokenId)
        external
        override
        returns (bool)
    {
        return proxied.mint(to, tokenId);
    }

    function mintWithTokenURI(
        address to,
        uint256 tokenId,
        string memory tokenUri
    ) external override returns (bool) {
        return proxied.mintWithTokenURI(to, tokenId, tokenUri);
    }

    function finishMinting() external override returns (bool) {
        return proxied.finishMinting();
    }

    function transfer(address to, uint256 tokenId) external override {
        return proxied.transfer(to, tokenId);
    }

    function nextTokenId() external view override returns (uint256) {
        return proxied.nextTokenId();
    }

    function supportsInterface(uint32 interfaceId)
        external
        view
        override
        returns (bool)
    {
        return proxied.supportsInterface(interfaceId);
    }
}