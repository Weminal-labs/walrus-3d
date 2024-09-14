import React, { useState } from "react";

import CustomButton from "./CustomButton";
import { PUBLISHER } from "../constants";
import axios from "axios";
import { getObjectDetails } from "./Commit/CommitList";

interface AlreadyCertified {
  blobId: string;
  event: {
    txDigest: string;
    eventSeq: string;
  };
  endEpoch: number;
}

interface NewlyCreated {
  blobObject: {
    id: string;
    storedEpoch: number;
    blobId: string;
    size: number;
    erasureCodeType: string;
    certifiedEpoch: number;
    storage: object; // You might want to define a more specific type for this
  };
  encodedSize: number;
  cost: number;
}

interface UploadedData {
  alreadyCertified?: AlreadyCertified;
  newlyCreated?: NewlyCreated;
}

async function uploadFile(file: File, showToast: (message: string) => void, setIsLoading: (loading: boolean) => void, setDecalImageURL) {
  console.log("uploadFile called");
  setIsLoading(true);
  try {
    const response = await fetch(`${PUBLISHER}/v1/store`, {
      method: "PUT",
      body: file,
    });

    if (response.status === 200) {
      const data = await response.json();
      console.log(data);

      if (data.newlyCreated && data.newlyCreated.blobObject) {
        setDecalImageURL(`https://cdn.suiftly.io/blob/${data.newlyCreated.blobObject.blobId}`);
        showToast(`Sui Object ID: ${data.newlyCreated.blobObject.id}`);
      } else if (data.alreadyCertified) {
        console.log("Already certified:", data.alreadyCertified);
        setDecalImageURL(`https://cdn.suiftly.io/blob/${data.alreadyCertified.blobId}`);
        const { blobId } = data.alreadyCertified;
        const { txDigest, eventSeq } = data.alreadyCertified.event;
        
        const txResponse = await axios.post(
          "https://fullnode.testnet.sui.io:443",
          {
            jsonrpc: "2.0",
            id: 1,
            method: "sui_getTransactionBlock",
            params: [
              txDigest,
              {
                showInput: true,
                showRawInput: false,
                showEffects: true,
                showEvents: true,
                showObjectChanges: false,
                showBalanceChanges: false,
                showRawEffects: false,
              },
            ],
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

        const modifiedObjects = txResponse.data.result.effects.modifiedAtVersions;
        const objectDetails = await Promise.all(modifiedObjects.map(obj => getObjectDetails(obj.objectId)));
        
        console.log("Modified objects details:", objectDetails);
        
        const blobObject = objectDetails.find(obj => obj.data.content.type == "0x7e12d67a52106ddd5f26c6ff4fe740ba5dea7cfc138d5b1d33863ba9098aa6fe::blob::Blob");
        if (blobObject) {
          showToast(`Sui Object ID: ${blobObject.data.objectId}`);
        } else {
          showToast("Blob object not found in transaction");
        }
      }
    } else {
      throw new Error("Something went wrong when storing the blob!");
    }
  } catch (error) {
    showToast(`Error uploading file: ${error.message}`);
    throw error;
  } finally {
    setIsLoading(false);
  }
}

const FilePicker = ({ file, setFile, readFile, showToast, setDecalImageURL }) => {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="filepicker-container">
      <div className="flex-1 flex flex-col">
        <input
          id="file-upload"
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files[0])}
        />
        <label htmlFor="file-upload" className="filepicker-label">
          Upload File
        </label>

        <p className="mt-2 text-gray-200 text-xs truncate">
          {file === "" ? "No file selected" : file.name}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-3 items-center">
        <div className="relative">
          <CustomButton
            type="outline"
            title="Upload"
            handleClick={() => uploadFile(file, showToast, setIsLoading, setDecalImageURL)}
            customStyles="text-xs"
            disabled={isLoading || !file}
          />
          {isLoading && (
            <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50 rounded">
              <div className="w-5 h-5 border-t-2 border-blue-500 rounded-full animate-spin"></div>
            </div>
          )}
        </div>
        <CustomButton
          type="outline"
          title="Logo"
          handleClick={() => readFile("logo")}
          customStyles="text-xs"
        />
        <CustomButton
          type="filled"
          title="Full"
          handleClick={() => readFile("full")}
          customStyles="text-xs"
        />
      </div>
    </div>
  );
};

export default FilePicker;
