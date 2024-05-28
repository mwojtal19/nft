import pinataSDK from "@pinata/sdk";
import "dotenv/config";
import fs from "fs";
import path from "path";

const pinataApiKey = process.env.PINATA_API_KEY || "";
const pinataApiSecret = process.env.PINATA_API_SECRET || "";
const pinata = new pinataSDK(pinataApiKey, pinataApiSecret);

interface MetadaAttribute {
    trait_type: string;
    value: number;
}

export interface Metadata {
    name: string;
    description: string;
    image: string;
    attributes: MetadaAttribute[];
}

export async function storeImages(imagesFilePath: string) {
    const fullImagesPath = path.resolve(imagesFilePath);
    const files = fs.readdirSync(fullImagesPath);
    let responses = [];
    for (const fileIndex in files) {
        const readableStreamForFile = fs.createReadStream(
            `${fullImagesPath}/${files[fileIndex]}`
        );
        const options = {
            pinataMetadata: {
                name: files[fileIndex],
            },
        };
        try {
            const response = await pinata.pinFileToIPFS(
                readableStreamForFile,
                options
            );
            responses.push(response);
        } catch (error) {
            console.log(error);
        }
    }
    return { responses, files };
}

export async function storeTokenUriMetadata(metadata: Metadata) {
    const options = {
        pinataMetadata: {
            name: metadata.name,
        },
    };
    try {
        const response = await pinata.pinJSONToIPFS(metadata, options);
        return response;
    } catch (error) {
        console.log(error);
    }
    return null;
}
