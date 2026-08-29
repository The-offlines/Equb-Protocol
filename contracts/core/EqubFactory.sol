// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "../interfaces/IEqubGroup.sol";

/// @title EqubFactory
/// @notice Factory contract responsible for deploying and registering EqubGroup proxy contracts.
/// @dev UUPS upgradeable. Only the owner can authorize upgrades.
contract EqubFactory is Initializable, OwnableUpgradeable, UUPSUpgradeable {

    // -------------------------------------------------------------------------
    // Custom Errors
    // -------------------------------------------------------------------------

    error EmptyName();
    error InvalidContributionAmount();
    error InvalidMemberCount();
    error InvalidInterval();
    error ZeroImplementationAddress();

    // -------------------------------------------------------------------------
    // Storage
    // -------------------------------------------------------------------------

    struct GroupInfo {
        address groupAddress;
        address dagna;
        string name;
        uint256 contributionAmount;
        uint32 maxMembers;
        uint8 interval;
        bool isPrivate;
        uint64 createdAt;
    }

    GroupInfo[] private allGroups;
    mapping(address => address[]) private groupsByDagna;
    mapping(address => bool) private isValidGroup;
    address public equbGroupImplementation;

    // -------------------------------------------------------------------------
    // Events
    // -------------------------------------------------------------------------

    event GroupCreated(
        address indexed group,
        address indexed dagna,
        string name,
        uint256 contributionAmount,
        uint32 maxMembers
    );

    // -------------------------------------------------------------------------
    // Initializer
    // -------------------------------------------------------------------------

    function initialize(address _equbGroupImplementation) external initializer {
        if (_equbGroupImplementation == address(0)) revert ZeroImplementationAddress();
        __Ownable_init(msg.sender);
        equbGroupImplementation = _equbGroupImplementation;
    }

    // -------------------------------------------------------------------------
    // Core
    // -------------------------------------------------------------------------

    function createGroup(
        string memory name,
        uint256 contributionAmount,
        uint32 maxMembers,
        uint8 interval,
        bool isPrivate
    ) external returns (address group) {
        if (bytes(name).length == 0) revert EmptyName();
        if (contributionAmount == 0) revert InvalidContributionAmount();
        if (maxMembers < 3 || maxMembers > 50) revert InvalidMemberCount();
        if (interval > 1) revert InvalidInterval();

        address dagna = msg.sender;

        bytes memory initData = abi.encodeWithSelector(
            IEqubGroup.initialize.selector,
            dagna,
            name,
            contributionAmount,
            maxMembers,
            interval,
            isPrivate
        );

        group = address(new ERC1967Proxy(equbGroupImplementation, initData));

        allGroups.push(GroupInfo({
            groupAddress: group,
            dagna: dagna,
            name: name,
            contributionAmount: contributionAmount,
            maxMembers: maxMembers,
            interval: interval,
            isPrivate: isPrivate,
            createdAt: uint64(block.timestamp)
        }));

        groupsByDagna[dagna].push(group);
        isValidGroup[group] = true;

        emit GroupCreated(group, dagna, name, contributionAmount, maxMembers);
    }

    // -------------------------------------------------------------------------
    // Read Functions
    // -------------------------------------------------------------------------

    function getAllGroups() external view returns (GroupInfo[] memory) {
        return allGroups;
    }

    function getGroupsByDagna(address dagna) external view returns (address[] memory) {
        return groupsByDagna[dagna];
    }

    function totalGroups() external view returns (uint256) {
        return allGroups.length;
    }

    function isGroup(address group) external view returns (bool) {
        return isValidGroup[group];
    }

    // -------------------------------------------------------------------------
    // UUPS
    // -------------------------------------------------------------------------

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}