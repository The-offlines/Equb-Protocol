// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/// @title IEqubGroup
/// @notice Minimal interface consumed by EqubFactory to initialize newly deployed EqubGroup proxies.
interface IEqubGroup {
    /// @notice Initializes a freshly deployed EqubGroup proxy.
    /// @param dagna          Address of the group creator / rotating chairman.
    /// @param name           Human-readable group name.
    /// @param contributionAmount Fixed contribution per cycle in native USDC units.
    /// @param maxMembers     Maximum number of participants (3-50).
    /// @param interval       Cycle cadence: 0 = Weekly, 1 = Monthly.
    /// @param isPrivate      Whether the group requires an invite to join.
    function initialize(
        address dagna,
        string calldata name,
        uint256 contributionAmount,
        uint32 maxMembers,
        uint8 interval,
        bool isPrivate
    ) external;
}