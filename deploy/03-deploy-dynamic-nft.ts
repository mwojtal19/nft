import { readFileSync } from "fs";
import { ethers } from "hardhat";
import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { developmentChains, networkConfig } from "../hardhat-config-helper";
import verify from "../utils/verify";

const deployDynamicNft: DeployFunction = async function (
    hre: HardhatRuntimeEnvironment
) {
    const accounts = await ethers.getSigners();
    const deployer = accounts[0];
    const chainId = hre.network.config.chainId!;
    let ethUsdPriceFeedAddress: string;
    if (developmentChains.includes(chainId)) {
        const mockV3Aggregator = await hre.deployments.get("MockV3Aggregator");
        ethUsdPriceFeedAddress = mockV3Aggregator.address;
    } else {
        ethUsdPriceFeedAddress = networkConfig[chainId].ethUsdPriceFeed!;
    }
    const lowSvg = readFileSync("./images/dynamicNft/frown.svg", {
        encoding: "utf8",
    });
    const highSvg = readFileSync("./images/dynamicNft/happy.svg", {
        encoding: "utf8",
    });
    const args: any[] = [ethUsdPriceFeedAddress, lowSvg, highSvg];
    const dynamicSvgNft = await hre.deployments.deploy("DynamicSvgNft", {
        from: deployer.address,
        args: args,
        log: true,
        waitConfirmations: 1,
    });
    if (!developmentChains.includes(chainId) && process.env.ETHERSCAN_API_KEY) {
        await verify(dynamicSvgNft.address, args);
    }
    hre.deployments.log("---------------------------------");
};
export default deployDynamicNft;
deployDynamicNft.tags = ["all", "dynamicsvg", "main"];
