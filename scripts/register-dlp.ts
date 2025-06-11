import { deployments, ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);
  
  // Get the deployed DLP address from the deployment
  const dlpDeployment = await deployments.get("DataLiquidityPoolProxy");
  const dlp = await ethers.getContractAt("DataLiquidityPoolImplementation", dlpDeployment.address);
  
  // Get the Root Network contract
  const rootNetwork = await new ethers.Contract(
    process.env.ROOT_CONTRACT_ADDRESS!,
    ["function registerDlp((address dlpAddress, address ownerAddress, address treasuryAddress, uint256 stakersPercentage, string name, string iconUrl, string website, string metadata)) external payable"],
    deployer
  );

  // Prepare registration parameters
  const registrationInfo = {
    dlpAddress: dlp.target,
    ownerAddress: process.env.OWNER_ADDRESS,
    treasuryAddress: process.env.OWNER_ADDRESS, // Can be different if needed
    stakersPercentage: ethers.parseEther("50"), // 50% to stakers
    name: process.env.DLP_NAME,
    iconUrl: "", // Optional
    website: "", // Optional
    metadata: "" // Optional
  };

  // Debug log all parameters
  console.log("Registration Info:");
  console.log("- DLP Address:", registrationInfo.dlpAddress);
  console.log("- Owner Address:", registrationInfo.ownerAddress);
  console.log("- Treasury Address:", registrationInfo.treasuryAddress);
  console.log("- Stakers Percentage:", registrationInfo.stakersPercentage.toString());
  console.log("- Name:", registrationInfo.name);
  console.log("- Root Network Address:", process.env.ROOT_CONTRACT_ADDRESS);
  console.log("- Value being sent:", ethers.parseEther("100").toString());

  try {
    // Register DLP - sending 100 VANA as initial stake
    const tx = await rootNetwork.registerDlp(
      registrationInfo,
      { value: ethers.parseEther("1") }
    );

    console.log("Transaction sent:", tx.hash);
    const receipt = await tx.wait();
    console.log("DLP registered! Transaction:", receipt.hash);
  } catch (error: any) {
    console.error("Error details:", error.message);
    if (error.data) {
      console.error("Error data:", error.data);
    }
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 