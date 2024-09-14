import { useParams } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { CommitItem } from "./CommitItem";
import { CloseButton } from "../Prompt/CloseButton";
import axios from "axios";
import { AGGREGATOR } from "../../constants"

import { getFileType, u256ToBlobId } from "../../utils";
import debounce from 'lodash/debounce';

interface BlobObject {
  data: {
    objectId: string;
    version: string;
    digest: string;
    content: {
      dataType: string;
      type: string;
      hasPublicTransfer: boolean;
      fields: {
        blob_id: string;
        certified_epoch: string;
        erasure_code_type: number;
        id: {
          id: string;
        };
        size: string;
        storage: {
          type: string;
          fields: {
            end_epoch: string;
            id: object; // specific type later
            start_epoch: string;
            storage_size: string;
          }
        }
        stored_epoch: string;
      }
    }
  },
  fileType?: string;
}

async function getObjectDetails(objectId: string) {
  try {
    const response = await axios.post('https://fullnode.testnet.sui.io:443', {
      jsonrpc: "2.0",
      id: 1,
      method: "sui_getObject",
      params: [
        objectId,
        {
          showType: false,
          showOwner: false,
          showPreviousTransaction: false,
          showDisplay: false,
          showContent: true,
          showBcs: false,
          showStorageRebate: false
        }
      ]
    }, {
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const result: BlobObject = response.data.result;

    if (result?.data?.content?.fields?.blob_id) {
      const fileResp = await axios.get(`${AGGREGATOR}/v1/${u256ToBlobId(BigInt(result?.data?.content?.fields?.blob_id))}`, {
        responseType: 'arraybuffer',
      });
      const uint8Array = new Uint8Array(fileResp.data);
      const fileType = await getFileType(uint8Array);

      return { ...response.data.result, fileType };
    }

    return { ...response.data.result, fileType: "application/octet-stream" };
  } catch (error) {
    console.error("Error fetching object details:", error);
    throw error;
  }
}

export const CommitList = ({
  setDecalImageURL,
  isShowCommits,
  setIsShowCommits,
}) => {
  const [blobObjects, setBlobObjects] = useState<BlobObject[]>([]);
  const [filteredBlobObjects, setFilteredBlobObjects] = useState<BlobObject[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const { id } = useParams();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3; // Adjust this value as needed
  const [searchTerm, setSearchTerm] = useState("");

  const debouncedSearch = useCallback(
    debounce(async (value: string) => {
      try {
        setIsLoading(true);
        const selected = await getObjectDetails(value);
        console.log("Selected: ", selected);
        if (selected.data) {
          setBlobObjects([selected]);
        }
      } catch (error) {
        console.error("Error fetching object details:", error);
      } finally {
        setIsLoading(false);
      }
    }, 2000),
    []
  );

  useEffect(() => {
    if (isShowCommits) {
      getBlobObjects(currentPage);
    }
  }, [isShowCommits, currentPage]);

  useEffect(() => {
    const filtered = blobObjects.filter(blobObject =>
      blobObject.data.objectId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      blobObject.fileType?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredBlobObjects(filtered);
  }, [searchTerm, blobObjects]);

  useEffect(() => {
    if (searchTerm) {
      debouncedSearch(searchTerm);
    } else {
      setBlobObjects([]);
    }
  }, [searchTerm, debouncedSearch]);

  async function getBlobObjects(page: number) {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const response = await axios.post('https://fullnode.testnet.sui.io:443', {
        jsonrpc: "2.0",
        id: 1,
        method: "suix_getOwnedObjects",
        params: [
          "0xf1346af6127e9b1717f31a91df9ab26331731dcc7940a881aa2a3fd9e6df099d",
          {
            filter: {
              MatchAll: [
                {
                  StructType: "0x7e12d67a52106ddd5f26c6ff4fe740ba5dea7cfc138d5b1d33863ba9098aa6fe::blob::Blob"
                }
              ]
            },
            options: {
              showType: false,
              showOwner: false,
              showPreviousTransaction: false,
              showDisplay: false,
              showContent: true,
              showBcs: false,
              showStorageRebate: false
            },
          },
          cursor,
          itemsPerPage
        ]
      }, {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const blobObjects = response.data.result.data.map((blobObject: BlobObject) => ({
        ...blobObject,
        fileType: "application/octet-stream",
      }));
      setBlobObjects(blobObjects);
      setFilteredBlobObjects(blobObjects);
      setCursor(response.data.result.nextCursor);
      setHasNextPage(response.data.result.hasNextPage);
    } catch (error) {
      console.error("Error loading objects:", error);
    } finally {
      setIsLoading(false);
    }
  }

  function handlePageChange(newPage: number) {
    setCurrentPage(newPage);
  }

  function handleShowCommits() {
    setIsShowCommits(!isShowCommits);
  }

  function handleSearch(event: React.ChangeEvent<HTMLInputElement>) {
    setSearchTerm(event.target.value);
  }

  return (
    <>
      {isShowCommits && (
        <div className="absolute top-[-380px] left-[-5px] z-10 w-[600px] bg-gray-900 rounded-lg shadow-xl overflow-hidden">
          <div className="flex justify-between items-center p-4 bg-gray-800">
            <h2 className="text-xl font-semibold text-gray-200">Blob Objects</h2>
            <CloseButton toggleSidebar={handleShowCommits} />
          </div>
          <div className="p-4">
            <input
              type="text"
              placeholder="Search by Blob ID or File Type"
              value={searchTerm}
              onChange={handleSearch}
              className="w-full p-2 mb-4 bg-gray-700 text-gray-200 rounded-md"
            />
            {isLoading ? (
              <div className="text-center py-4 text-gray-200">
                Loading...
              </div>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-700 text-gray-200 text-left">
                    <th className="py-3 px-4 font-semibold text-center">Blob ID</th>
                    <th className="py-3 px-4 font-semibold text-center">File type</th>
                    <th className="py-3 px-4 font-semibold text-center">Owner</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBlobObjects.map((blobObject) => (
                    <CommitItem
                      blobObject={blobObject}
                      key={blobObject.data.objectId}
                      setDecalImageURL={setDecalImageURL}
                    />
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="flex justify-between items-center p-4 bg-gray-800">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1 || isLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-gray-200 font-medium">Page {currentPage}</span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={!hasNextPage || isLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </>
  );
};
