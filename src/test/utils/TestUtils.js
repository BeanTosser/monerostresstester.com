require('monero-javascript')
const FS = require("fs");
const TxPoolWalletTracker = require("./TxPoolWalletTracker");

/**
 * Collection of test utilities and configurations.
 * 
 * TODO: move hard coded to config
 */
class TestUtils {
  
  /**
   * Get a singleton daemon RPC instance shared among tests.
   * 
   * @return {MoneroDaemonRpc} a daemon RPC instance
   */
  static async getDaemonRpc() {
    if (TestUtils.daemonRpc === undefined) TestUtils.daemonRpc = await MoneroDaemonRpc.create(Object.assign({proxyToWorker: TestUtils.PROXY_TO_WORKER}, TestUtils.DAEMON_RPC_CONFIG));
    return TestUtils.daemonRpc;
  }
  
  static getDaemonRpcConnection() {
    return new MoneroRpcConnection(TestUtils.DAEMON_RPC_CONFIG);
  }
  
  /**
   * Get a singleton wallet RPC instanced shared among tests.
   * 
   * @return {MoneroWalletRpc} a wallet RPC instance
   */
  static async getWalletRpc() {
    if (TestUtils.walletRpc === undefined) {
      
      // construct wallet rpc instance with daemon connection
      TestUtils.walletRpc = new MoneroWalletRpc(TestUtils.WALLET_RPC_CONFIG);
    }
    
    // attempt to open test wallet
    try {
      await TestUtils.walletRpc.openWallet(TestUtils.WALLET_RPC_NAME_1, TestUtils.WALLET_PASSWORD);
    } catch (e) {
      if (!(e instanceof MoneroRpcError)) throw e;
      
      // -1 returned when the wallet does not exist or it's open by another application
      if (e.getCode() === -1) {
        
        // create wallet
        await TestUtils.walletRpc.createWalletFromMnemonic(TestUtils.WALLET_RPC_NAME_1, TestUtils.WALLET_PASSWORD, TestUtils.MNEMONIC, TestUtils.FIRST_RECEIVE_HEIGHT);
      } else {
        throw e;
      }
    }
    
    // ensure we're testing the right wallet
    assert.equal(await TestUtils.walletRpc.getMnemonic(), TestUtils.MNEMONIC);
    assert.equal(await TestUtils.walletRpc.getPrimaryAddress(), TestUtils.ADDRESS);
    
    // sync and save the wallet
    await TestUtils.walletRpc.sync();
    await TestUtils.walletRpc.save();
    
    // return cached wallet rpc
    return TestUtils.walletRpc;
  }
  
  /**
   * Get a singleton full wallet instance shared among tests.
   * 
   * @return {MoneroWalletFull} a full wallet instance
   */
  static async getWalletFull() {
    if (!TestUtils.walletFull || await TestUtils.walletFull.isClosed()) {
      
      // create wallet from mnemonic phrase if it doesn't exist
      if (!await MoneroWalletFull.walletExists(TestUtils.WALLET_WASM_PATH_1, TestUtils.FS)) {
        
        // create directory for test wallets if it doesn't exist
        if (!TestUtils.FS.existsSync(TestUtils.TEST_WALLETS_DIR)) {
          if (!TestUtils.FS.existsSync(process.cwd())) TestUtils.FS.mkdirSync(process.cwd(), { recursive: true });  // create current process directory for relative paths which does not exist in memory fs
          TestUtils.FS.mkdirSync(TestUtils.TEST_WALLETS_DIR);
        }
        
        // create wallet with connection
        TestUtils.walletFull = await MoneroWalletFull.createWalletFromMnemonic(TestUtils.WALLET_WASM_PATH_1, TestUtils.WALLET_PASSWORD, TestUtils.NETWORK_TYPE, TestUtils.MNEMONIC, TestUtils.getDaemonRpcConnection(), TestUtils.FIRST_RECEIVE_HEIGHT, undefined, TestUtils.PROXY_TO_WORKER, TestUtils.FS);
        assert.equal(await TestUtils.walletFull.getRestoreHeight(), TestUtils.FIRST_RECEIVE_HEIGHT);
        await TestUtils.walletFull.sync(new WalletSyncPrinter());
        await TestUtils.walletFull.save();
        await TestUtils.walletFull.startSyncing(5000);
      }
      
      // otherwise open existing wallet
      else {
        TestUtils.walletFull = await MoneroWalletFull.openWallet(TestUtils.WALLET_WASM_PATH_1, TestUtils.WALLET_PASSWORD, TestUtils.NETWORK_TYPE, TestUtils.getDaemonRpcConnection(), TestUtils.PROXY_TO_WORKER, TestUtils.FS);
        await TestUtils.walletFull.sync(new WalletSyncPrinter());
        await TestUtils.walletFull.startSyncing(5000);
      }
    }
    return TestUtils.walletFull;
  }
  
