import { parseEther, parseUnits } from "ethers";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { developmentChains } from "../hardhat-config-helper";

const BASE_FEE = parseEther("0.25"); // 0.25 LINK per request
const GAS_PRICE_LINK = 1e9;
const DECIMALS = "18";
const INITIAL_PRICE = parseUnits("2000", "ether");

const deployMocks: DeployFunction = async function (
    hre: HardhatRuntimeEnvironment
) {
    const { deployer } = await hre.getNamedAccounts();
    const chainId = hre.network.config.chainId!;
    if (developmentChains.includes(chainId)) {
        hre.deployments.log("Local network detected! Deploying mocks...");
        await hre.deployments.deploy("VRFCoordinatorV2Mock", {
            from: deployer,
            log: true,
            args: [BASE_FEE, GAS_PRICE_LINK],
        });
        await hre.deployments.deploy("MockV3Aggregator", {
            from: deployer,
            log: true,
            args: [DECIMALS, INITIAL_PRICE],
        });
        hre.deployments.log("Mocks deployed!");
        hre.deployments.log("---------------------------------");
    }
};
export default deployMocks;
deployMocks.tags = ["all", "mocks"];
