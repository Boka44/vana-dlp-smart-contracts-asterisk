import { deployments, ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);
  
  // Get the deployed DLP contract
  const dlpDeployment = await deployments.get("DataLiquidityPoolProxy");
  const dlp = await ethers.getContractAt("DataLiquidityPoolImplementation", dlpDeployment.address);
  
  // Get the new proof instruction from env
  const newProofInstruction = process.env.DLP_PROOF_INSTRUCTION;
  if (!newProofInstruction) {
    throw new Error("DLP_PROOF_INSTRUCTION not set in .env");
  }

  console.log("Current DLP address:", dlpDeployment.address);
  console.log("New proof instruction:", newProofInstruction);

  try {
    // Update the proof instruction
    const tx = await dlp.updateProofInstruction(newProofInstruction);
    console.log("Transaction sent:", tx.hash);
    
    const receipt = await tx.wait();
    console.log("Proof instruction updated! Transaction:", receipt.hash);
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