import Image from "next/image";

const Logo = () => (
  <div className="flex items-center gap-2">
    <Image src="/logo.png" width={36} height={36} alt="" className="object-contain" />
    <span className="text-lg font-bold tracking-[-0.04em] text-[#1F1B3A]">Equb</span>
  </div>
);

export default Logo;
