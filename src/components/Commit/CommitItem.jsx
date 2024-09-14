import { u256ToBlobId } from "../../utils";

export const CommitItem = ({ blobObject, setDecalImageURL }) => {
  function viewCommit(eueno_url) {
    console.log(eueno_url);
    setDecalImageURL(eueno_url);
  }

  const shorten = (str) => {
    return `${str.slice(0, 5)}...${str.slice(-5)}`;
  };

  return (
    <tr className="[font-family:'Gabarito-Regular',Helvetica] font-normal text-[16px] tracking-[0] leading-[normal] whitespace-nowrap text-text-color">
      <td
        className="text-center border-r border-solid border-collection-1-line px-[20px] py-[10px] truncate"
        onClick={() => {
          // Convert to BigInt before passing to u256ToBlobId
          const blobIdBigInt = BigInt(blobObject.data.content.fields["blob_id"]);
          const blobId = u256ToBlobId(blobIdBigInt);
          navigator.clipboard.writeText(blobId);
          alert('Blob ID copied to clipboard!');
        }}
      >
        {shorten(u256ToBlobId(BigInt(blobObject.data.content.fields["blob_id"])))}
      </td>
      <td className="text-center border-r border-solid border-collection-1-line px-[20px] py-[10px] truncate"></td>
      <td className="text-center border-r border-solid border-collection-1-line px-[20px] py-[10px] truncate">
        {shorten(
          "0xf1346af6127e9b1717f31a91df9ab26331731dcc7940a881aa2a3fd9e6df099d"
        )}
      </td>
    </tr>
  );
};
