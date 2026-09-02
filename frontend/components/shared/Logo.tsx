import Image from "next/image";

const Logo = () => (
  <div className="flex items-center gap-2">
    <Image src="/logo.png" width={40} height={40} alt="Equb Logo" className="object-contain" />
    <span className="font-bold text-[#1F1B3A] text-lg">Equb</span>
  </div>
);

export default Logo;
