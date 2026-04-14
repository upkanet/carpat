export function dateString(){
    const d = new Date();
    const pad = (n) => n.toString().padStart(2, '0');
    const dS = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
    return dS;
}