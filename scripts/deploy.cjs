require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const ERC1967Proxy = await ethers.getContractFactory("ERC1967Proxy");

  // 1. Deploy EqubRegistry implementation
  console.log("\nDeploying EqubRegistry...");
  const EqubRegistry = await ethers.getContractFactory("EqubRegistry");
  const registryImpl = await EqubRegistry.deploy();
  await registryImpl.waitForDeployment();
  const registryImplAddress = await registryImpl.getAddress();
  console.log("EqubRegistry IMPL:", registryImplAddress);

  const registryInitData = EqubRegistry.interface.encodeFunctionData("initialize", []);
  const registryProxy = await ERC1967Proxy.deploy(registryImplAddress, registryInitData);
  await registryProxy.waitForDeployment();
  const registryAddress = await registryProxy.getAddress();
  console.log("EqubRegistry PROXY:", registryAddress);

  // 2. Deploy EqubGroup implementation
  console.log("\nDeploying EqubGroup...");
  const EqubGroup = await ethers.getContractFactory("EqubGroup");
  const equbGroupImpl = await EqubGroup.deploy();
  await equbGroupImpl.waitForDeployment();
  const equbGroupImplAddress = await equbGroupImpl.getAddress();
  console.log("EqubGroup IMPL:", equbGroupImplAddress);

  // 3. Deploy EqubFactory implementation
  console.log("\nDeploying EqubFactory...");
  const EqubFactory = await ethers.getContractFactory("EqubFactory");
  const factoryImpl = await EqubFactory.deploy();
  await factoryImpl.waitForDeployment();
  const factoryImplAddress = await factoryImpl.getAddress();
  console.log("EqubFactory IMPL:", factoryImplAddress);

  const factoryInitData = EqubFactory.interface.encodeFunctionData("initialize", [equbGroupImplAddress]);
  const factoryProxy = await ERC1967Proxy.deploy(factoryImplAddress, factoryInitData);
  await factoryProxy.waitForDeployment();
  const factoryAddress = await factoryProxy.getAddress();
  console.log("EqubFactory PROXY:", factoryAddress);

  // 4. Deploy EqubTreasury implementation
  console.log("\nDeploying EqubTreasury...");
  const EqubTreasury = await ethers.getContractFactory("EqubTreasury");
  const treasuryImpl = await EqubTreasury.deploy();
  await treasuryImpl.waitForDeployment();
  const treasuryImplAddress = await treasuryImpl.getAddress();
  console.log("EqubTreasury IMPL:", treasuryImplAddress);

  // 5. Set factory in registry
  console.log("\nSetting factory in registry...");
  const registry = EqubRegistry.attach(registryAddress);
  const tx = await registry.setFactory(factoryAddress);
  await tx.wait();
  console.log("Factory set in registry.");

  console.log("\n--- Deployment Complete ---");
  console.log("EqubRegistry  IMPL: ", registryImplAddress);
  console.log("EqubRegistry  PROXY:", registryAddress);
  console.log("EqubGroup     IMPL: ", equbGroupImplAddress);
  console.log("EqubFactory   IMPL: ", factoryImplAddress);
  console.log("EqubFactory   PROXY:", factoryAddress);
  console.log("EqubTreasury  IMPL: ", treasuryImplAddress);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});