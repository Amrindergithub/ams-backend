import { ethers } from "ethers";

export const connectWallet = async () => {
  if (!window.ethereum) {
    alert("Please install MetaMask to use this DApp");
    return null;
  }

  const accounts = await window.ethereum.request({
    method: "eth_requestAccounts",
  });

  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();

  return {
    address: accounts[0],
    provider,
    signer,
  };
};

export const isWalletConnected = async () => {
  if (!window.ethereum) return false;
  const accounts = await window.ethereum.request({ method: "eth_accounts" });
  return accounts.length > 0;
};