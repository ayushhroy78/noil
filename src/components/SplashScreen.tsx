import { useEffect, useState } from "react";
import logoImg from "@/assets/logo.jpg";

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(onComplete, 500); // Wait for fade out animation
    }, 2500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center transition-opacity duration-500 ${
        show ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="flex flex-col items-center gap-6 animate-in fade-in duration-700">
        {/* Logo with scale animation */}
        <div className="animate-in zoom-in duration-700">
          <img
            src={logoImg}
            alt="Noil Logo"
            className="h-32 w-32 object-contain"
          />
        </div>

        {/* App name */}
        <div className="animate-in fade-in duration-700 delay-300 space-y-2">
          <h1 className="text-5xl font-bold text-primary tracking-tight">
            Noil
          </h1>
          <p className="text-xl text-primary/70 font-medium text-center tracking-wide">
            Track. Cook. Thrive.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
