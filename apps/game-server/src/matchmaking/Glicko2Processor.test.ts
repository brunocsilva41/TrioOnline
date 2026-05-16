import { Glicko2Processor, GlickoPlayer, MatchResult } from './Glicko2Processor';

function testGlickoUpdate() {
  const player: GlickoPlayer = {
    userId: 'player1',
    rating: 1500,
    rd: 200,
    volatility: 0.06
  };

  const matches: MatchResult[] = [
    { opponentRating: 1400, opponentRD: 30, score: 1 }, // Win against weaker
    { opponentRating: 1550, opponentRD: 100, score: 1 }, // Win against stronger
    { opponentRating: 1700, opponentRD: 300, score: 0 }  // Loss against much stronger/uncertain
  ];

  console.log('--- Standard Update ---');
  const result = Glicko2Processor.updateRating(player, matches);
  console.log('Result:', result);

  console.log('\n--- Smurf Detection (Win Streak) ---');
  const newPlayer: GlickoPlayer = {
    userId: 'new_smurf',
    rating: 1500,
    rd: 350,
    volatility: 0.06
  };
  const winStreak: MatchResult[] = [
    { opponentRating: 1500, opponentRD: 350, score: 1 },
    { opponentRating: 1600, opponentRD: 350, score: 1 },
    { opponentRating: 1700, opponentRD: 350, score: 1 }
  ];
  const smurfResult = Glicko2Processor.updateRating(newPlayer, winStreak);
  console.log('Smurf Result:', smurfResult);

  console.log('\n--- Disconnect Handling ---');
  const dcResult = Glicko2Processor.updateRating(player, matches, true);
  console.log('DC Result (Sigma should stay closer):', dcResult.newVolatility, 'vs', result.newVolatility);
}

testGlickoUpdate();
