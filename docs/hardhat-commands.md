## Hardhat Command Reference

### Keystore (secrets manager)
- `npx hardhat keystore set <key>` – store a secret value (e.g. `PRIVATE_KEY`) encrypted in Hardhat’s keystore.
- `npx hardhat keystore list` – show all keys currently stored.
- `npx hardhat keystore get <key>` – decrypt and print a specific key.
- `npx hardhat keystore delete <key>` – remove a key from the keystore.
- `npx hardhat keystore change-password` – rotate the keystore password.
- `npx hardhat keystore path` – display the keystore file location.

### Compilation
- `npx hardhat compile` – compile contracts under the profiles defined in `hardhat.config.ts`.

### Testing
- `npx hardhat test` – run all tests.
- `npx hardhat test solidity` – run only Solidity tests.
- `npx hardhat test mocha` – run only Mocha/TypeScript tests.

### Deployment
- `npx hardhat ignition deploy ignition/modules/deploy.ts --network <network>` – deploy `SubscriptionManager` via Ignition.
- `npx hardhat ignition deploy ignition/modules/Counter.ts --network <network>` – deploy the sample `Counter` module.
- `npx hardhat run scripts/save-deployment.ts --network <network>` – export the latest Ignition deployment into `deployments/<network>.json`.

### Verification
- `npx hardhat verify --network <network> <contractAddress> [constructorArgs...]` – verify a contract on the configured block explorer (e.g. `npx hardhat verify --network sepolia 0x1234567890... "Hello" 1000`).

### Network utilities
- `npx hardhat accounts` – list configured accounts.
- `npx hardhat node` – start a local Hardhat network.
- `npx hardhat console --network <network>` – open a network-aware REPL.

### Project scaffolding
- `npx hardhat --init` – initialize a new Hardhat project in the current folder.

### Miscellaneous
- `npx hardhat help` – list all available Hardhat tasks.
- `npx hardhat clean` – remove compilation artifacts and cache.

> Tip: run any command with `--network <name>` to pick a specific RPC defined in `hardhat.config.ts`.

