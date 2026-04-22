import React, { useEffect, useState } from "react";

// RPC URL of the chain backing the DApp — overrideable via REACT_APP_RPC_URL.
// Defaults to the local Ganache used during development.
const RPC_URL =
  process.env.REACT_APP_RPC_URL || "http://127.0.0.1:7545";

const Navbar = ({ walletAddress, onConnect, onToggleSidebar, user, onLogout }) => {
  const [blockNumber, setBlockNumber] = useState(null);
  const [gasGwei, setGasGwei] = useState(null);

  // Poll Ganache for chain heartbeat (block + gas price).
  useEffect(() => {
    let cancelled = false;

    const fetchChain = async () => {
      try {
        const bnRes = await fetch(RPC_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_blockNumber", params: [] }),
        });
        const bnJson = await bnRes.json();
        if (!cancelled && bnJson.result) setBlockNumber(parseInt(bnJson.result, 16));

        const gpRes = await fetch(RPC_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jsonrpc: "2.0", id: 2, method: "eth_gasPrice", params: [] }),
        });
        const gpJson = await gpRes.json();
        if (!cancelled && gpJson.result) {
          const wei = parseInt(gpJson.result, 16);
          setGasGwei((wei / 1e9).toFixed(2));
        }
      } catch (e) {
        // offline — leave nulls
      }
    };

    fetchChain();
    const id = setInterval(fetchChain, 6000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  const initials = (user?.name || user?.email || "U")
    .split(/[@\s]+/)[0]
    .slice(0, 2)
    .toUpperCase();

  const handle = user?.role === "admin" ? "lecturer.uel.eth" : "student.uel.eth";

  return (
    <header className="navbar">
      <div className="navbar-left">
        <button className="navbar-toggle" onClick={onToggleSidebar}>&#9776;</button>
        <div className="navbar-search">
          <span className="navbar-search-icon">&#9906;</span>
          <input
            className="navbar-search-input"
            placeholder="Search student, tx hash, block..."
          />
          <span className="navbar-search-kbd">⌘K</span>
        </div>
      </div>
      <div className="navbar-right">
        <div className="chain-pill" title="Ganache local chain heartbeat">
          <span className="pulse-dot" />
          <span className="chain-pill-main">GANACHE</span>
          <span className="chain-pill-sep">·</span>
          <span className="mono chain-pill-block">#{blockNumber ?? "…"}</span>
          <span className="chain-pill-sep">·</span>
          <span className="mono chain-pill-gas">{gasGwei ?? "—"} gwei</span>
        </div>

        {walletAddress ? (
          <button className="wallet-btn">
            <span className="wallet-identicon" />
            <span className="mono">{walletAddress.slice(0, 6)}…{walletAddress.slice(-4)}</span>
          </button>
        ) : (
          <button className="wallet-btn wallet-btn-connect" onClick={onConnect}>
            Connect Wallet
          </button>
        )}

        {user && (
          <div className="user-pill">
            <div className="user-avatar">{initials}</div>
            <div className="user-meta">
              <span className="user-name">{user.name || user.email}</span>
              <span className="user-handle mono">{handle}</span>
            </div>
            <button className="user-logout" onClick={onLogout} title="Logout">⎋</button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
