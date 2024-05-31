import { EventLog } from "ethers";
import { ethers } from "hardhat";
import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { developmentChains, networkConfig } from "../hardhat-config-helper";
import {
    Metadata,
    storeImages,
    storeTokenUriMetadata,
} from "../utils/uploadToPinata";
import verify from "../utils/verify";

const VRF_SUB_FUND_AMOUNT = "1000000000000000000000";

const imagesLocation = "./images/randomNft/";
let tokenUris = [
    "ipfs://QmaVkBn2tKmjbhphU7eyztbvSQU5EXDdqRyXZtRhSGgJGo",
    "ipfs://QmYQC5aGZu2PTH8XzbJrbDnvhj3gVs7ya33H9mqUNvST3d",
    "ipfs://QmZYmH5iDbD6v3U2ixoVAjioSzvWJszDzYdbeCLquGSpVm",
];

const metadataTemplate: Metadata = {
    name: "",
    description: "",
    image: "",
    attributes: [
        {
            trait_type: "Cuteness",
            value: 100,
        },
    ],
};

const deployRandomIpfsNft: DeployFunction = async function (
    hre: HardhatRuntimeEnvironment
) {
    const accounts = await ethers.getSigners();
    const deployer = accounts[0];
    const chainId = hre.network.config.chainId!;
    let vrfCoordinatorV2Address: string;
    let subscriptionId: string;

    if (process.env.UPLOAD_TO_PINATA === "true") {
        tokenUris = await handleTokenUris();
    }

    if (developmentChains.includes(chainId)) {
        const vrfCoordinatorV2Mock = await hre.deployments.get(
            "VRFCoordinatorV2Mock"
        );
        vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address;
        const vrfCoordinatorV2 = await ethers.getContractAt(
            "VRFCoordinatorV2Mock",
            vrfCoordinatorV2Mock.address,
            deployer
        );
        const txResponse = await vrfCoordinatorV2.createSubscription();
        const txReceipt = await txResponse.wait(1);
        const eventLog = txReceipt?.logs[0] as EventLog;
        subscriptionId = eventLog.args["subId"];
        await vrfCoordinatorV2.fundSubscription(
            subscriptionId,
            VRF_SUB_FUND_AMOUNT
        );
    } else {
        vrfCoordinatorV2Address = networkConfig[chainId].vrfCoordinatorV2!;
        subscriptionId = networkConfig[chainId].subscriptionId!;
    }
    const mintFee = networkConfig[chainId].mintFee;
    const gasLane = networkConfig[chainId].gasLane;
    const callbackGasLimit = networkConfig[chainId].callbackGasLimit;
    const args = [
        vrfCoordinatorV2Address,
        gasLane,
        subscriptionId,
        callbackGasLimit,
        tokenUris,
        mintFee,
    ];
    const randomIpfsNft = await hre.deployments.deploy("RandomIpfsNft", {
        from: deployer.address,
        args: args,
        log: true,
        waitConfirmations: 1,
    });
    if (developmentChains.includes(chainId)) {
        const vrfCoordinatorV2Mock = await hre.deployments.get(
            "VRFCoordinatorV2Mock"
        );
        vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address;
        const vrfCoordinatorV2 = await ethers.getContractAt(
            "VRFCoordinatorV2Mock",
            vrfCoordinatorV2Mock.address,
            deployer
        );
        await vrfCoordinatorV2.addConsumer(
            subscriptionId,
            randomIpfsNft.address
        );
    }
    if (!developmentChains.includes(chainId) && process.env.ETHERSCAN_API_KEY) {
        await verify(randomIpfsNft.address, args);
    }
    hre.deployments.log("---------------------------------");
};

async function handleTokenUris(): Promise<string[]> {
    const tokenUris = [];
    const { responses: imageUploadResponses, files } = await storeImages(
        imagesLocation
    );
    for (const imageUploadResponseIndex in imageUploadResponses) {
        let tokenUriMetadata = { ...metadataTemplate };
        tokenUriMetadata.name = files[imageUploadResponseIndex].replace(
            ".png",
            ""
        );
        tokenUriMetadata.description = `An adorable ${tokenUriMetadata.name} pup!`;
        tokenUriMetadata.image = `ipfs://${imageUploadResponses[imageUploadResponseIndex].IpfsHash}`;
        console.log(`Uploading ${tokenUriMetadata.name}...`);
        const metadataUploadResponse = await storeTokenUriMetadata(
            tokenUriMetadata
        );
        tokenUris.push(`ipfs://${metadataUploadResponse!.IpfsHash}`);
    }
    console.log("Token URIs uploaded! They are:");
    console.log(tokenUris);
    return tokenUris;
}

export default deployRandomIpfsNft;
deployRandomIpfsNft.tags = ["all", "randomipfs", "main"];
