// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title EqubTreasury
/// @notice Secure vault that receives, stores, and releases native USDC for one EqubGroup.
/// @dev UUPS upgradeable. Owner is the EqubGroup contract.
contract EqubTreasury is Initializable, OwnableUpgradeable, UUPSUpgradeable, ReentrancyGuard {

    // -------------------------------------------------------------------------
    // Custom Errors
    // -------------------------------------------------------------------------

    error NotGroup();
    error ZeroAddress();
    error ZeroAmount();
    error InsufficientBalance();
    error TransferFailed();

    // -------------------------------------------------------------------------
    // Storage
    // -------------------------------------------------------------------------

    /// @notice The EqubGroup contract authorized to call this treasury.
    address public group;

    /// @notice Cumulative amount deposited into this treasury.
    uint256 public totalDeposited;

    /// @notice Cumulative amount paid out from this treasury.
    uint256 public totalPaidOut;

    // -------------------------------------------------------------------------
    // Events
    // -------------------------------------------------------------------------

    /// @notice Emitted when native USDC is deposited.
    /// @param from   Address that sent the deposit.
    /// @param amount Amount deposited in wei.
    event Deposited(address indexed from, uint256 amount);

    /// @notice Emitted when a payout is executed.
    /// @param recipient Address that received the payout.
    /// @param amount    Amount paid out in wei.
    event PayoutExecuted(address indexed recipient, uint256 amount);

    // -------------------------------------------------------------------------
    // Modifiers
    // -------------------------------------------------------------------------

    /// @dev Restricts calls to the authorized EqubGroup contract only.
    modifier onlyGroup() {
        if (msg.sender != group) revert NotGroup();
        _;
    }

    // -------------------------------------------------------------------------
    // Initializer
    // -------------------------------------------------------------------------

    /// @notice Initializes the treasury and binds it to one EqubGroup.
    /// @param groupAddress Address of the EqubGroup that owns this treasury.
    function initialize(address groupAddress) external initializer {
        if (groupAddress == address(0)) revert ZeroAddress();
        __Ownable_init(groupAddress);
        group = groupAddress;
    }

    // -------------------------------------------------------------------------
    // Core
    // -------------------------------------------------------------------------

    /// @notice Accepts a native USDC deposit from the bound EqubGroup.
    /// @dev Only callable by the group. Updates totalDeposited and emits Deposited.
    function deposit() external payable onlyGroup {
        if (msg.value == 0) revert ZeroAmount();
        totalDeposited += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    /// @notice Releases a payout to a recipient.
    /// @dev CEI: state updated before transfer. Only callable by the group.
    /// @param recipient Address to receive the payout.
    /// @param amount    Amount to transfer in wei.
    function executePayout(address recipient, uint256 amount)
        external
        onlyGroup
        nonReentrant
    {
        if (recipient == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        if (address(this).balance < amount) revert InsufficientBalance();

        totalPaidOut += amount;

        emit PayoutExecuted(recipient, amount);

        (bool ok,) = recipient.call{value: amount}("");
        if (!ok) revert TransferFailed();
    }

    // -------------------------------------------------------------------------
    // Read
    // -------------------------------------------------------------------------

    /// @notice Returns the current native USDC balance held by this treasury.
    function treasuryBalance() external view returns (uint256) {
        return address(this).balance;
    }

    // -------------------------------------------------------------------------
    // Receive
    // -------------------------------------------------------------------------

    /// @dev Allows direct native USDC transfers to the treasury.
    receive() external payable {}

    // -------------------------------------------------------------------------
    // UUPS
    // -------------------------------------------------------------------------

    /// @notice Only owner (EqubGroup) can authorize upgrades.
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}