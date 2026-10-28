const crypto = require('crypto');

// Standard 256-bit prime field modulus: secp256k1 field prime
// p = 2^256 - 2^32 - 977
const P = 115792089237316195423570985008687907853269984665640564039457584007913129639747n;

/**
 * Standard positive modulo for BigInt
 */
function mod(n, m = P) {
  const result = n % m;
  return result >= 0n ? result : result + m;
}

/**
 * Modular Exponentiation: (base^exp) mod m using binary exponentiation
 */
function modPow(base, exp, m = P) {
  let res = 1n;
  let b = mod(base, m);
  let e = exp;

  while (e > 0n) {
    if (e & 1n) {
      res = mod(res * b, m);
    }
    b = mod(b * b, m);
    e >>= 1n;
  }
  return res;
}

/**
 * Modular Multiplicative Inverse using Fermat's Little Theorem:
 * a^(-1) = a^(p-2) mod p (since p is prime)
 */
function modInverse(a, m = P) {
  const cleanA = mod(a, m);
  if (cleanA === 0n) {
    throw new Error('Division by zero in finite field: modular inverse does not exist');
  }
  return modPow(cleanA, m - 2n, m);
}

/**
 * Generates a random BigInt in range [1, P - 1]
 */
function randomFieldElement() {
  let val = 0n;
  do {
    const bytes = crypto.randomBytes(32);
    val = BigInt('0x' + bytes.toString('hex'));
  } while (val === 0n || val >= P);
  return val;
}

/**
 * Generates a random 256-bit master secret key formatted as Hex
 */
function generateMasterSecret() {
  const bytes = crypto.randomBytes(32);
  return bytes.toString('hex');
}

/**
 * Evaluates polynomial f(x) = S + a_1*x + ... + a_(k-1)*x^(k-1) mod P
 */
function evaluatePolynomial(coefficients, x) {
  let result = 0n;
  let xPower = 1n;
  const xBig = BigInt(x);

  for (let i = 0; i < coefficients.length; i++) {
    result = mod(result + coefficients[i] * xPower, P);
    xPower = mod(xPower * xBig, P);
  }
  return result;
}

/**
 * Shamir's Secret Sharing: Splits secretHex into n shares with threshold k.
 * Default for 3-Cloud architecture: k = 2 (Threshold), n = 3 (Clouds: AWS, GCP, Azure)
 */
function splitSecret(secretHex, k = 2, n = 3) {
  if (k > n) throw new Error('Threshold k cannot be greater than total shares n');
  if (k < 2) throw new Error('Threshold k must be at least 2');

  const secretInt = BigInt('0x' + secretHex);
  if (secretInt >= P) {
    throw new Error('Secret value exceeds prime field modulus');
  }

  // Coefficients: [a_0, a_1, ..., a_(k-1)] where a_0 = secretInt
  const coefficients = [secretInt];
  for (let i = 1; i < k; i++) {
    coefficients.push(randomFieldElement());
  }

  // Cloud assignment labels
  const cloudMetadata = [
    { x: 1, cloud: 'Cloud A (AWS)', role: 'Identity & Authentication Gateway' },
    { x: 2, cloud: 'Cloud B (GCP)', role: 'Clinical Electronic Health Records' },
    { x: 3, cloud: 'Cloud C (Azure)', role: 'Appointments & Immutable Audit Ledger' }
  ];

  // Evaluate polynomial at x = 1, 2, ..., n
  const shares = [];
  for (let i = 1; i <= n; i++) {
    const y = evaluatePolynomial(coefficients, i);
    const meta = cloudMetadata[i - 1] || { x: i, cloud: `Cloud-${i}`, role: 'Participant Node' };
    shares.push({
      x: i,
      yHex: y.toString(16).padStart(64, '0'),
      cloud: meta.cloud,
      role: meta.role
    });
  }

  return {
    primeModulusHex: P.toString(16),
    secretHex,
    threshold: k,
    totalShares: n,
    coefficientsHex: coefficients.map((c) => c.toString(16)),
    polynomialDisplay: `f(x) = S + ${coefficients[1].toString(16).substring(0, 12)}... · x (mod p)`,
    shares
  };
}

