// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Base64} from "base64-sol/base64.sol";

contract DynamicSvgNft is ERC721 {
    uint256 s_tokenCounter;
    string private i_lowImage;
    string private i_highImage;
    string private constant base64EncodedSvgPrefix =
        "data:image/svg+xml;base64,";

    constructor(
        string memory lowSvg,
        string memory highSvg
    ) ERC721("Dynamic SVG NFT", "DSN") {
        s_tokenCounter = 0;
    }

    function svgToImageURI(
        string memory svg
    ) public pure returns (string memory) {
        string memory svgBase64Encoded = Base64.encode(
            bytes(string(abi.encodePacked(svg)))
        );
        return
            string(abi.encodePacked(base64EncodedSvgPrefix, svgBase64Encoded));
    }

    function mintNft() public {
        _safeMint(msg.sender, s_tokenCounter);
        s_tokenCounter += 1;
    }
}
