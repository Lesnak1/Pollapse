import Module from 'module';

// Intercept server-only import for standalone test execution environment
const originalRequire = Module.prototype.require;
Module.prototype.require = function (id: string) {
  if (id === 'server-only') {
    return {};
  }
  return originalRequire.apply(this, arguments as any);
};

// Mock Signer compatible with ethers Provider/Signer interface
const mockSigner = {
  getAddress: async () => '0x0000000000000000000000000000000000000000',
  signMessage: async () => '0x',
};

async function runTest() {
  console.log('Running builder attribution sanity check...');
  const { getBuilderClobClient } = await import('./clobClient');
  
  // Set mock environment variables
  process.env.POLY_BUILDER_CODE = '0xdc821268d88389abfb9f48657fc082cbc69c64148b966423ae74353e147500ad';
  process.env.POLY_CLOB_HOST = 'https://clob.polymarket.com';
  process.env.POLY_API_KEY = 'mock_key';
  process.env.POLY_API_SECRET = 'mock_secret';
  process.env.POLY_API_PASSPHRASE = 'mock_passphrase';

  const client = getBuilderClobClient(mockSigner);

  // Assert builderConfig is set on the ClobClient instance
  if (client.builderConfig?.builderCode !== process.env.POLY_BUILDER_CODE) {
    console.error('❌ Test failed: builderCode was not correctly set on client configuration.');
    process.exit(1);
  }
  
  console.log('✅ client.builderConfig.builderCode is correctly set:', client.builderConfig.builderCode);
  
  // Assert chain ID is POLYGON (137)
  if (client.chainId !== 137) {
    console.error(`❌ Test failed: expected chain ID 137, got ${client.chainId}`);
    process.exit(1);
  }
  
  console.log('✅ client.chainId is correctly set:', client.chainId);
  console.log('🎉 Sanity check passed successfully!');
}

runTest().catch((err) => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
