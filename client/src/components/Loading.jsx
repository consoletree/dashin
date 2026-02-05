import { Activity } from 'lucide-react';

export default function Loading({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-4 border-[#2a2a3a] border-t-indigo-500 animate-spin" />
        <Activity className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-indigo-400" />
      </div>
      <p className="mt-4 text-gray-500">{message}</p>
    </div>
  );
}

export function LoadingCard() {
  return (
    <div className="card animate-pulse">
      <div className="h-4 w-24 bg-[#2a2a3a] rounded mb-4" />
      <div className="h-8 w-32 bg-[#2a2a3a] rounded mb-2" />
      <div className="h-3 w-20 bg-[#2a2a3a] rounded" />
    </div>
  );
}
