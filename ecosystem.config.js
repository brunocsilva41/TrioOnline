module.exports = {
  apps: [
    {
      name: "trio-server",
      script: "npm start",
      cwd: "./apps/game-server",
      instances: 1,
      exec_mode: "fork",
      max_memory_restart: "400M",
      env: {
        NODE_ENV: "production",
        PORT: 2567
      }
    },
    {
      name: "trio-client",
      script: "npm start",
      cwd: "./apps/game-client",
      instances: 1,
      exec_mode: "fork",
      max_memory_restart: "450M",
      env: {
        NODE_ENV: "production",
        PORT: 3000
      }
    }
  ]
};
