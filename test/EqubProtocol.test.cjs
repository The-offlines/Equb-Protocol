const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Equb Protocol", function () {
  let owner, dagna, member1, member2, member3, stranger;
  let factory, registry, groupImpl;
  let group;

  const CONTRIBUTION = ethers.parseEther("1");
  const GROUP_NAME = "Test Equb";
  const MAX_MEMBERS = 5;
  const INTERVAL = 0;
  const IS_PRIVATE = false;

  async function getGroupAt(address) {
    const EqubGroup = await ethers.getContractFactory("EqubGroup");
    return EqubGroup.attach(address);
  }

  async function createGroup(signer, name, contribution, max, interval, isPrivate) {
    const tx = await factory.connect(signer).createGroup(name, contribution, max, interval, isPrivate);
    const receipt = await tx.wait();
    const event = receipt.logs.find(log => {
      try { return factory.interface.parseLog(log).name === "GroupCreated"; } catch { return false; }
    });
    const parsed = factory.interface.parseLog(event);
    return getGroupAt(parsed.args.group);
  }

  beforeEach(async function () {
    [owner, dagna, member1, member2, member3, stranger] = await ethers.getSigners();

    const EqubRegistry = await ethers.getContractFactory("EqubRegistry");
    const registryImpl = await EqubRegistry.deploy();
    const registryInitData = EqubRegistry.interface.encodeFunctionData("initialize", []);
    const ERC1967Proxy = await ethers.getContractFactory("ERC1967Proxy");
    const registryProxy = await ERC1967Proxy.deploy(await registryImpl.getAddress(), registryInitData);
    registry = EqubRegistry.attach(await registryProxy.getAddress());

    const EqubGroup = await ethers.getContractFactory("EqubGroup");
    groupImpl = await EqubGroup.deploy();

    const EqubFactory = await ethers.getContractFactory("EqubFactory");
    const factoryImpl = await EqubFactory.deploy();
    const factoryInitData = EqubFactory.interface.encodeFunctionData("initialize", [await groupImpl.getAddress()]);
    const factoryProxy = await ERC1967Proxy.deploy(await factoryImpl.getAddress(), factoryInitData);
    factory = EqubFactory.attach(await factoryProxy.getAddress());

    await registry.setFactory(await factory.getAddress());

    group = await createGroup(dagna, GROUP_NAME, CONTRIBUTION, MAX_MEMBERS, INTERVAL, IS_PRIVATE);
  });

  describe("EqubFactory", function () {
    it("should deploy and register a group", async function () {
      expect(await factory.totalGroups()).to.equal(1);
      expect(await factory.isGroup(await group.getAddress())).to.be.true;
    });

    it("should revert on empty name", async function () {
      await expect(
        factory.connect(dagna).createGroup("", CONTRIBUTION, MAX_MEMBERS, INTERVAL, IS_PRIVATE)
      ).to.be.revertedWithCustomError(factory, "EmptyName");
    });

    it("should revert on zero contribution", async function () {
      await expect(
        factory.connect(dagna).createGroup(GROUP_NAME, 0, MAX_MEMBERS, INTERVAL, IS_PRIVATE)
      ).to.be.revertedWithCustomError(factory, "InvalidContributionAmount");
    });

    it("should revert on invalid member count low", async function () {
      await expect(
        factory.connect(dagna).createGroup(GROUP_NAME, CONTRIBUTION, 2, INTERVAL, IS_PRIVATE)
      ).to.be.revertedWithCustomError(factory, "InvalidMemberCount");
    });

    it("should revert on invalid member count high", async function () {
      await expect(
        factory.connect(dagna).createGroup(GROUP_NAME, CONTRIBUTION, 51, INTERVAL, IS_PRIVATE)
      ).to.be.revertedWithCustomError(factory, "InvalidMemberCount");
    });

    it("should revert on invalid interval", async function () {
      await expect(
        factory.connect(dagna).createGroup(GROUP_NAME, CONTRIBUTION, MAX_MEMBERS, 2, IS_PRIVATE)
      ).to.be.revertedWithCustomError(factory, "InvalidInterval");
    });

    it("should return groups by dagna", async function () {
      const groups = await factory.getGroupsByDagna(dagna.address);
      expect(groups.length).to.equal(1);
    });
  });

  describe("EqubGroup - Forming", function () {
    it("dagna is auto-joined as first member", async function () {
      expect(await group.isMember(dagna.address)).to.be.true;
      expect(await group.memberCount()).to.equal(1);
    });

    it("members can join a public group", async function () {
      await group.connect(member1).joinGroup();
      expect(await group.isMember(member1.address)).to.be.true;
      expect(await group.memberCount()).to.equal(2);
    });

    it("should revert on duplicate join", async function () {
      await group.connect(member1).joinGroup();
      await expect(group.connect(member1).joinGroup())
        .to.be.revertedWithCustomError(group, "AlreadyMember");
    });

    it("should revert when group is full", async function () {
      const smallGroup = await createGroup(dagna, GROUP_NAME, CONTRIBUTION, 3, INTERVAL, IS_PRIVATE);
      await smallGroup.connect(member1).joinGroup();
      await smallGroup.connect(member2).joinGroup();
      await expect(smallGroup.connect(member3).joinGroup())
        .to.be.revertedWithCustomError(smallGroup, "GroupFull");
    });

    it("only dagna can activate", async function () {
      await group.connect(member1).joinGroup();
      await group.connect(member2).joinGroup();
      await expect(group.connect(member1).activateGroup())
        .to.be.revertedWithCustomError(group, "NotDagna");
    });

    it("cannot activate with less than 3 members", async function () {
      await group.connect(member1).joinGroup();
      await expect(group.connect(dagna).activateGroup())
        .to.be.revertedWithCustomError(group, "InsufficientMembers");
    });

    it("dagna can activate with 3+ members", async function () {
      await group.connect(member1).joinGroup();
      await group.connect(member2).joinGroup();
      await group.connect(dagna).activateGroup();
      expect(await group.status()).to.equal(1);
      expect(await group.currentRound()).to.equal(1);
    });
  });

  describe("EqubGroup - Private Group", function () {
    let privateGroup;

    beforeEach(async function () {
      privateGroup = await createGroup(dagna, GROUP_NAME, CONTRIBUTION, MAX_MEMBERS, INTERVAL, true);
    });

    it("stranger cannot join private group", async function () {
      await expect(privateGroup.connect(stranger).joinGroup())
        .to.be.revertedWithCustomError(privateGroup, "NotDagna");
    });

    it("dagna can invite members to private group", async function () {
      await privateGroup.connect(dagna).inviteMember(member1.address);
      expect(await privateGroup.isMember(member1.address)).to.be.true;
    });
  });

  describe("EqubGroup - Contributions", function () {
    beforeEach(async function () {
      await group.connect(member1).joinGroup();
      await group.connect(member2).joinGroup();
      await group.connect(dagna).activateGroup();
    });

    it("member can contribute exact amount", async function () {
      await group.connect(dagna).contribute({ value: CONTRIBUTION });
      expect(await group.hasPaid(dagna.address)).to.be.true;
      expect(await group.paidCount()).to.equal(1);
    });

    it("should revert on wrong amount", async function () {
      await expect(
        group.connect(dagna).contribute({ value: ethers.parseEther("0.5") })
      ).to.be.revertedWithCustomError(group, "WrongAmount");
    });

    it("should revert on double contribution", async function () {
      await group.connect(dagna).contribute({ value: CONTRIBUTION });
      await expect(
        group.connect(dagna).contribute({ value: CONTRIBUTION })
      ).to.be.revertedWithCustomError(group, "AlreadyPaid");
    });

    it("non-member cannot contribute", async function () {
      await expect(
        group.connect(stranger).contribute({ value: CONTRIBUTION })
      ).to.be.revertedWithCustomError(group, "NotMember");
    });
  });

  describe("EqubGroup - Full Round Flow", function () {
    beforeEach(async function () {
      await group.connect(member1).joinGroup();
      await group.connect(member2).joinGroup();
      await group.connect(dagna).activateGroup();
    });

    it("completes a round and pays winner", async function () {
      const balanceBefore = await ethers.provider.getBalance(dagna.address);

      await group.connect(dagna).contribute({ value: CONTRIBUTION });
      await group.connect(member1).contribute({ value: CONTRIBUTION });
      await group.connect(member2).contribute({ value: CONTRIBUTION });

      const balanceAfter = await ethers.provider.getBalance(dagna.address);
      const pool = CONTRIBUTION * 3n;

      expect(balanceAfter - balanceBefore).to.be.closeTo(pool, ethers.parseEther("0.5"));
      expect(await group.currentRound()).to.equal(2);
      expect(await group.paidCount()).to.equal(0);
    });

    it("round winner is stored correctly", async function () {
      await group.connect(dagna).contribute({ value: CONTRIBUTION });
      await group.connect(member1).contribute({ value: CONTRIBUTION });
      await group.connect(member2).contribute({ value: CONTRIBUTION });
      expect(await group.roundWinner(1)).to.equal(dagna.address);
    });

    it("completes all rounds and marks group as Completed", async function () {
      for (let i = 0; i < 3; i++) {
        await group.connect(dagna).contribute({ value: CONTRIBUTION });
        await group.connect(member1).contribute({ value: CONTRIBUTION });
        await group.connect(member2).contribute({ value: CONTRIBUTION });
      }
      expect(await group.status()).to.equal(2);
    });
  });

  describe("EqubGroup - Emergency (Sebebiya)", function () {
    beforeEach(async function () {
      await group.connect(member1).joinGroup();
      await group.connect(member2).joinGroup();
      await group.connect(dagna).activateGroup();
    });

    it("dagna can approve emergency recipient", async function () {
      await group.connect(dagna).approveEmergency(member1.address);
      expect(await group.emergencyMode()).to.be.true;
      expect(await group.emergencyRecipient()).to.equal(member1.address);
    });

    it("non-dagna cannot approve emergency", async function () {
      await expect(
        group.connect(member1).approveEmergency(member2.address)
      ).to.be.revertedWithCustomError(group, "NotDagna");
    });

    it("cannot approve emergency for non-member", async function () {
      await expect(
        group.connect(dagna).approveEmergency(stranger.address)
      ).to.be.revertedWithCustomError(group, "RecipientNotMember");
    });

    it("cannot set emergency twice", async function () {
      await group.connect(dagna).approveEmergency(member1.address);
      await expect(
        group.connect(dagna).approveEmergency(member2.address)
      ).to.be.revertedWithCustomError(group, "EmergencyAlreadySet");
    });

    it("emergency recipient receives payout instead of normal winner", async function () {
      await group.connect(dagna).approveEmergency(member2.address);
      const balanceBefore = await ethers.provider.getBalance(member2.address);

      await group.connect(dagna).contribute({ value: CONTRIBUTION });
      await group.connect(member1).contribute({ value: CONTRIBUTION });
      await group.connect(member2).contribute({ value: CONTRIBUTION });

      const balanceAfter = await ethers.provider.getBalance(member2.address);
      const pool = CONTRIBUTION * 3n;

      expect(balanceAfter - balanceBefore).to.be.closeTo(pool, ethers.parseEther("0.5"));
      expect(await group.emergencyMode()).to.be.false;
    });
  });

  describe("EqubRegistry", function () {
    it("factory cannot be set twice", async function () {
      await expect(
        registry.setFactory(await factory.getAddress())
      ).to.be.revertedWithCustomError(registry, "FactoryAlreadySet");
    });

    it("totalGroups returns correct count", async function () {
      expect(await factory.totalGroups()).to.equal(1);
    });

    it("getAllGroups returns all groups", async function () {
      const groups = await factory.getAllGroups();
      expect(groups.length).to.equal(1);
      expect(groups[0].name).to.equal(GROUP_NAME);
    });
  });
});