/**
 * Standard Real Estate Escrow smart contract for Polygon.
 * This is compiled at deploy time with solc and deployed via ethers.js.
 *
 * Constructor params:
 *   buyer         — buyer's Polygon wallet address
 *   seller        — seller's Polygon wallet address
 *   purchasePrice — purchase price in wei
 *   earnestMoney  — earnest money deposit in wei
 *   closingDate   — closing date as unix timestamp
 */

export const ESCROW_SOURCE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract RealEstateEscrow {
    address public buyer;
    address public seller;
    address public arbiter;
    uint256 public purchasePrice;
    uint256 public earnestMoney;
    uint256 public closingDate;
    bool public buyerSigned;
    bool public sellerSigned;
    bool public inspectionPassed;

    enum State { AWAITING_SIGNATURES, Signed, Funded, Closed, Refunded }
    State public state;

    event BuyerSigned(address indexed buyer);
    event SellerSigned(address indexed seller);
    event FundsDeposited(address indexed from, uint256 amount);
    event FundsReleased(address indexed to, uint256 amount);
    event FundsRefunded(address indexed to, uint256 amount);
    event InspectionResult(bool passed);

    constructor(
        address _buyer,
        address _seller,
        uint256 _purchasePrice,
        uint256 _earnestMoney,
        uint256 _closingDate
    ) {
        require(_buyer != address(0) && _seller != address(0), "Invalid address");
        require(_closingDate > block.timestamp, "Past closing date");
        buyer = _buyer;
        seller = _seller;
        arbiter = msg.sender;
        purchasePrice = _purchasePrice;
        earnestMoney = _earnestMoney;
        closingDate = _closingDate;
        state = State.AWAITING_SIGNATURES;
    }

    function signAsBuyer() external {
        require(msg.sender == buyer, "Only buyer");
        require(state == State.AWAITING_SIGNATURES, "Wrong state");
        buyerSigned = true;
        emit BuyerSigned(msg.sender);
        if (sellerSigned) state = State.Signed;
    }

    function signAsSeller() external {
        require(msg.sender == seller, "Only seller");
        require(state == State.AWAITING_SIGNATURES, "Wrong state");
        sellerSigned = true;
        emit SellerSigned(msg.sender);
        if (buyerSigned) state = State.Signed;
    }

    function depositEarnest() external payable {
        require(msg.sender == buyer, "Only buyer");
        require(state == State.Signed, "Not signed");
        require(msg.value == earnestMoney, "Wrong amount");
        state = State.Funded;
        emit FundsDeposited(msg.sender, msg.value);
    }

    function setInspection(bool passed) external {
        require(msg.sender == buyer || msg.sender == seller || msg.sender == arbiter, "Not authorized");
        inspectionPassed = passed;
        emit InspectionResult(passed);
    }

    function releaseFunds() external {
        require(state == State.Funded, "Not funded");
        require(msg.sender == buyer || msg.sender == seller || msg.sender == arbiter, "Not authorized");
        uint256 bal = address(this).balance;
        (bool ok, ) = seller.call{value: bal}("");
        require(ok, "Transfer failed");
        state = State.Closed;
        emit FundsReleased(seller, bal);
    }

    function refund() external {
        require(state == State.Funded, "Not funded");
        require(msg.sender == buyer || msg.sender == arbiter, "Not authorized");
        uint256 bal = address(this).balance;
        (bool ok, ) = buyer.call{value: bal}("");
        require(ok, "Refund failed");
        state = State.Refunded;
        emit FundsRefunded(buyer, bal);
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}`;