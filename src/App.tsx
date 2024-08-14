import { WsProvider, ApiPromise } from "@polkadot/api"
import { web3Accounts, web3Enable, web3FromAddress } from "@polkadot/extension-dapp";
import { InjectedAccountWithMeta } from "@polkadot/extension-inject/types";
import { ChangeEvent, useEffect, useState } from "react"
import BN from "bn.js"

const NAME = "DUDS";

type Period = "MORNING" | "NIGHT" | "EVENING" | "AFTERNOON";

const App = () => {
  const [api, setApi] = useState<ApiPromise>();
  const [accounts, setAccounts] = useState<InjectedAccountWithMeta[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<InjectedAccountWithMeta>();
  const [period, setPeriod] = useState<Period>();
  const [balance, setBalance] = useState<BN>();

  const AMOUNT = new BN(10).mul(new BN(10).pow(new BN(12)));
  const setup = async () => {

    const wsProvider = new WsProvider("wss://kusama.rpc.ipci.io");

    const api = await ApiPromise.create({ provider: wsProvider });

    setApi(api)
  }

  const handleConnection = async () => {
    const extensions = await web3Enable(NAME);

    if (!extensions) {
      throw Error("NO EXTENSIONS");
    }

    const allAccounts = await web3Accounts();

    setAccounts(allAccounts);

    if (allAccounts.length === 1) {
      setSelectedAccount(allAccounts[0]);
    }
  };

  const handleAccountSelection = async (e: ChangeEvent<HTMLSelectElement>) => {
    const selectedAddress = e.target.value;

    const account = accounts.find(account => account.address === selectedAddress);

    if (!account) {
      throw Error("NO ACCOUNTS");
    }

    setSelectedAccount(account);

  }

  const handleBurn = async () => {
    if (!api) return;
    if (!selectedAccount) return;

    const injector = await web3FromAddress(selectedAccount.address);

    await api.tx.currencies.burnFren(AMOUNT).signAndSend(selectedAccount.address, {
      signer: injector.signer
    });
  }

  useEffect(() => {
    setup()
  }, []);

  useEffect(() => {
    if (!api) return;

    (async () => {
      const period = (
        await api.query.currencies.currentTimePeriod()
      ).toPrimitive() as String;

      const parsedPerio = period.toUpperCase();
      console.log(period);
    })
  }, []);

  useEffect(() => {
    if (!api) return;

    if (!selectedAccount) return;

    api.query.system.account(
      selectedAccount.address,
      ({ data: { free } }: { data: { free: BN } }) => {
        setBalance(free);
        console.log(free.toString());
      });
  }, [api, selectedAccount]);

  return (
    <div>

      {accounts.length === 0 ? (
        <button onClick={handleConnection} className="bg-orange-900 text-orange-400">Connect</button>
      ) : null}
      {accounts.length > 0 ? (
        <>
          <select onChange={handleAccountSelection}>
            <option value="" selected disabled hidden>Choose your account</option>
            {accounts.map((account) => (
              <option value={account.address}>{account.meta.name || account.address}</option>
            ))}
          </select>
        </>
      ) : null}
      {selectedAccount ? (
        <>
          <button onClick={handleBurn}>Burn 10</button>
          <span>Balance: {balance?.toString()}</span>
        </>
      ) : null}
    </div>
  )
}

export default App
