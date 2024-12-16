// routes/api.js
const express = require("express");
const axios = require("axios");
const axiosRetry = require("axios-retry").default;
const moment = require("moment");
const Token = require("../../models/Token");
const dotenv = require("dotenv");
dotenv.config();

const router = express.Router();
const API_KEY = process.env.API_KEY;
const BASE_URL = process.env.BASE_URL;

axiosRetry(axios, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  shouldResetTimeout: true,
  retryCondition: (error) => {
    return (
      error.response &&
      (error.response.status === 429 || error.response.status >= 500)
    );
  },
});

router.post("/all", async (req, res) => {
  const { startDate, endDate, startValue, endValue } = req.body;
  console.log("------->", startDate, endDate, startValue, endValue);
  if (!BASE_URL) {
    return res.status(500).send("Base URL is not defined.");
  }
  try {
    await axios
      .get(
        `${BASE_URL}/v2/pool/ether?sort=creationTime&order=desc&from=${startDate}&to=${endDate}&page=0&pageSize=50`,
        {
          headers: {
            "X-API-KEY": API_KEY,
            accept: "application/json",
          },
        }
      )
      .then((response) => {
        const results = response.data.data.results.slice(0,10);
        res.json(results);
      });
  } catch (error) {
    console.error(error);

    if (error.response && error.response.status === 429) {
      return res.status(429).send("Too many requests. Please try again later.");
    }

    res.status(500).send("Error fetching tokens");
  }
});
router.post("/find", async (req, res) => {
  const { results, startValue, endValue } = req.body;
  const tokens = [];
  try {
    for (const pool of results) {
      console.log("Base URL---->:", BASE_URL, pool.address);

      const liquidityResponse = await axios.get(
        `${BASE_URL}/v2/pool/ether/${pool.address}/liquidity`,
        {
          headers: { "X-API-KEY": API_KEY, accept: "application/json" },
        }
      );

      const holdersResponse = await axios.get(
        `${BASE_URL}/v2/token/ether/${pool.mainToken.address}/info`,
        {
          headers: { "X-API-KEY": API_KEY, accept: "application/json" },
        }
      );

      const liquidity = liquidityResponse.data.data.liquidity || 0;
      const holders = holdersResponse.data.data.holders || 0;

      if (liquidity <= endValue && liquidity >= startValue) {
        tokens.push({
          token_address: pool.mainToken.address,
          pool_address: pool.address,
          name: pool.mainToken.name,
          symbol: pool.mainToken.symbol,
          liquidity,
          holders,
          creationTime: pool.creationTime,
        });
      }
      new Promise((resolve) => setTimeout(resolve, 500));
    }
    const validTokens = tokens.filter((token) => token);
    res.json(validTokens);
    await Token.insertMany(validTokens);
  } catch (error) {
    console.error(error);

    if (error.response && error.response.status === 429) {
      return res.status(429).send("Too many requests. Please try again later.");
    }

    res.status(500).send("Error fetching tokens");
  }
});

module.exports = router;
