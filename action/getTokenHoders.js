import axios from "axios";
const API_RATE_LIMIT = 1000;
import { sleep } from "./sleep.js";

export async function getTokenHolders(chain, address, retryCount = 0) {
  try {
    const data = await axios.get(
      `https://public-api.dextools.io/trial/v2/token/${chain}/${address}/info`,
      { headers: { "X-API-KEY": "E1ml8j809n74ylLvuV11FmOIrywJcei35pZZZE31", accept: "application/json" } }
    );
    const holders = data?.data?.holders;
    console.log("------holders----->", holders);
    console.log(`Holders trouvés pour ${address}: ${holders}`);

    if (holders === undefined || holders === null) {
      throw new Error("Données de holders non trouvées");
    }

    return holders;
  } catch (error) {
    console.log(
      `Erreur lors de la récupération des holders (tentative ${
        retryCount + 1
      }): ${error.message}`
    );

    if (retryCount < 2) {
      console.log(`Nouvelle tentative dans ${API_RATE_LIMIT}ms...`);
      await sleep(API_RATE_LIMIT);
      return getTokenHolders(chain, address, retryCount + 1);
    }

    console.log(
      "Échec de la récupération des holders après plusieurs tentatives"
    );
    return null;
  }
}
