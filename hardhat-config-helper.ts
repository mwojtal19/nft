import { parseEther } from "ethers";

interface NetworkConfig {
    [key: number]: {
        name: string;
        vrfCoordinatorV2?: string;
        mintFee: bigint;
        gasLane: string;
        subscriptionId?: string;
        callbackGasLimit: string;
    };
}

export const networkConfig: NetworkConfig = {
    11155111: {
        name: "sepolia",
        vrfCoordinatorV2: "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625",
        gasLane:
            "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c",
        subscriptionId:
            "85269588487918832052074615743894198111578906957693653135143052591365758095129",
        callbackGasLimit: "500000",
        mintFee: parseEther("0.01"),
    },
    31337: {
        name: "hardhat",
        gasLane:
            "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c",
        callbackGasLimit: "500000",
        mintFee: parseEther("0.01"),
    },
};

export const developmentChains = [31337];
export const DECIMALS = 8;
export const INITIAL_SUPPLY = "1000000000000000000000000";
