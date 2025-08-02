import os from 'os';

let handler = async (m, { conn }) => {
  const totalmem = os.totalmem();
  const freemem = os.freemem();
  const uptime = os.uptime();
  const platform = os.platform();
  const arch = os.arch();
  const cpuModel = os.cpus()[0].model;
  const cpuCores = os.cpus().length;

  const prettyBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const uptimeStr = (seconds) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor(seconds % (3600 * 24) / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    const s = Math.floor(seconds % 60);
    return `${d}d ${h}h ${m}m ${s}s`;
  };

  const info = `
*System Information*

- *OS Platform:* ${platform}
- *Architecture:* ${arch}
- *CPU Model:* ${cpuModel}
- *CPU Cores:* ${cpuCores}
- *Total Memory:* ${prettyBytes(totalmem)}
- *Free Memory:* ${prettyBytes(freemem)}
- *Uptime:* ${uptimeStr(uptime)}
  `;

  m.reply(info.trim());
};
handler.help = ['sysinfo', 'systeminfo'];
handler.tags = ['tools'];
handler.command = /^(sysinfo|systeminfo)$/i;
export default handler;
