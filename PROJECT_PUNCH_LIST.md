# High-Score Faucet: Project Requirements & Developer Guide

This document outlines the components, architecture, and remaining tasks to build the frontend for the high-score-based ERC20 token faucet.

## 1. Project Goal

To create a system where users can earn ERC20 tokens by achieving a high score in a web-based game. The system must be secure, preventing abuse while providing a fair and engaging reward mechanism.

## 2. System Architecture

The system consists of three main components:
1.  **On-Chain Smart Contract:** A Solidity contract deployed on Base Sepolia that holds the tokens and dispenses them.
2.  **Backend Service:** A Supabase Edge Function that acts as a secure gatekeeper. It validates high scores and authorizes rewards by generating a cryptographic signature.
3.  **Frontend Application:** The web-based game where users play, connect their wallets, and claim their rewards.

### Key Architectural Decision: Dynamic Rewards

A critical feature of this system is that the **reward amount is not fixed**. The smart contract does not have a `dripAmount`. Instead, the backend service decides the appropriate reward for each user based on their high score or other game logic.

**Flow:**
1.  User achieves a high score.
2.  Frontend sends the score to the backend.
3.  Backend validates the score and **calculates the reward amount**.
4.  Backend generates a signature that authorizes that specific `amount` for that user.
5.  Frontend receives the `amount` and `signature` and calls the smart contract to claim the reward.

This design provides maximum flexibility, allowing reward tiers, bonuses, and special events to be managed entirely from the backend without needing to modify the smart contract.

## 3. Admin Functions

The contract owner (the deployer) has several administrative functions accessible through a block explorer like Basescan or a script:
-   `setTokenContractAddress(address)`: Changes the ERC20 token the faucet dispenses.
-   `setSignerAddress(address)`: Changes the trusted backend wallet that signs rewards.
-   `withdrawTokens(uint256)`: Allows the owner to withdraw any remaining tokens from the faucet.

## 4. Punch List for Frontend Development

### ✅ Phase 1: Smart Contract (100% Complete)

The smart contract is deployed, verified, and ready.

-   **Contract Address:** `0x447b964389d9Ff14eBc4EBC92920FD3a69baDc76`
-   **Verified on Basescan:** [View Contract on Basescan](https://basescan.org/address/0x447b964389d9Ff14eBc4EBC92920FD3a69baDc76)
-   **Next Step:** The owner must **fund the faucet** by transferring the chosen ERC20 tokens to the contract address above.

### ⏳ Phase 2: Backend Integration (50% Complete)

-   [x] **Create Signer Wallet:** A dedicated wallet has been created to act as the secure backend signer.
-   [x] **Create Edge Function:** The initial code for the `generate-reward-signature` Supabase Edge Function is complete.
-   [ ] **Store Private Key:** Securely add the signer wallet's private key as a secret named `SIGNER_PRIVATE_KEY` in the Supabase dashboard.
-   [ ] **Deploy Edge Function:** Deploy the `generate-reward-signature` function to your Supabase project.
-   [ ] **Add High Score & Reward Logic:** **(Crucial Step)** Modify the Edge Function to:
    1.  Query your Supabase database to verify the user has a valid, unclaimed high score.
    2.  **Determine the correct reward `amount`** based on the score or other game rules.
    3.  Generate a signature that includes the user's address, the calculated `amount`, and a unique `nonce`.
    4.  Return the `amount`, `nonce`, and `signature` in the response.
-   [ ] **Test Edge Function:** Use a tool like `curl` or Postman to test that the deployed function correctly generates signatures and dynamic reward amounts.

### ⏳ Phase 3: Frontend Integration (0% Complete)

-   [ ] **Wallet Connection:** Implement a "Connect Wallet" feature in your game's frontend using a library like Ethers.js or Wagmi.
-   [ ] **High Score Submission:** After a game session, send the user's score and wallet address to your Supabase database.
-   [ ] **Claim Reward Flow:**
    -   [ ] After a valid high score is submitted, make a request from the frontend to your `generate-reward-signature` Edge Function.
    -   [ ] Receive the `amount`, `nonce`, and `signature` from the function's response.
-   [ ] **Smart Contract Interaction:**
    -   [ ] Using the connected user's wallet, create a contract instance using the ABI and the address `0x447b964389d9Ff14eBc4EBC92920FD3a69baDc76`.
    -   [ ] Call the `claimReward(amount, nonce, signature)` function, passing the values received from the backend.
-   [ ] **User Feedback:**
    -   [ ] Display the transaction status to the user (e.g., "Sending transaction...", "Reward claimed successfully!", "Transaction failed").
    -   [ ] Provide a link to the transaction on Basescan.
