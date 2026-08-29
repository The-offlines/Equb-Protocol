// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract EqubGroup is Initializable, OwnableUpgradeable, UUPSUpgradeable, ReentrancyGuard {

    error NotForming();
    error NotActive();
    error AlreadyMember();
    error NotMember();
    error GroupFull();
    error NotDagna();
    error InsufficientMembers();
    error AlreadyPaid();
    error WrongAmount();
    error EmergencyAlreadySet();
    error RecipientNotMember();
    error TransferFailed();

    enum Interval { Weekly, Monthly }
    enum GroupStatus { Forming, Active, Completed, Cancelled }

    struct Member {
        bool joined;
        bool receivedPayout;
        bool paidCurrentRound;
        uint32 joinedRound;
        uint64 joinedAt;
    }

    string public groupName;
    address public dagna;
    uint256 public contributionAmount;
    uint32 public maxMembers;
    Interval public interval;
    bool public isPrivate;
    GroupStatus public status;

    uint32 public currentRound;
    uint32 public memberCount;
    uint32 public paidCount;

    address[] private members;
    mapping(address => Member) public memberInfo;
    mapping(uint32 => address) public roundWinner;

    bool public emergencyMode;
    address public emergencyRecipient;

    event MemberJoined(address indexed member);
    event ContributionPaid(address indexed member, uint32 indexed round, uint256 amount);
    event RoundCompleted(uint32 indexed round, address indexed winner, uint256 payout);
    event EmergencyApproved(address indexed recipient, uint32 round);
    event GroupActivated(uint64 startTime);

    modifier onlyDagna() {
        if (msg.sender != dagna) revert NotDagna();
        _;
    }

    modifier onlyActive() {
        if (status != GroupStatus.Active) revert NotActive();
        _;
    }

    modifier onlyMember() {
        if (!memberInfo[msg.sender].joined) revert NotMember();
        _;
    }

    function initialize(
        address _dagna,
        string calldata _name,
        uint256 _contributionAmount,
        uint32 _maxMembers,
        uint8 _interval,
        bool _isPrivate
    ) external initializer {
        __Ownable_init(_dagna);
        dagna = _dagna;
        groupName = _name;
        contributionAmount = _contributionAmount;
        maxMembers = _maxMembers;
        interval = Interval(_interval);
        isPrivate = _isPrivate;
        status = GroupStatus.Forming;
        _addMember(_dagna);
    }

    function joinGroup() external {
        if (status != GroupStatus.Forming) revert NotForming();
        if (memberInfo[msg.sender].joined) revert AlreadyMember();
        if (memberCount >= maxMembers) revert GroupFull();
        if (isPrivate && msg.sender != dagna) revert NotDagna();
        _addMember(msg.sender);
    }

    function inviteMember(address invitee) external onlyDagna {
        if (status != GroupStatus.Forming) revert NotForming();
        if (memberInfo[invitee].joined) revert AlreadyMember();
        if (memberCount >= maxMembers) revert GroupFull();
        _addMember(invitee);
    }

    function _addMember(address account) internal {
        memberInfo[account] = Member({
            joined: true,
            receivedPayout: false,
            paidCurrentRound: false,
            joinedRound: currentRound,
            joinedAt: uint64(block.timestamp)
        });
        members.push(account);
        unchecked { ++memberCount; }
        emit MemberJoined(account);
    }

    function activateGroup() external onlyDagna {
        if (status != GroupStatus.Forming) revert NotForming();
        if (memberCount < 3) revert InsufficientMembers();
        status = GroupStatus.Active;
        currentRound = 1;
        emit GroupActivated(uint64(block.timestamp));
    }

    function contribute() external payable onlyActive onlyMember nonReentrant {
        if (msg.value != contributionAmount) revert WrongAmount();
        Member storage m = memberInfo[msg.sender];
        if (m.paidCurrentRound) revert AlreadyPaid();
        m.paidCurrentRound = true;
        unchecked { ++paidCount; }
        emit ContributionPaid(msg.sender, currentRound, msg.value);
        if (paidCount == memberCount) {
            _completeRound();
        }
    }

    function _completeRound() internal {
        uint256 pool = contributionAmount * memberCount;
        address winner;

        if (emergencyMode) {
            winner = emergencyRecipient;
            emergencyMode = false;
            emergencyRecipient = address(0);
        } else {
            uint256 len = members.length;
            for (uint256 i = 0; i < len;) {
                if (!memberInfo[members[i]].receivedPayout) {
                    winner = members[i];
                    break;
                }
                unchecked { ++i; }
            }
        }

        memberInfo[winner].receivedPayout = true;
        roundWinner[currentRound] = winner;

        uint256 len = members.length;
        for (uint256 i = 0; i < len;) {
            memberInfo[members[i]].paidCurrentRound = false;
            unchecked { ++i; }
        }

        uint32 completedRound = currentRound;
        unchecked { ++currentRound; }
        paidCount = 0;

        bool allPaid = true;
        for (uint256 i = 0; i < len;) {
            if (!memberInfo[members[i]].receivedPayout) {
                allPaid = false;
                break;
            }
            unchecked { ++i; }
        }

        if (allPaid) {
            status = GroupStatus.Completed;
        }

        emit RoundCompleted(completedRound, winner, pool);

        (bool ok,) = winner.call{value: pool}("");
        if (!ok) revert TransferFailed();
    }

    function approveEmergency(address recipient) external onlyDagna onlyActive {
        if (emergencyMode) revert EmergencyAlreadySet();
        if (!memberInfo[recipient].joined) revert RecipientNotMember();
        emergencyMode = true;
        emergencyRecipient = recipient;
        emit EmergencyApproved(recipient, currentRound);
    }

    function getMembers() external view returns (address[] memory) {
        return members;
    }

    function getCurrentPool() external view returns (uint256) {
        return contributionAmount * paidCount;
    }

    function hasPaid(address account) external view returns (bool) {
        return memberInfo[account].paidCurrentRound;
    }

    function isMember(address account) external view returns (bool) {
        return memberInfo[account].joined;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}