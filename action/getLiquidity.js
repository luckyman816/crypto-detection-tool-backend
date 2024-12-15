import axios from "axios";
const API_RATE_LIMIT = 1000;
import { sleep } from "./sleep.js";

export async function getLiquidity(poolAddress, retryCount = 0) {
  console.log(
    `Récupération de la liquidité pour le pool : ${poolAddress} (tentative ${
      retryCount + 1
    })`
  );
  try {
    const data = await axios.get(
      `https://public-api.dextools.io/trial/v2/pool/ether/${poolAddress}/liquidity`,
      { headers: { "X-API-KEY": "E1ml8j809n74ylLvuV11FmOIrywJcei35pZZZE31", accept: "application/json" } }
    );
    console.log(`Données de liquidité reçues : ${JSON.stringify(data)}`);
    return data?.data?.liquidity || 0;
  } catch (error) {
    if (retryCount < 2) {
      console.log(`Nouvelle tentative après erreur : ${error.message}`);
      await sleep(API_RATE_LIMIT);
      return getLiquidity(poolAddress, retryCount + 1);
    }
    throw error;
  }
}