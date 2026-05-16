/**
 * Glicko-2 Rating System Implementation
 * Following PL-17-B requirements for TrioOnline.
 * 
 * Rating (R): Presumed skill (Base 1500)
 * Rating Deviation (RD): Confidence level (Base 350)
 * Volatility (σ): Degree of performance fluctuation (Base 0.06)
 */

export interface GlickoPlayer {
  userId: string;
  rating: number;
  rd: number;
  volatility: number;
}

export interface MatchResult {
  opponentRating: number;
  opponentRD: number;
  score: number; // 1 for win, 0.5 for draw, 0 for loss
}

export interface GlickoUpdateResult {
  newRating: number;
  newRD: number;
  newVolatility: number;
  deltaMMR: number;
  isSmurfSuspected: boolean;
}

export class Glicko2Processor {
  private static readonly TAU = 0.5; // System constant as per PL-17-B
  private static readonly SCALE_FACTOR = 173.7178;
  private static readonly EPSILON = 0.000001;

  /**
   * Calculates the new rating for a player after a series of matches.
   * @param player The player to update
   * @param matches Results of matches played in a single rating period
   * @param isDisconnect If true, apply penalty but don't increase volatility (PL-17-B Edge Case)
   */
  public static updateRating(
    player: GlickoPlayer,
    matches: MatchResult[],
    isDisconnect: boolean = false
  ): GlickoUpdateResult {
    // Step 1: Convert to Glicko-2 scale
    const mu = (player.rating - 1500) / this.SCALE_FACTOR;
    const phi = player.rd / this.SCALE_FACTOR;
    const sigma = player.volatility;

    if (matches.length === 0) {
      // If no matches, only RD increases due to inactivity
      const newPhi = Math.sqrt(phi * phi + sigma * sigma);
      return {
        newRating: player.rating,
        newRD: newPhi * this.SCALE_FACTOR,
        newVolatility: sigma,
        deltaMMR: 0,
        isSmurfSuspected: false
      };
    }

    // Convert matches to Glicko-2 scale
    const scaledMatches = matches.map(m => ({
      mu: (m.opponentRating - 1500) / this.SCALE_FACTOR,
      phi: m.opponentRD / this.SCALE_FACTOR,
      score: m.score
    }));

    // Step 2: Compute v (variance)
    let v_inv = 0;
    for (const match of scaledMatches) {
      const g_phi = this.g(match.phi);
      const e = this.E(mu, match.mu, match.phi);
      v_inv += g_phi * g_phi * e * (1 - e);
    }
    const v = 1 / v_inv;

    // Step 3: Compute delta
    let delta_sum = 0;
    for (const match of scaledMatches) {
      delta_sum += this.g(match.phi) * (match.score - this.E(mu, match.mu, match.phi));
    }
    const delta = v * delta_sum;

    // Step 4: Compute new volatility sigma'
    let newSigma = sigma;
    if (!isDisconnect) {
      newSigma = this.calculateNewSigma(delta, phi, v, sigma);
    } else {
      // PL-17-B: "O sistema DEVE aplicar a penalidade integral ao R do jogador, 
      // mas NÃO DEVE aumentar sua Volatility"
      // Note: In standard Glicko-2, sigma update depends on delta. 
      // Here we keep it stable for disconnects.
    }

    // Step 5: Update rating and RD
    const phi_star = Math.sqrt(phi * phi + newSigma * newSigma);
    const newPhi = 1 / Math.sqrt(1 / (phi_star * phi_star) + 1 / v);
    const newMu = mu + (newPhi * newPhi) * delta_sum;

    // Convert back to original scale
    const finalRating = (newMu * this.SCALE_FACTOR) + 1500;
    const finalRD = newPhi * this.SCALE_FACTOR;

    // Smurf Detection (PL-17-B): 
    // Aggressive volatility and high RD + consecutive wins.
    // We flag if volatility increased significantly OR if rating jump is very high.
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

  private static g(phi: number): number {
    return 1 / Math.sqrt(1 + (3 * phi * phi) / (Math.PI * Math.PI));
  }

  private static E(mu: number, mu_j: number, phi_j: number): number {
    return 1 / (1 + Math.exp(-this.g(phi_j) * (mu - mu_j)));
  }

  private static calculateNewSigma(delta: number, phi: number, v: number, sigma: number): number {
    const a = Math.log(sigma * sigma);
    const deltaSq = delta * delta;
    const phiSq = phi * phi;
    
    const f = (x: number) => {
      const expX = Math.exp(x);
      const term1 = (expX * (deltaSq - phiSq - v - expX)) / (2 * Math.pow(phiSq + v + expX, 2));
      const term2 = (x - a) / (this.TAU * this.TAU);
      return term1 - term2;
    };

    let A = a;
    let B: number;

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
