import appLogo from '@/assets/d2ae993d3_WaitMe.png';
import HomeActions from '@/components/home/HomeActions';

export default function HomeHeader({
  onSearchClick,
  onCreateClick,
  mapRef,
  modeRef,
  getCurrentLocation,
  guard,
}) {
  return (
    <div
      className="hero-block absolute left-1/2 z-10 flex -translate-x-1/2 flex-col items-center text-center px-6 pointer-events-auto"
      style={{ top: 30 }}
    >
      <img
        loading="eager"
        decoding="async"
        fetchPriority="high"
        width={212}
        height={212}
        src={appLogo}
        alt="WaitMe!"
        className="w-[212px] h-[212px] object-contain translate-y-[5px]"
      />

      <h1 className="text-4xl font-bold leading-none whitespace-nowrap mt-[-38px]">
        Wait<span className="text-purple-500">Me!</span>
      </h1>

      <p className="text-xl font-bold mt-2 whitespace-nowrap">
        Aparca donde te <span className="text-purple-500">avisen!</span>
      </p>

      <div className="flex flex-col items-center w-full max-w-sm">
        <div className="flex flex-col items-center mt-[7px] mb-[4px]">
          <div className="w-4 h-4 rounded-full bg-purple-500 animate-pulse shadow-[0_0_12px_rgba(168,85,247,0.8)]" />
          <div className="w-[2px] h-8 bg-purple-500" />
        </div>

        <HomeActions
          onSearchClick={onSearchClick}
          onCreateClick={onCreateClick}
          mapRef={mapRef}
          modeRef={modeRef}
          getCurrentLocation={getCurrentLocation}
          guard={guard}
        />
      </div>
    </div>
  );
}
