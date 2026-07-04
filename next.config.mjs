/** @type {import('next').NextConfig} */
// LAN内のiPhoneからアクセスできるようにする待ち受け設定はCLIフラグ側で対応:
// package.json の "dev": "next dev -H 0.0.0.0" が全ネットワークインターフェースで待ち受ける。
// iPhoneのSafariから http://<PCのLAN IP>:3000 でアクセスできる。
const nextConfig = {};

export default nextConfig;
