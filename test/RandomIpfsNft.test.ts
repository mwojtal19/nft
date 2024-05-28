import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { assert, expect } from "chai";
import { EventLog, formatUnits, parseEther } from "ethers";
import { deployments, ethers, network } from "hardhat";
import { Deployment } from "hardhat-deploy/dist/types";
import { developmentChains, networkConfig } from "../hardhat-config-helper";
import { RandomIpfsNft, VRFCoordinatorV2Mock } from "../typechain-types";

const chainId = network.config.chainId!;

const tokenUris = [
    "ipfs://QmaVkBn2tKmjbhphU7eyztbvSQU5EXDdqRyXZtRhSGgJGo",
    "ipfs://QmYQC5aGZu2PTH8XzbJrbDnvhj3gVs7ya33H9mqUNvST3d",
    "ipfs://QmZYmH5iDbD6v3U2ixoVAjioSzvWJszDzYdbeCLquGSpVm",
];

!developmentChains.includes(chainId)
    ? describe.skip
    : describe("Random IPFS NFT Unit Test", () => {
          let randomIpfsNft: RandomIpfsNft;
          let vrfCoordinatorV2Mock: VRFCoordinatorV2Mock;
          let deployer: HardhatEthersSigner;
          let accounts: HardhatEthersSigner[];
          let tokenContract: Deployment;
          beforeEach(async () => {
              accounts = await ethers.getSigners();
              deployer = accounts[0];
              await deployments.fixture(["mocks", "randomipfs"]);
              tokenContract = await deployments.get("RandomIpfsNft");
              const vrfCoordinatorV2MockContract = await deployments.get(
                  "VRFCoordinatorV2Mock"
              );
              randomIpfsNft = await ethers.getContractAt(
                  "RandomIpfsNft",
                  tokenContract.address,
                  deployer
              );
              vrfCoordinatorV2Mock = await ethers.getContractAt(
                  "VRFCoordinatorV2Mock",
                  vrfCoordinatorV2MockContract.address,
                  deployer
              );
          });

          describe("constructor", () => {
              it("initializes nft correctly", async () => {
                  const name = await randomIpfsNft.name();
                  const symbol = await randomIpfsNft.symbol();
                  const vrfCoordinatorV2 =
                      await randomIpfsNft.getVrfCoordinatorV2();
                  const gasLane = await randomIpfsNft.getGasLane();
                  const subscriptionId =
                      await randomIpfsNft.getSubscriptionId();
                  const callbackGasLimit =
                      await randomIpfsNft.getCallbackGasLimit();
                  const mintFee = await randomIpfsNft.getMintFee();
                  const nftCounter = await randomIpfsNft.getTokenCounter();

                  assert.equal(name, "Random IPFS NFT");
                  assert.equal(symbol, "RIP");
                  for (let i = 0; i < nftCounter; i++) {
                      const nftTokenUri = await randomIpfsNft.getNftTokenUris(
                          i
                      );
                      assert.equal(nftTokenUri, tokenUris[i]);
                  }
                  assert.equal(
                      vrfCoordinatorV2,
                      await vrfCoordinatorV2Mock.getAddress()
                  );
                  assert.equal(gasLane, networkConfig[chainId].gasLane);
                  assert.equal(subscriptionId.toString(), "1"); // 1 because of mock
                  assert.equal(
                      callbackGasLimit.toString(),
                      networkConfig[chainId].callbackGasLimit
                  );
                  assert.equal(mintFee, networkConfig[chainId].mintFee);
              });
          });

          describe("requestNft", () => {
              it("should revert with needMoreEthSent error", async () => {
                  const lowerMintFee = parseEther("0.001");
                  await expect(
                      randomIpfsNft.requestNft({ value: lowerMintFee })
                  ).to.be.revertedWithCustomError(
                      randomIpfsNft,
                      "RandomIpfsNft__NeedMoreEthSent"
                  );
              });
              it("should return requestId, add sender to mapping and emit event", async () => {
                  const mintFee = parseEther("0.02");
                  await expect(
                      randomIpfsNft.requestNft({
                          value: mintFee,
                      })
                  ).to.emit(randomIpfsNft, "NftRequested");
              });
          });

          describe("fulfillRandomWords", () => {
              it("should mint NFT after random words returned", async () => {
                  const mintFee = parseEther("0.02");
                  await new Promise<void>(async (resolve, reject) => {
                      randomIpfsNft.once(
                          randomIpfsNft.filters.NftMinted,
                          async () => {
                              const tokenUri =
                                  await randomIpfsNft.getNftTokenUris(0);
                              const tokenCounter =
                                  await randomIpfsNft.getTokenCounter();
                              assert.equal(tokenCounter.toString(), "1");
                              assert.equal(
                                  tokenUri.startsWith("ipfs://"),
                                  true
                              );
                              resolve();
                          }
                      );
                      try {
                          const requestNftResponse =
                              await randomIpfsNft.requestNft({
                                  value: mintFee,
                              });
                          const requestNftReceipt =
                              await requestNftResponse.wait(1);
                          const log = requestNftReceipt?.logs[1] as EventLog;
                          const requestId = log.args["requestId"];
                          await vrfCoordinatorV2Mock.fulfillRandomWords(
                              requestId,
                              await randomIpfsNft.getAddress()
                          );
                      } catch (e) {
                          console.log(e);
                          reject(e);
                      }
                  });
              });
          });

          describe("withdraw", () => {
              it("should withdraw to deployer", async () => {
                  const mintFee = parseEther("0.02");
                  const user = accounts[1];
                  const userRandomIpfsNft = randomIpfsNft.connect(user);
                  await userRandomIpfsNft.requestNft({ value: mintFee });
                  const deployerBalanceBeforeWithdraw =
                      await ethers.provider.getBalance(deployer);
                  const txResponse = await randomIpfsNft.withdraw();
                  const txReceipt = await txResponse.wait(1);
                  const gasCost = txReceipt?.gasPrice! * txReceipt?.gasUsed!;
                  const deployerBalanceAfterWithdraw =
                      await ethers.provider.getBalance(deployer);
                  assert.equal(
                      formatUnits(
                          deployerBalanceBeforeWithdraw - gasCost + mintFee,
                          "ether"
                      ),
                      formatUnits(deployerBalanceAfterWithdraw, "ether")
                  );
              });
          });

          describe("getBreedFromModdedRng", () => {
              it("should revert with RangeOutOfBounds error", async () => {
                  await expect(
                      randomIpfsNft.getBreedFromModdedRng(150)
                  ).to.be.revertedWithCustomError(
                      randomIpfsNft,
                      "RandomIpfsNft__RangeOutOfBounds"
                  );
              });
              it("should return PUG", async () => {
                  const txResponse = await randomIpfsNft.getBreedFromModdedRng(
                      5
                  );
                  assert.equal(txResponse.toString(), "0");
              });
              it("should return ShibaInu", async () => {
                  const txResponse = await randomIpfsNft.getBreedFromModdedRng(
                      15
                  );
                  assert.equal(txResponse.toString(), "1");
              });
              it("should return StBernard", async () => {
                  const txResponse = await randomIpfsNft.getBreedFromModdedRng(
                      50
                  );
                  assert.equal(txResponse.toString(), "2");
              });
          });
      });
