const fs = require('fs');
const path = require('path');
const forge = require('node-forge');

const certsDir = __dirname;
console.log('🔒 Generating 3-Cloud Zero-Trust mTLS X.509 Certificates using node-forge...');

function createCA() {
  console.log('🔑 Generating Root CA...');
  const keys = forge.pki.rsa.generateKeyPair(2048);
  const cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = '01';
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 5);

  const attrs = [
    { name: 'countryName', value: 'US' },
    { name: 'stateOrProvinceName', value: 'Tech' },
    { name: 'localityName', value: 'MultiCloud' },
    { name: 'organizationName', value: 'ZeroTrustCA' },
    { name: 'commonName', value: 'ZeroTrust-RootCA' }
  ];
  cert.setSubject(attrs);
  cert.setIssuer(attrs);

  cert.setExtensions([
    { name: 'basicConstraints', cA: true, isCritical: true },
    { name: 'keyUsage', keyCertSign: true, cRLSign: true, isCritical: true }
  ]);

  cert.sign(keys.privateKey, forge.md.sha256.create());

  const pemKey = forge.pki.privateKeyToPem(keys.privateKey);
  const pemCert = forge.pki.certificateToPem(cert);

  fs.writeFileSync(path.join(certsDir, 'ca.key'), pemKey);
  fs.writeFileSync(path.join(certsDir, 'ca.crt'), pemCert);

  return { caKey: keys.privateKey, caCert: cert, attrs };
}

function createCert(cn, org, isClient, caKey, caCert, caAttrs, serial) {
  console.log(`🔑 Generating ${cn} (${org}) Certificate...`);
  const keys = forge.pki.rsa.generateKeyPair(2048);
  const cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = serial;
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 2);

  const subjectAttrs = [
    { name: 'countryName', value: 'US' },
    { name: 'stateOrProvinceName', value: 'Cloud' },
    { name: 'localityName', value: org },
    { name: 'organizationName', value: org },
    { name: 'commonName', value: cn }
  ];
  cert.setSubject(subjectAttrs);
  cert.setIssuer(caAttrs);

  const extensions = [
    { name: 'basicConstraints', cA: false },
    {
      name: 'keyUsage',
      digitalSignature: true,
      nonRepudiation: true,
      keyEncipherment: true,
      dataEncipherment: true
    },
    {
      name: 'extKeyUsage',
      serverAuth: !isClient,
      clientAuth: true
    }
  ];

  if (!isClient) {
    extensions.push({
      name: 'subjectAltName',
      altNames: [
        { type: 2, value: 'localhost' },
        { type: 7, ip: '127.0.0.1' }
      ]
    });
  }

  cert.setExtensions(extensions);
  cert.sign(caKey, forge.md.sha256.create());

  const pemKey = forge.pki.privateKeyToPem(keys.privateKey);
  const pemCert = forge.pki.certificateToPem(cert);

  return { pemKey, pemCert };
}

const { caKey, caCert, attrs: caAttrs } = createCA();

// Cloud A Client Certificate
const cloudA = createCert('cloud-a-auth', 'CloudA-AWS', true, caKey, caCert, caAttrs, '02');
fs.writeFileSync(path.join(certsDir, 'cloudA.key'), cloudA.pemKey);
fs.writeFileSync(path.join(certsDir, 'cloudA.crt'), cloudA.pemCert);

// Cloud B Server Certificate
const cloudB = createCert('localhost', 'CloudB-GCP', false, caKey, caCert, caAttrs, '03');
fs.writeFileSync(path.join(certsDir, 'cloudB.key'), cloudB.pemKey);
fs.writeFileSync(path.join(certsDir, 'cloudB.crt'), cloudB.pemCert);

// Cloud C Server Certificate
const cloudC = createCert('localhost', 'CloudC-Azure', false, caKey, caCert, caAttrs, '04');
fs.writeFileSync(path.join(certsDir, 'cloudC.key'), cloudC.pemKey);
fs.writeFileSync(path.join(certsDir, 'cloudC.crt'), cloudC.pemCert);

console.log('✅ All 3-Cloud Zero-Trust mTLS certificates generated successfully!');
