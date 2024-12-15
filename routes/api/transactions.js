const express = require("express");
const { Alchemy, Network, AssetTransfersCategory } = require("alchemy-sdk");
const dotenv = require("dotenv");
dotenv.config();
const router = express.Router();
const settings = {
  apiKey: process.env.ALCHEMY_API_KEY,
  network: Network.ETH_MAINNET,
};

const alchemy = new Alchemy(settings);

router.get("/all/:tokenAddress/:walletAddress/:symbol", async (req, res) => {
  const { tokenAddress, walletAddress, symbol } = req.params;
  console.log("address-------->", tokenAddress, walletAddress);
  console.log("Alchemy API Key:", process.env.ALCHEMY_API_KEY);

  try {
    const transfers = await alchemy.core.getAssetTransfers({
      fromBlock: "0x0",
      toBlock: "latest",
      category: ["external", "erc20"],
      fromAddress: tokenAddress,
    });

    const tradeHistory = await Promise.all(
      transfers.transfers.map(async (transfer) => {
        const amount = parseFloat(transfer.value) / Math.pow(10, 18);
        // const price = await getPriceForToken(symbol);
        const status = determineTradeStatus(transfer.from, walletAddress);
        try {
          const res = await getCreationTimeOfBlock(transfer.blockNum);

          if (res) {
            return {
              name: symbol,
              hash: transfer.hash,
              from: transfer.from,
              to: transfer.to,
              amount: amount,
              timestamp: new Date(res),
              status: status,
            };
          } else {
            throw new Error("Error: getCreationTimeOfBlock returned null");
          }
        } catch (error) {
          console.error(error);
          return null; 
        }
      })
    );

    res.json(tradeHistory);
    console.log("Trading History ===>", tradeHistory);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).send("Error fetching transactions");
  }
});

function determineTradeStatus(fromAddress, walletAddress) {
  return fromAddress === walletAddress ? "sell" : "buy";
}
async function getCreationTimeOfBlock(hashBlock) {
  return new Promise((resolve, reject) => {
    alchemy.core
      .getBlock(hashBlock)
      .then((block) => {
        console.log("function------->", block);
        resolve(block.timestamp); // Resolve the promise with the timestamp
      })
      .catch((error) => {
        console.error("Error fetching block:", error);
        reject(error); // Reject the promise in case of an error
      });
  });
}
async function getPriceForToken(symbol) {
  try {
    const price = await alchemy.prices.getTokenPriceBySymbol(symbol);
    if (
      priceResponse &&
      priceResponse.prices &&
      Array.isArray(priceResponse.prices)
    ) {
      console.log("Token Prices By Symbol:");
      console.log(JSON.stringify(priceResponse.prices, null, 2));
      return priceResponse.prices; // Return the prices array
    } else {
      console.error("Unexpected response format:", priceResponse);
      return null; // Return null if the response format is unexpected
    }
  } catch (error) {
    console.error("Error fetching price:", error);
    return null; // Return null if there's an error fetching the price
  }
}

module.exports = router;