  /**
   * Get a singleton keys-only wallet instance shared among tests.
   * 
   * @return {MoneroWalletKeys} a keys-only wallet instance
   */
  static async getWalletKeys() {
    if (TestUtils.walletKeys === undefined) {
      
      // create wallet from mnemonic
      TestUtils.walletKeys = MoneroWalletKeys.createWalletFromMnemonic(TestUtils.NETWORK_TYPE, TestUtils.MNEMONIC);
    }
    return TestUtils.walletKeys;
  }
  
  static testUnsignedBigInteger(num, nonZero) {
    assert(num);
    assert(num instanceof BigInteger);
    let comparison = num.compare(new BigInteger(0));
    assert(comparison >= 0);
    if (nonZero === true) assert(comparison > 0);
    if (nonZero === false) assert(comparison === 0);
  }
  
  static async getRandomWalletAddress() {
    let wallet = await MoneroWalletKeys.createWalletRandom(TestUtils.NETWORK_TYPE);
    return await wallet.getPrimaryAddress();
  }
}

// ---------------------------- STATIC TEST CONFIG ----------------------------

// TODO: export these to key/value properties file for tests
// TODO: in properties, define {network: stagnet, network_configs: { stagnet: { daemonRpc: { host: _, port: _ ... etc

TestUtils.TEST_WALLETS_DIR = "./test_wallets";
TestUtils.WALLET_WASM_PATH_1 = TestUtils.TEST_WALLETS_DIR + "/test_wallet_1";

TestUtils.MAX_FEE = new BigInteger(7500000).multiply(new BigInteger(10000));
TestUtils.NETWORK_TYPE = MoneroNetworkType.STAGENET;

// default keypair to test
TestUtils.MNEMONIC = "biggest duets beware eskimos coexist igloo pamphlet lagoon odometer hounded jukebox enough pride cocoa nylon wolf geometry buzzer vivid federal idols gang semifinal subtly coexist";
TestUtils.ADDRESS = "555zgduFhmKd2o8rPUzWLjNMrBWsRpgqb6CsmHUwhR3ABd4rPJeddAiN7DWDFozU9hZ9c8x3F4rKgPEJoUMyQ17oNr2SUq2";
TestUtils.FIRST_RECEIVE_HEIGHT = 545232;   // NOTE: this value MUST be the height of the wallet's first tx for tests

//wallet rpc test wallet filenames and passwords
TestUtils.WALLET_RPC_NAME_1 = "test_wallet_1";
TestUtils.WALLET_RPC_NAME_2 = "test_wallet_2";
TestUtils.WALLET_PASSWORD = "supersecretpassword123";

// wallet RPC config
TestUtils.WALLET_RPC_CONFIG = {
  uri: "http://localhost:38083",
  username: "rpc_user",
  password: "abc123",
  rejectUnauthorized: true // reject self-signed certificates if true
};

// daemon RPC config
TestUtils.DAEMON_RPC_CONFIG = {
  uri: "http://localhost:38081",
  username: "superuser",
  password: "abctesting123",
  rejectUnauthorized: true // reject self-signed certificates if true
};

// used to track which wallets are in sync with pool so associated txs in the pool do not need to be waited on
TestUtils.TX_POOL_WALLET_TRACKER = new TxPoolWalletTracker();

TestUtils.PROXY_TO_WORKER = false;
TestUtils.FS = require('fs');

//utils/TestUtils.DAEMON_RPC_CONFIG = {
//  uri: "http://node.xmrbackb.one:28081",
//  //username: "superuser",
//  //password: "abctesting123",
//  maxRequestsPerSecond: 1
//};

module.exports = TestUtils;