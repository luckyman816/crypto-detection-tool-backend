const mongoose = require('mongoose');

const TokenSchema = new mongoose.Schema({
    token_address: { type: String, required: true },
    pool_address: { type: String, required: true },
    name: { type: String, required: true },
    symbol: { type: String, required: true },
    liquidity: { type: Number, required: true },
    holders: { type: Number },
    creationTime: { type: Date, required: true }
});

module.exports = mongoose.model('Token', TokenSchema);
