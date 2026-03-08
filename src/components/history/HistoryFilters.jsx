import { TabsList, TabsTrigger } from '@/components/ui/tabs';

/**
 * Fixed header with TabsList and TabsTrigger for "Tus alertas" / "Tus reservas".
 */
export default function HistoryFilters() {
  return (
    <div
      className="fixed top-[56px] left-0 right-0 z-40 backdrop-blur-sm px-4 pt-3 pb-2 border-b border-gray-800"
      style={{ backgroundColor: 'rgba(11,11,11,0.93)' }}
    >
      <TabsList className="w-full bg-gray-900 border-0 shadow-none ring-0 mt-[4px] mb-[2px] h-auto p-0 flex justify-between">
        <TabsTrigger
          value="alerts"
          className="flex-1 text-white data-[state=active]:bg-purple-600 data-[state=active]:text-white h-auto py-[10px]"
        >
          Tus alertas
        </TabsTrigger>
        <TabsTrigger
          value="reservations"
          className="flex-1 text-white data-[state=active]:bg-purple-600 data-[state=active]:text-white h-auto py-[10px]"
        >
          Tus reservas
        </TabsTrigger>
      </TabsList>
    </div>
  );
}
