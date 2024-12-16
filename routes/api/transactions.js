const express = require("express");
const { Alchemy, Network, AssetTransfersCategory } = require("alchemy-sdk");
const dotenv = require("dotenv");
const axios = require("axios");
dotenv.config();
const router = express.Router();
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
const settings = {
  apiKey: process.env.ALCHEMY_API_KEY,
  network: Network.ETH_MAINNET,
};

const alchemy = new Alchemy(settings);

router.get("/all/:tokenAddress/:walletAddress/:symbol", async (req, res) => {
  const { tokenAddress, walletAddress, symbol } = req.params;
  console.log("address-------->", tokenAddress, walletAddress);
  console.log("Alchemy API Key:", ALCHEMY_API_KEY);

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
          const timestamp = await getCreationTimeOfBlock(transfer.blockNum);
          if (timestamp) {
            return {
              name: symbol,
              hash: transfer.hash,
              from: transfer.from,
              to: transfer.to,
              amount: amount,
              timestamp: convertTimestampToDate(timestamp),
              status: status,
              // price: getPrice(transfer.hash),
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
function convertTimestampToDate(unixTimestamp) {
  const date = new Date(unixTimestamp * 1000);

  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  };

  return date.toLocaleString("en-US", options);
}
async function getPrice(txHash) {
  try {
    // Fetch transaction details from Alchemy API using eth_getTransactionByHash
    const response = await axios.post(
      `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_API_KEY}`,
      {
        jsonrpc: "2.0",
        id: 1,
        method: "eth_getTransactionByHash",
        params: [txHash],
      }
    );

    const transaction = response.data.result;

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    const valueInWei = transaction.value;
    if (valueInWei == "0x0") {
      return 0;
    } else {
      const valueInEther = parseInt(valueInWei, 16) / 1e18;

      // // You may want to fetch the current ETH price to convert it to USD
      const ethPriceResponse = await axios.get(
        "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
      );

      const ethPriceInUSD = ethPriceResponse.data.ethereum.usd;
      // // Calculate the value in USD at the time of purchase
      const valueInUSD = valueInEther * ethPriceInUSD;
      console.log(
        "------getPrice------>",
        valueInEther,
        ethPriceInUSD,
        valueInUSD
      );

      return valueInUSD;
    }
    // return res.json({
    //   transaction,
    //   valueInUSD: valueInUSD.toFixed(2),
    //   ethPriceAtPurchase: ethPriceInUSD,
    // });
  } catch (error) {
    console.error("Error fetching transaction:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
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

module.exports = router;
