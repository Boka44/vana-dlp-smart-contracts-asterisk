import { deployments, ethers } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { deployProxy, verifyContract, verifyProxy } from "./helpers";
import { parseEther } from "../utils/helpers";

const implementationContractName = "DataLiquidityPoolImplementation";
const proxyContractName = "DataLiquidityPoolProxy";
const proxyContractPath =
  "contracts/dlp/DataLiquidityPoolProxy.sol:DataLiquidityPoolProxy";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const [deployer] = await ethers.getSigners();

  const ownerAddress = process.env.OWNER_ADDRESS ?? deployer.address;
  const trustedForwarder = ethers.ZeroAddress;
  // process.env.TRUSTED_FORWARDER_ADDRESS ?? ethers.ZeroAddress;

  const tokenContractName = "DAT";
  const tokenName =
    process.env.DLP_TOKEN_NAME ?? "Custom Data Autonomy Token";
  const tokenSymbol = process.env.DLP_TOKEN_SYMBOL ?? "CUSTOMDAT";

  const teePoolContractAddress = process.env.TEE_POOL_CONTRACT_ADDRESS ?? "";
  const dataRegistryContractAddress =
    process.env.DATA_REGISTRY_CONTRACT_ADDRESS ?? "";

  const dlpPublicKey = process.env.DLP_PUBLIC_KEY ?? "publicKey";
  const proofInstruction =
    process.env.DLP_PROOF_INSTRUCTION ?? "proofInstruction";
  const dlpName = process.env.DLP_NAME ?? "DLP Name";
  const dlpFileRewardFactor =
    process.env.DLP_FILE_REWARD_FACTOR ?? parseEther(1);

  console.log(``);
  console.log(``);
  console.log(``);
  console.log(`**************************************************************`);
  console.log(`**************************************************************`);
  console.log(`**************************************************************`);
  console.log(`********** Deploying DAT **********`);

  const tokenDeploy = await deployments.deploy(tokenContractName, {
    from: deployer.address,
    args: [tokenName, tokenSymbol, deployer.address],
    log: true,
  });

  const token = await ethers.getContractAt("DAT", tokenDeploy.address);

  const params = {
    trustedForwarder: trustedForwarder,
    ownerAddress: ownerAddress,
    name: dlpName,
    dataRegistryAddress: dataRegistryContractAddress,
    teePoolAddress: teePoolContractAddress,
    tokenAddress: token.target,
    publicKey: dlpPublicKey,
    proofInstruction: proofInstruction,
    fileRewardFactor: dlpFileRewardFactor,
  };

  const proxyDeploy = await deployProxy(
    deployer,
    proxyContractName,
    implementationContractName,
    [params],
  );

  const dlp = await ethers.getContractAt(
    implementationContractName,
    proxyDeploy.proxyAddress,
  );

  await verifyProxy(
    proxyDeploy.proxyAddress,
    proxyDeploy.implementationAddress,
    proxyDeploy.initializeData,
    proxyContractPath,
  );

  console.log(``);
  console.log(``);
  console.log(``);
  console.log(`**************************************************************`);
  console.log(`**************************************************************`);
  console.log(`**************************************************************`);
  console.log(`********** Mint tokens **********`);
  const txMint = await token
    .connect(deployer)
    .mint(deployer, parseEther(1000000));
  await txMint.wait();

  const txApprove = await token
    .connect(deployer)
    .approve(dlp, parseEther(1000000));
  await txApprove.wait();

  await new Promise((resolve) => setTimeout(resolve, 10000));

  const txAddRewards = await dlp
    .connect(deployer)
    .addRewardsForContributors(parseEther(1000000));
  await txAddRewards.wait();

  const txTransferOwnership = await token
    .connect(deployer)
    .transferOwnership(ownerAddress);
  await txTransferOwnership.wait();

  await verifyContract(tokenDeploy.address, [
    tokenName,
    tokenSymbol,
    deployer.address,
  ]);

  console.log(``);
  console.log(`**************************************************************`);
  console.log(`**************************************************************`);
  console.log(`**************************************************************`);
  console.log(`********** DLP deployed successfully **********`);
  console.log(`DLP address: ${dlp.target}`);
  console.log(`Token address: ${token.target}`);
  console.log(`**************************************************************`);

  return;
};

export default func;
func.tags = ["DLPDeploy"];
