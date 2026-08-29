require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  // 1. Deploy EqubRegistry implementation
  console.log("\nDeploying EqubRegistry...");
  const EqubRegistry = await ethers.getContractFactory("EqubRegistry");
  const registryImpl = await EqubRegistry.deploy();
  await registryImpl.waitForDeployment();
  const registryImplAddress = await registryImpl.getAddress();

  // Encode initialize() call
  const registryInitData = EqubRegistry.interface.encodeFunctionData("initialize", []);

  // Deploy ERC1967Proxy for Registry
  const ERC1967Proxy = await ethers.getContractFactory("ERC1967Proxy");
  const registryProxy = await ERC1967Proxy.deploy(registryImplAddress, registryInitData);
  await registryProxy.waitForDeployment();
  const registryAddress = await registryProxy.getAddress();
  console.log("EqubRegistry proxy deployed to:", registryAddress);

  // 2. Deploy EqubGroup implementation
  console.log("\nDeploying EqubGroup implementation...");
  const EqubGroup = await ethers.getContractFactory("EqubGroup");
  const equbGroupImpl = await EqubGroup.deploy();
  await equbGroupImpl.waitForDeployment();
  const equbGroupImplAddress = await equbGroupImpl.getAddress();
  console.log("EqubGroup implementation deployed to:", equbGroupImplAddress);

  // 3. Deploy EqubFactory implementation
  console.log("\nDeploying EqubFactory...");
  const EqubFactory = await ethers.getContractFactory("EqubFactory");
  const factoryImpl = await EqubFactory.deploy();
  await factoryImpl.waitForDeployment();
  const factoryImplAddress = await factoryImpl.getAddress();

  // Encode initialize(equbGroupImplAddress) call
  const factoryInitData = EqubFactory.interface.encodeFunctionData("initialize", [equbGroupImplAddress]);

  // Deploy ERC1967Proxy for Factory
  const factoryProxy = await ERC1967Proxy.deploy(factoryImplAddress, factoryInitData);
  await factoryProxy.waitForDeployment();
  const factoryAddress = await factoryProxy.getAddress();
  console.log("EqubFactory proxy deployed to:", factoryAddress);

  // 4. Set factory in registry
  console.log("\nSetting factory in registry...");
  const registry = EqubRegistry.attach(registryAddress);
  const tx = await registry.setFactory(factoryAddress);
  await tx.wait();
  console.log("Factory set in registry.");

  console.log("\n--- Deployment Complete ---");
  console.log("EqubRegistry: ", registryAddress);
  console.log("EqubGroup Impl:", equbGroupImplAddress);
  console.log("EqubFactory:   ", factoryAddress);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});