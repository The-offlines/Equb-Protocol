// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/// @title EqubRegistry
/// @notice Public discovery layer for all Equb groups.
/// @dev Read-heavy. Optimized for frontend queries. UUPS upgradeable.
contract EqubRegistry is Initializable, OwnableUpgradeable, UUPSUpgradeable {

    // -------------------------------------------------------------------------
    // Custom Errors
    // -------------------------------------------------------------------------

    error ZeroAddress();
    error NotFactory();
    error NotGroup();
    error AlreadyRegistered();
    error GroupNotFound();
    error FactoryAlreadySet();

    // -------------------------------------------------------------------------
    // Structs
    // -------------------------------------------------------------------------

    struct RegistryGroup {
        address group;
        address dagna;
        string name;
        uint256 contributionAmount;
        uint32 maxMembers;
        uint32 currentMembers;
        uint8 interval;
        bool isPrivate;
        bool active;
        uint64 createdAt;
    }

    // -------------------------------------------------------------------------
    // Storage
    // -------------------------------------------------------------------------

    /// @notice Address of the authorized EqubFactory contract.
    address public factory;

    /// @notice Whether the factory address has been set.
    bool private factorySet;

    /// @notice Ordered list of all registered groups.
    RegistryGroup[] private groups;

    /// @notice Maps group address to its index in the groups array (1-based to detect zero).
    mapping(address => uint256) private groupIndex;

    /// @notice Returns true if a group address is registered.
    mapping(address => bool) public exists;

    /// @notice Maps dagna address to all group addresses they created.
    mapping(address => address[]) private groupsByDagna;

    // -------------------------------------------------------------------------
    // Events
    // -------------------------------------------------------------------------

    /// @notice Emitted when a new group is registered.
    event GroupRegistered(
        address indexed group,
        address indexed dagna,
        string name
    );

    /// @notice Emitted when a group's member count is updated.
    event MemberCountUpdated(address indexed group, uint32 count);

    /// @notice Emitted when a group's active status is updated.
    event GroupStatusUpdated(address indexed group, bool active);

    // -------------------------------------------------------------------------
    // Modifiers
    // -------------------------------------------------------------------------

    /// @dev Restricts to the authorized EqubFactory only.
    modifier onlyFactory() {
        if (msg.sender != factory) revert NotFactory();
        _;
    }

    /// @dev Restricts to the group contract itself.
    modifier onlyGroup(address group) {
        if (msg.sender != group) revert NotGroup();
        _;
    }

    // -------------------------------------------------------------------------
    // Initializer
    // -------------------------------------------------------------------------

    /// @notice Initializes the registry.
    function initialize() external initializer {
        __Ownable_init(msg.sender);
    }

    // -------------------------------------------------------------------------
    // Admin
    // -------------------------------------------------------------------------

    /// @notice Sets the factory address. Can only be called once by the owner.
    /// @param factoryAddress Address of the deployed EqubFactory.
    function setFactory(address factoryAddress) external onlyOwner {
        if (factoryAddress == address(0)) revert ZeroAddress();
        if (factorySet) revert FactoryAlreadySet();
        factory = factoryAddress;
        factorySet = true;
    }

    // -------------------------------------------------------------------------
    // Write
    // -------------------------------------------------------------------------

    /// @notice Registers a new group. Only callable by the factory.
    /// @param group             Address of the deployed EqubGroup proxy.
    /// @param dagna             Address of the group creator.
    /// @param name              Human-readable group name.
    /// @param contributionAmount Fixed contribution per cycle.
    /// @param maxMembers        Maximum number of members.
    /// @param interval          0 = Weekly, 1 = Monthly.
    /// @param isPrivate         Whether the group is invite-only.
    /// @param createdAt         Timestamp of group creation.
    function registerGroup(
        address group,
        address dagna,
        string calldata name,
        uint256 contributionAmount,
        uint32 maxMembers,
        uint8 interval,
        bool isPrivate,
        uint64 createdAt
    ) external onlyFactory {
        if (group == address(0)) revert ZeroAddress();
        if (exists[group]) revert AlreadyRegistered();

        // CEI: update state before pushing
        exists[group] = true;
        groupIndex[group] = groups.length + 1; // 1-based index

        groups.push(RegistryGroup({
            group: group,
            dagna: dagna,
            name: name,
            contributionAmount: contributionAmount,
            maxMembers: maxMembers,
            currentMembers: 1, // dagna auto-joins
            interval: interval,
            isPrivate: isPrivate,
            active: false,
            createdAt: createdAt
        }));

        groupsByDagna[dagna].push(group);

        emit GroupRegistered(group, dagna, name);
    }

    /// @notice Updates the member count for a group. Only callable by the group itself.
    /// @param group Address of the group to update.
    /// @param count New member count.
    function updateMemberCount(address group, uint32 count)
        external
        onlyGroup(group)
    {
        if (!exists[group]) revert GroupNotFound();
        groups[groupIndex[group] - 1].currentMembers = count;
        emit MemberCountUpdated(group, count);
    }

    /// @notice Updates the active status of a group. Only callable by the group itself.
    /// @param group  Address of the group to update.
    /// @param active New active status.
    function updateStatus(address group, bool active)
        external
        onlyGroup(group)
    {
        if (!exists[group]) revert GroupNotFound();
        groups[groupIndex[group] - 1].active = active;
        emit GroupStatusUpdated(group, active);
    }

    // -------------------------------------------------------------------------
    // Read Functions
    // -------------------------------------------------------------------------

    /// @notice Returns metadata for all registered groups.
    function getAllGroups() external view returns (RegistryGroup[] memory) {
        return groups;
    }

    /// @notice Returns metadata for a single group by address.
    /// @param group Address of the group to query.
    function getGroup(address group) external view returns (RegistryGroup memory) {
        if (!exists[group]) revert GroupNotFound();
        return groups[groupIndex[group] - 1];
    }

    /// @notice Returns all group addresses created by a specific dagna.
    /// @param dagna Address of the group creator.
    function getGroupsByDagna(address dagna) external view returns (address[] memory) {
        return groupsByDagna[dagna];
    }

    /// @notice Returns the total number of registered groups.
    function totalGroups() external view returns (uint256) {
        return groups.length;
    }

    // -------------------------------------------------------------------------
    // UUPS
    // -------------------------------------------------------------------------

    /// @notice Only owner can authorize upgrades.
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}