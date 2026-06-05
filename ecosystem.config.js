module.exports = {
  apps: [
    {
      name: "trio-server",
      script: "dist/index.js",
      cwd: "./apps/game-server",
      instances: 1,
      exec_mode: "fork",
      kill_timeout: 4000,
      wait_ready: true,
      listen_timeout: 10000,
      max_memory_restart: "400M",
      env: {
        NODE_ENV: "production",
        PORT: 2567,
        DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/trinity?schema=public"
      }
    },
    {
      name: "trio-client",
      script: "node_modules/.bin/next",
      args: "start",
      cwd: "./apps/game-client",
      instances: 1,
      exec_mode: "fork",
      kill_timeout: 4000,
      max_memory_restart: "450M",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        NEXT_PUBLIC_GAME_SERVER_URL: "ws://localhost:2567"
      }
    }
  ]
};
