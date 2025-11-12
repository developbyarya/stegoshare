# EncryptedMessages Contract Guide

## Overview

`EncryptedMessages` is a lightweight on-chain storage contract for end-to-end encrypted payloads. It provides a registry of message IDs mapped to metadata that allows only the original sender or intended receiver to retrieve ciphertext. The contract intentionally stores ciphertext in plaintext form on-chain; off-chain encryption and key management are assumed.

## Key Concepts

- **Message** – Struct containing the ID, sender, receiver, ciphertext, and timestamp.
- **Message Counter** – Sequential ID generator ensuring that every stored message receives a unique identifier.
- **Access Control** – Retrieval is limited to the original sender or receiver of a message.
- **User Inbox Index** – Each account maps to an array of message IDs for efficient inbox queries.

## Functions

### `storeMessage(address receiver, string calldata ciphertext) external returns (uint256)`

- Autoincrements the message counter and persists a `Message`.
- Adds the message ID to the sender’s and receiver’s `userMessageIds` arrays (receiver only if different from sender).
- Emits `MessageStored`.
- Reverts if `receiver` is the zero address.

### `getMessage(uint256 id) external view returns (...)`

- Returns all metadata for a given message ID.
- Reverts if the message does not exist or if the caller is not the sender or receiver.

### `getMessageIdsFor(address user) external view returns (uint256[])`

- Returns the full array of message IDs related to `user`.

### `getMessageCountFor(address user) external view returns (uint256)`

- Returns the inbox size for `user`.

### `getLatestMessageIdsFor(address user, uint256 n) external view returns (uint256[])`

- Returns up to the last `n` message IDs for `user`, ordered from oldest to newest in the slice.
- Returns an empty array when `n` is zero or the user has no messages.

## Events

### `MessageStored(uint256 indexed id, address indexed sender, address indexed receiver, uint256 timestamp)`

- Emitted after successfully storing a message.
- Allows off-chain clients to monitor new messages via log subscriptions.

## Usage Notes

- **Privacy:** Ciphertext must be encrypted off-chain; the contract stores raw strings visible to anyone observing the blockchain.
- **Gas Considerations:** Ciphertext length directly impacts storage cost; consider compression or short ciphertext formats (e.g. base64, hex).
- **Inbox Management:** Fetch the latest message IDs with `getLatestMessageIdsFor` to implement pagination-friendly inbox views.
- **Replay Protection:** The contract assigns an ever-increasing message ID; clients can track the highest observed ID to detect new messages.

## Deployment & Integration

- Deploy using Hardhat Ignition module `ignition/modules/EncryptedMessages.ts`.
- Configure the Ethereum Sepolia URL and deployer private key through environment variables (`SEPOLIA_RPC_URL`, `SEPOLIA_PRIVATE_KEY`).
- After deployment, cache the contract address in your application configuration, and optionally verify the contract on Etherscan for transparency.

## Testing

- Solidity tests live in `contracts/EncryptedMessages.t.sol` (Foundry) and TypeScript tests in `test/Encryption.ts` (Hardhat/viem).
- Run `npx hardhat test` for the TypeScript suite and `forge test` for Foundry-based tests.

## Future Enhancements

- **Message Deletion or Expiry:** Consider adding optional pruning or soft-delete features for long-term storage control.
- **Pagination Helpers:** Add cursor-based pagination to optimize large inbox queries.
- **Metadata Extensions:** Introduce additional metadata (e.g. subject, attachment hashes) as requirements evolve.

