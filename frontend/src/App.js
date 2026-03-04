import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import CheckIn from "./pages/CheckIn";
import Verify from "./pages/Verify";
import { connectWallet, isWalletConnected } from "./utils/wallet";

function App() {
  const [walletAddress, setWalletAddress] = useState(null);

  useEffect(() => {
    const checkWallet = async () => {
      const connected = await isWalletConnected();
      if (connected && window.ethereum) {
        const accounts = await window.ethereum.request({ method: "eth_accounts" });
        setWalletAddress(accounts[0]);
      }
    };
    checkWallet();
  }, []);

  const handleConnect = async () => {
    const wallet = await connectWallet();
    if (wallet) {
      setWalletAddress(wallet.address);
    }
  };

  return (
    <Router>
      <Navbar walletAddress={walletAddress} />
      {!walletAddress && (
        <div style={styles.connectBar}>
          <button onClick={handleConnect} style={styles.connectBtn}>
            Connect MetaMask Wallet
          </button>
        </div>
      )}
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/check-in" element={<CheckIn walletAddress={walletAddress} />} />
        <Route path="/verify" element={<Verify />} />
      </Routes>
    </Router>
  );
}

const styles = {
  connectBar: {
    textAlign: "center",
    padding: "15px",
    backgroundColor: "#fff3cd",
  },
  connectBtn: {
    padding: "10px 24px",
    fontSize: "16px",
    backgroundColor: "#f6851b",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
};

export default App;