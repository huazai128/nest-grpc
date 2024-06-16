module.exports = {
  apps: [{
    name: 'pm2-test',
    script: 'dist/server/main.js',
    exec_mode: 'cluster',
    max_memory_restart: '750M',
    out_file: 'log/out.log',
    error_file: 'log/error.log',
    merge_logs: true,
    log_date_format: "YYYY-MM-DD HH:mm Z",
    instances: 4,
    log_rotate: {
      "rotateInterval": "0 0 * * *",
      "rotateModule": true,
      "rotateCompression": true,
      "rotateMaxSize": "10M"
    },
  }]
}