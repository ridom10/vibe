module.exports = {
  apps: [{
    name: 'vibe',
    script: 'npm',
    args: 'run preview',
    cwd: '/home/claude/projects/vibe',
    env: {
      NODE_ENV: 'production',
      PORT: 3004
    }
  }]
};
