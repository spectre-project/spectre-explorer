import { useContext, useEffect, useState } from "react";
import { HiCurrencyDollar } from 'react-icons/hi';
import { IoMdTrendingDown, IoMdTrendingUp } from 'react-icons/io';
import { numberWithCommas } from "../helper";
import { getCoinSupply } from '../spectre-api-client';
import PriceContext from "./PriceContext";

const MarketDataBox = () => {
    const [circCoinsMData, setCircCoinsMData] = useState("-");
    const { price, marketData } = useContext(PriceContext);

    const initBox = async () => {
        const coin_supply = await getCoinSupply();
        setCircCoinsMData(Math.round(parseFloat(coin_supply.circulatingSupply) / 100000000));
    }

    useEffect(() => {
        initBox();
    }, []);

    return (
        <div className="cardBox mx-0">
            <table>
                <tr>
                    <td colSpan='2' className="text-center" style={{ fontSize: "3.8rem" }}>
                        <HiCurrencyDollar style={{ transform: "translateY(-10px)" }} />
                        <div id="light1" className="cardLight" />
                    </td>
                </tr>
                <tr>
                    <td colSpan="2" className="text-center">
                        <h3>Market data</h3>
                    </td>
                </tr>
                <tr>
                    <td className="cardBoxElement">Price</td>
                    <td>$ {price} / SPR</td>
                </tr>
                <tr>
                    <td style={{ fontSize: "small" }} className="cardBoxElement" align="right">1h %</td>
                    <td style={{ fontSize: "small" }} className="utxo-value-mono">
                        {marketData?.percent_change_1h > 0 ? <IoMdTrendingUp color='#398851' /> : <IoMdTrendingDown color='#d63328' />}
                        {marketData?.percent_change_1h?.toFixed(1)} %<br />
                    </td>
                </tr>
                <tr>
                    <td style={{ fontSize: "small" }} className="cardBoxElement" align="right">24h %</td>
                    <td style={{ fontSize: "small" }} className="utxo-value-mono">
                        {marketData?.percent_change_24h > 0 ? <IoMdTrendingUp color='#398851' /> : <IoMdTrendingDown color='#d63328' />}
                        {marketData?.percent_change_24h?.toFixed(1)} %<br />
                    </td>
                </tr>
                <tr>
                    <td style={{ fontSize: "small" }} className="cardBoxElement" align="right">7d %</td>
                    <td style={{ fontSize: "small" }} className="utxo-value-mono">
                        {marketData?.percent_change_7d > 0 ? <IoMdTrendingUp color='#398851' /> : <IoMdTrendingDown color='#d63328' />}
                        {marketData?.percent_change_7d?.toFixed(1)} %<br />
                    </td>
                </tr>
                <tr>
                    <td className="cardBoxElement">Volume</td>
                    <td className="pt-1">$ {numberWithCommas(marketData?.volume_24h)}</td>
                </tr>
                <tr>
                    <td className="cardBoxElement">MCAP</td>
                    <td className="pt-1">$ {(circCoinsMData * price / 1000000).toFixed(2)} M <a href="https://coinpaprika.com/coin/spr-spectre-network" target="_blank" className="rank ms-1">Rank #{marketData?.rank}</a></td>
                </tr>
            </table>
        </div>
    )
}

export default MarketDataBox;
