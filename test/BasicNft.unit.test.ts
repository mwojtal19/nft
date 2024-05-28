import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { assert } from "chai";
import { deployments, ethers, network } from "hardhat";
import { Deployment } from "hardhat-deploy/dist/types";
import { developmentChains } from "../hardhat-config-helper";
import { BasicNft } from "../typechain-types";

const chainId = network.config.chainId!;

!developmentChains.includes(chainId)
    ? describe.skip
    : describe("Basic NFT Unit Test", () => {
          let basicNft: BasicNft;
          let deployer: HardhatEthersSigner;
          let accounts: HardhatEthersSigner[];
          let tokenContract: Deployment;
          beforeEach(async () => {
              accounts = await ethers.getSigners();
              deployer = accounts[0];
              await deployments.fixture("all");
              tokenContract = await deployments.get("BasicNft");
              basicNft = await ethers.getContractAt(
                  "BasicNft",
                  tokenContract.address,
                  deployer
              );
          });

          describe("constructor", () => {
              it("initializes nft correctly", async () => {
                  const name = await basicNft.name();
                  const symbol = await basicNft.symbol();
                  const tokenCounter = await basicNft.getTokenCounter();
                  assert.equal(tokenCounter.toString(), "0");
                  assert.equal(name, "Dogie");
                  assert.equal(symbol, "DOG");
              });
          });
          describe("mint nft", () => {
              beforeEach(async () => {
                  const txResponse = await basicNft.mintNft();
                  await txResponse.wait(1);
              });
              it("Allows users to mint an NFT, and updates appropriately", async function () {
                  const tokenURI = await basicNft.tokenURI(0);
                  const tokenCounter = await basicNft.getTokenCounter();

                  assert.equal(tokenCounter.toString(), "1");
                  assert.equal(tokenURI, await basicNft.TOKEN_URI());
              });
              it("Show the correct balance and owner of an NFT", async function () {
                  const deployerAddress = deployer.address;
                  const deployerBalance = await basicNft.balanceOf(
                      deployerAddress
                  );
                  const owner = await basicNft.ownerOf("0");

                  assert.equal(deployerBalance.toString(), "1");
                  assert.equal(owner, deployerAddress);
              });
          });
      });