/**
 * Reconstructs the secret from any k shares using Lagrange Polynomial Interpolation:
 * S = f(0) = sum_{j=1}^k y_j * l_j(0) mod p
 * where l_j(0) = prod_{m != j} (-x_m) / (x_j - x_m) mod p
 */
function reconstructSecret(shares) {
  if (!shares || shares.length < 2) {
    throw new Error('At least 2 shares are required to reconstruct under k=2 threshold');
  }

  // Parse shares into BigInt
  const parsedShares = shares.map((s) => ({
    x: BigInt(s.x),
    y: BigInt('0x' + s.yHex),
    cloud: s.cloud || `Node-${s.x}`
  }));

  // Verify unique x coordinates
  const xSet = new Set(parsedShares.map((s) => s.x.toString()));
  if (xSet.size !== parsedShares.length) {
    throw new Error('Shares must have distinct x coordinates');
  }

  let secret = 0n;
  const lagrangeSteps = [];

  for (let j = 0; j < parsedShares.length; j++) {
    const { x: xj, y: yj, cloud: cloudJ } = parsedShares[j];
    let numerator = 1n;
    let denominator = 1n;

    for (let m = 0; m < parsedShares.length; m++) {
      if (m === j) continue;
      const { x: xm } = parsedShares[m];
      // Term: (0 - xm) / (xj - xm) = (-xm) / (xj - xm)
      numerator = mod(numerator * -xm, P);
      denominator = mod(denominator * (xj - xm), P);
    }

    const lagrangeBasis = mod(numerator * modInverse(denominator, P), P);
    const term = mod(yj * lagrangeBasis, P);
    secret = mod(secret + term, P);

    lagrangeSteps.push({
      cloud: cloudJ,
      x: Number(xj),
      lagrangeBasisHex: lagrangeBasis.toString(16).substring(0, 16) + '...',
      partialTermHex: term.toString(16).substring(0, 16) + '...'
    });
  }

  return {
    reconstructedSecretHex: secret.toString(16).padStart(64, '0'),
    participatingClouds: parsedShares.map((s) => s.cloud),
    sharesUsedCount: parsedShares.length,
    lagrangeSteps
  };
}

/**
 * Generates alternative candidate polynomials passing through a single stolen share
 * to demonstrate mathematically that 1 share leaks 0 information.
 */
function generateAlternativeCandidates(singleShare, candidateCount = 5) {
  const x = BigInt(singleShare.x);
  const y = BigInt('0x' + singleShare.yHex);

  const candidates = [];
  for (let i = 0; i < candidateCount; i++) {
    // Pick a random alternative secret S'
    const fakeSecret = randomFieldElement();
    // Solve for a1: y = S' + a1*x => a1 = (y - S') / x mod P
    const a1 = mod((y - fakeSecret) * modInverse(x, P), P);

    candidates.push({
      candidateIndex: i + 1,
      hypotheticalSecretHex: fakeSecret.toString(16).substring(0, 16) + '...',
      slopeHex: a1.toString(16).substring(0, 12) + '...',
      equation: `f_${i + 1}(x) = ${fakeSecret.toString(16).substring(0, 8)}... + ${a1.toString(16).substring(0, 8)}... · x`
    });
  }

  return {
    stolenShare: { x: Number(x), cloud: singleShare.cloud },
    proof: 'Information-Theoretic Security (Shannon Secrecy): Through any single coordinate (x1, y1), there are exactly |Fp| distinct degree-1 polynomials, each intersecting a completely different secret S at x=0. Hence, P(S = s | Share_1) = 1/|Fp|.',
    candidates
  };
}

module.exports = {
  P,
  mod,
  modInverse,
  generateMasterSecret,
  splitSecret,
  reconstructSecret,
  generateAlternativeCandidates
};
