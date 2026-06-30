# 🔮 Pollapse — Cross-Market Intelligence & Smart Trading Terminal

> The **Bloomberg Terminal of Prediction Markets**. Spot hidden correlations, calculate sector sentiments, scan convergence signals, and build multi-market theses on top of the Polymarket CLOB V2 with gasless direct execution.

---

## 🚀 Key Features

* **🔗 Interactive Correlation Web:** A hardware-accelerated D3.js force-directed physics graph clustering prediction events based on real-time Pearson correlation ($r$) coefficients. Nodes scale logarithmically with trade volume and glow by sector.
* **📊 Log-Volume Weighted Sector Indices:** Track politics, crypto, tech, sports, geopolitics, and economics composite sentiment indices. Log-volume weighting prevents outliers (e.g. US Presidential Election) from skewing category tracking.
* **⚡ Live Divergence (Alpha) Scanner:** Automatically identifies price inefficiencies between highly correlated contracts and generates convergence trade hypotheses (e.g., *Buy lagging YES / Buy overpriced NO*).
* **🧠 Portfolio Thesis Workspace:** Model complex, multi-legged macro bets. Scans legs for directional concentration dependencies and alerts you of correlation redundancies to preserve capital efficiency.
* **💹 Dynamic Asset detailed Workspaces:** Renders detailed spec sheets, liquidity depths, and responsive vector price timelines for individual Polymarket event slugs.
* **⚡ One-Click Gasless Execution:** Directly onboard via Privy, deploy a dedicated smart contract wallet (Gnosis Safe proxy) gaslessly, batch spending authorizations, and execute attributed orders directly from the terminal.

---

## 🏗️ System Architecture & Math

Pollapse fetches price coordinates and volume tuples directly from Polymarket's public Gamma & CLOB endpoints serverless and caches them utilizing shared Vercel KV Redis caches with local in-memory fallbacks.

```
                   +---------------------------+
                   |   Polymarket Gamma API    |
                   |   & CLOB V2 Midpoint API  |
                   +-------------+-------------+
                                 |
                                 v
                   +-------------+-------------+
                   |  lib/polymarket.ts Client |
                   +-------------+-------------+
                                 |
                                 v
                   +-------------+-------------+
                   |       app/api Layer       |
                   |  (Cached Proxy / Compute) |
                   +-------------+-------------+
                                 |
         +-----------------------+-----------------------+
         |                       |                       |
         v                       v                       v
+--------+--------+     +--------+--------+     +--------+--------+
|  /api/sectors   |     | /api/correlations |    | /api/markets    |
+--------+--------+     +--------+--------+     +--------+--------+
         |                       |                       |
         v                       v                       v
+--------+--------+     +--------+--------+     +--------+--------+
|  /sectors Page  |     |  /correlations  |     |  /thesis &      |
|  Indices Gauge  |     |   D3 Web Graph  |     |  /divergences   |
+-----------------+     +-----------------+     +-----------------+
```

### Pearson Correlation Alignment
For any aligned pricing vectors $X$ and $Y$:
$$r = \frac{\sum (X_i - \bar{X})(Y_i - \bar{Y})}{\sqrt{\sum (X_i - \bar{X})^2 \sum (Y_i - \bar{Y})^2}}$$

### Logarithmic Volume Index Averages
$$\text{Weight}_i = \log_{10}(Volume_{USD_i} + 1) + 1$$
$$\text{Sector Sentiment Index} = \frac{\sum (Price_i \times Weight_i)}{\sum Weight_i}$$

---

## ⛓️ Builder Code Integration & Safe Onboarding

To qualify for the **Polymarket Builders Program**, all trades routed through Pollapse are attributed to our registered builder code (`0xdc821268...`). Volume attribution is executed client-side to maintain non-custodial integrity.

### 1. Attributed Order Signing Flow
The matching engine requires the builder code to be embedded directly inside the signed order payload (onchain `builder` field). Attaching it post-signature invalidates the user's L1 cryptographic signature.

```
[User Browser]
   |
   |-- 1. Initialize ClobClient with NEXT_PUBLIC_POLY_BUILDER_CODE
   |-- 2. Construct Order Struct (builder code embedded in 'builder' field)
   |-- 3. User signs EIP-712 typed order payload with Privy EOA Wallet
   |-- 4. Post raw signed order directly to Polymarket CLOB operator endpoint
   v
[Polymarket CLOB Engine] (Volume attributed to Pollapse automatically)
```

### 2. Gasless Safe Provisioning Pipeline
1. **Authentication:** Privy authenticates users via email/social and provisions a non-custodial EOA wallet.
2. **Safe Derivation & Deploy:** Deterministically derives the user's Safe/Deposit proxy wallet and deploys it gaslessly using `@polymarket/builder-relayer-client` (`POLY_1271` signatures).
3. **Batch Authorization:** Token approvals for pUSD (collateral) and outcome contract tokens (CTF, CTF Exchange, Neg Risk Exchange, Neg Risk Adapter) are packed into a single signature payload and dispatched through the relayer.
4. **L2 Keys Derivation:** Derives L2 trading API credentials (`createOrDeriveApiKey()`) and keeps them transiently in React memory state (never in `localStorage`).

---

## 🛠️ Local Installation & Development

### Prerequisites
* Node.js (v18.x or higher)
* npm (v9.x or higher)

### Setup
1. **Clone the Repository:**
   ```bash
   git clone https://github.com/Lesnak1/Pollapse.git
   cd Pollapse
   ```
2. **Install Dependencies:**
   ```bash
   npm install --legacy-peer-deps
   ```
3. **Configure Environment Variables:**
   Copy `.env.example` to `.env.local` and configure your keys.
4. **Start the Development Server:**
   ```bash
   npm run dev
   ```
5. **Access the Terminal:**
   Open [http://localhost:3000](http://localhost:3000) on your browser.

---

## 🗺️ Protocol Roadmap

- [x] **Phase 1 (V1.0 MVP):** Serverless proxy caching layers, logarithmic weighting indices, interactive D3.js physics web cluster graphs, alpha divergence scanner logs, and portfolio thesis workspace.
- [x] **Phase 2 (V2.0 Authenticated Gasless Trading):** On-chain Privy login, gasless safe provisioning, batch approvals, L2 keys, and client-side pre-signature attributed trading sandbox.
- [ ] **Phase 3 (Future):** Autonomous AI agents scanner integration to formulate and execute complex convergence trades instantly.

---

## ⚖️ Legal Disclaimer

Pollapse is solely an informational, statistical analytics terminal. We are not an exchange, broker, or financial advisor. Prediction markets carry substantial financial risks, high volatility, and complete capital loss hazards. Past performance of correlated assets is never a guarantee of future convergence. By using this software, you assume 100% of all trading risks and hold Pollapse and all affiliates completely harmless of any financial losses.

---

## 🤝 Contribution & Community Contacts

We welcome developer contributions! If you have suggestions or optimizations, connect with us:

* **Lead Architect:** **Leknax** 
  * GitHub: [@Lesnak1](https://github.com/Lesnak1)
  * Twitter / X: [@LesnaCrex](https://x.com/LesnaCrex)
* **Email:** [philosophyfactss@gmail.com](mailto:philosophyfactss@gmail.com)
* **Discord Community:** `kresna6773`
