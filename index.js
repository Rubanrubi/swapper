const { ethers } = require("ethers")
const UNISWAP = require("@uniswap/sdk")
const fs = require('fs');
const { Token, WETH, Fetcher, Route, Trade, TokenAmount, TradeType, Percent} = require("@uniswap/sdk");
const { getAddress } = require("ethers/lib/utils");
const QUICKNODE_HTTP_ENDPOINT = "wss://speedy-nodes-nyc.moralis.io/876377052107f7b766ee28a7/bsc/testnet/archive/ws"
let provider = new ethers.providers.getDefaultProvider(QUICKNODE_HTTP_ENDPOINT)
const privateKey = fs.readFileSync(".secret").toString().trim()
const wallet = new ethers.Wallet(privateKey, provider)

UNISWAP_ROUTER_ADDRESS = "0x9Ac64Cc6e4415144C455BD8E4837Fea55603e5c3"
UNISWAP_ROUTER_ABI = fs.readFileSync("./abis/router.json").toString()
UNISWAP_ROUTER_CONTRACT = new ethers.Contract(UNISWAP_ROUTER_ADDRESS, UNISWAP_ROUTER_ABI, provider)

const DAI = new Token(
    UNISWAP.ChainId.TESTNET,
    "0x12Fff9d2c8eB274effd4Ce8d1127EF2977B96cCf",
    18
);

async function swapTokens(token1, token2, amount, slippage = "50") {


    // try {
        console.log('fdddddddddddd');
        const pair = await Fetcher.fetchTokenData(token1, token2, provider); //creating instances of a pair
        console.log(pair);
        const route = await new Route([pair], token2); // a fully specified path from input token to output token
        console.log(route);
        let amountIn = ethers.utils.parseEther(amount.toString()); //helper function to convert ETH to Wei
        amountIn = amountIn.toString()
        
        const slippageTolerance = new Percent(slippage, "10000"); // 50 bips, or 0.50% - Slippage tolerance
    
        const trade = new Trade( //information necessary to create a swap transaction.
                route,
                new TokenAmount(token2, amountIn),
                TradeType.EXACT_INPUT
        );

        const amountOutMin = trade.minimumAmountOut(slippageTolerance).raw; // needs to be converted to e.g. hex
        const amountOutMinHex = ethers.BigNumber.from(amountOutMin.toString()).toHexString();
        const path = [token2.address, token1.address]; //An array of token addresses
        const to = wallet.address; // should be a checksummed recipient address
        const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from the current Unix time
        const value = trade.inputAmount.raw; // // needs to be converted to e.g. hex
        const valueHex = await ethers.BigNumber.from(value.toString()).toHexString(); //convert to hex string
    
        //Return a copy of transactionRequest, The default implementation calls checkTransaction and resolves to if it is an ENS name, adds gasPrice, nonce, gasLimit and chainId based on the related operations on Signer.
        const rawTxn = await UNISWAP_ROUTER_CONTRACT.populateTransaction.swapExactETHForTokens(amountOutMinHex, path, to, deadline, {
            value: valueHex
        })
    
        //Returns a Promise which resolves to the transaction.
        let sendTxn = (await wallet).sendTransaction(rawTxn)
        

        //Resolves to the TransactionReceipt once the transaction has been included in the chain for x confirms blocks.
        let reciept = (await sendTxn).wait()

        //Logs the information about the transaction it has been mined.
        if (reciept) {
            console.log(" - Transaction is mined - " + '\n' 
            + "Transaction Hash:", (await sendTxn).hash
            + '\n' + "Block Number: " 
            + (await reciept).blockNumber + '\n' 
            + "Navigate to https://testnet.bscscan.com/txn/" 
            + (await sendTxn).hash, "to see your transaction")
        } else {
            console.log("Error submitting transaction")
        }

    // } catch(e) {
    //     console.log(e)
    // }
}

swapTokens("0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd","0x12Fff9d2c8eB274effd4Ce8d1127EF2977B96cCf", .0001) //first argument = token we want, second = token we have, the amount we want