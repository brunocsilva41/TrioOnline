
class Glicko2Processor {
  static TAU = 0.5;
  static SCALE_FACTOR = 173.7178;
  static EPSILON = 0.000001;

  static updateRating(player, matches, isDisconnect = false) {
    const mu = (player.rating - 1500) / this.SCALE_FACTOR;
    const phi = player.rd / this.SCALE_FACTOR;
    const sigma = player.volatility;

    if (matches.length === 0) {
      const newPhi = Math.sqrt(phi * phi + sigma * sigma);
      return {
        newRating: player.rating,
        newRD: newPhi * this.SCALE_FACTOR,
        newVolatility: sigma,
        deltaMMR: 0,
        isSmurfSuspected: false
      };
    }

    const scaledMatches = matches.map(m => ({
      mu: (m.opponentRating - 1500) / this.SCALE_FACTOR,
      phi: m.opponentRD / this.SCALE_FACTOR,
      score: m.score
    }));

    let v_inv = 0;
    for (const match of scaledMatches) {
      const g_phi = this.g(match.phi);
      const e = this.E(mu, match.mu, match.phi);
      v_inv += g_phi * g_phi * e * (1 - e);
    }
    const v = 1 / v_inv;

    let delta_sum = 0;
    for (const match of scaledMatches) {
      delta_sum += this.g(match.phi) * (match.score - this.E(mu, match.mu, match.phi));
    }
    const delta = v * delta_sum;

    let newSigma = sigma;
    if (!isDisconnect) {
      newSigma = this.calculateNewSigma(delta, phi, v, sigma);
    }

    const phi_star = Math.sqrt(phi * phi + newSigma * newSigma);
    const newPhi = 1 / Math.sqrt(1 / (phi_star * phi_star) + 1 / v);
    const newMu = mu + (newPhi * newPhi) * delta_sum;

    const finalRating = (newMu * this.SCALE_FACTOR) + 1500;
    const finalRD = newPhi * this.SCALE_FACTOR;

    const deltaMMR = finalRating - player.rating;
    const isSmurfSuspected = (player.rd > 200 && deltaMMR > 100) || (newSigma > sigma * 1.5);

    return {
      newRating: Math.round(finalRating),
      newRD: Math.round(finalRD),
      newVolatility: newSigma,
      deltaMMR: Math.round(deltaMMR),
      isSmurfSuspected
    };
  }

  static g(phi) {
    return 1 / Math.sqrt(1 + (3 * phi * phi) / (Math.PI * Math.PI));
  }

  static E(mu, mu_j, phi_j) {
    return 1 / (1 + Math.exp(-this.g(phi_j) * (mu - mu_j)));
  }

  static calculateNewSigma(delta, phi, v, sigma) {
    const a = Math.log(sigma * sigma);
    const deltaSq = delta * delta;
    const phiSq = phi * phi;
    
    const f = (x) => {
      const expX = Math.exp(x);
      const term1 = (expX * (deltaSq - phiSq - v - expX)) / (2 * Math.pow(phiSq + v + expX, 2));
      const term2 = (x - a) / (this.TAU * this.TAU);
      return term1 - term2;
    };

    let A = a;
    let B;

    if (deltaSq > phiSq + v) {
      B = Math.log(deltaSq - phiSq - v);
    } else {
      let k = 1;
      while (f(a - k * this.TAU) < 0) {
        k++;
      }
      B = a - k * this.TAU;
    }

    let fA = f(A);
    let fB = f(B);

    while (Math.abs(B - A) > this.EPSILON) {
      const C = A + (A - B) * fA / (fB - fA);
      const fC = f(C);
      if (fC * fB < 0) {
        A = B;
        fA = fB;
      } else {
        fA = fA / 2;
      }
      B = C;
      fB = fC;
    }

    return Math.exp(A / 2);
  }
}

// TEST
const player = { rating: 1500, rd: 200, volatility: 0.06 };
const matches = [
  { opponentRating: 1400, opponentRD: 30, score: 1 },
  { opponentRating: 1550, opponentRD: 100, score: 1 },
  { opponentRating: 1700, opponentRD: 300, score: 0 }
];

const result = Glicko2Processor.updateRating(player, matches);
console.log('Result:', JSON.stringify(result));

const smurfPlayer = { rating: 1500, rd: 350, volatility: 0.06 };
const winStreak = [
  { opponentRating: 1500, opponentRD: 350, score: 1 },
  { opponentRating: 1600, opponentRD: 350, score: 1 },
  { opponentRating: 1700, opponentRD: 350, score: 1 }
];
const smurfResult = Glicko2Processor.updateRating(smurfPlayer, winStreak);
console.log('Smurf Result:', JSON.stringify(smurfResult));
