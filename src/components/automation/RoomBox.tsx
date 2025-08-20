import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Room } from "@/entities/all";

import {
  Home,
  ChefHat,
  Bed,
  Bath,
  Car,
  Tv,
  Users,
  TreePine,
  GripVertical,
  User as UserIcon,
  Gamepad2,
  Dumbbell,
  BookOpen,
  Package,
  Clapperboard,
  Music,
  Palette,
  Shirt,
  Wrench,
  Shield,
  Server,
  Archive
} from "lucide-react";

const getRoomIcon = (roomName) => {
  const name = roomName.toLowerCase();
  
  // Home/Residential Rooms
  if (name.includes('kitchen') || name.includes('cook')) return ChefHat;
  if (name.includes('bedroom') || name.includes('bed') || name.includes('sleep') || name.includes('master')) return Bed;
  if (name.includes('bathroom') || name.includes('bath') || name.includes('toilet') || name.includes('washroom') || name.includes('restroom')) return Bath;
  if (name.includes('garage') || name.includes('car') || name.includes('parking')) return Car;
  if (name.includes('living') || name.includes('parlor') || name.includes('lounge') || name.includes('sitting') || name.includes('family')) return Tv;
  if (name.includes('dining') || name.includes('eat')) return Users;
  if (name.includes('garden') || name.includes('yard') || name.includes('outdoor') || name.includes('exterior') || name.includes('patio') || name.includes('deck')) return TreePine;
  if (name.includes('office') || name.includes('study') || name.includes('work') || name.includes('desk')) return UserIcon;
  if (name.includes('laundry') || name.includes('utility') || name.includes('wash')) return Shirt;
  
  // Entertainment & Recreation
  if (name.includes('gaming') || name.includes('game') || name.includes('play')) return Gamepad2;
  if (name.includes('gym') || name.includes('fitness') || name.includes('exercise') || name.includes('workout')) return Dumbbell;
  if (name.includes('cinema') || name.includes('movie') || name.includes('theater') || name.includes('theatre')) return Clapperboard;
  if (name.includes('music') || name.includes('band') || name.includes('recording') || name.includes('sound')) return Music;
  if (name.includes('art') || name.includes('craft') || name.includes('studio') || name.includes('creative')) return Palette;
  if (name.includes('library') || name.includes('reading') || name.includes('book')) return BookOpen;
  
  // Storage & Utility
  if (name.includes('storage') || name.includes('store') || name.includes('closet') || name.includes('pantry') || name.includes('attic') || name.includes('basement')) return Package;
  if (name.includes('mechanical') || name.includes('boiler') || name.includes('hvac') || name.includes('electrical')) return Wrench;
  if (name.includes('server') || name.includes('tech') || name.includes('it') || name.includes('computer')) return Server;
  if (name.includes('security') || name.includes('control') || name.includes('monitoring')) return Shield;
  if (name.includes('archive') || name.includes('file') || name.includes('document')) return Archive;
  
  return Home; // Default icon
};

export default function RoomBox({ room, dragHandleProps }) {
  const navigate = useNavigate();
  const [currentRoom, setCurrentRoom] = useState(room);

  const refreshRoomState = async () => {
      // Ensure currentRoom.id exists before trying to fetch
      if (currentRoom.id) {
          const latestRoomData = await Room.get(currentRoom.id);
          if (latestRoomData) {
            setCurrentRoom(latestRoomData);
          }
      }
  }

  useEffect(() => {
    const handleRoomUpdate = (event) => {
      // Check if the event is relevant to this specific room instance
      if (event.detail.roomId === currentRoom.id) {
        refreshRoomState();
      }
    };
    
    // Listen for general appliance updates across rooms
    window.addEventListener('roomApplianceUpdated', handleRoomUpdate);
    
    return () => {
      window.removeEventListener('roomApplianceUpdated', handleRoomUpdate);
    };
  }, [currentRoom.id]); // Depend on currentRoom.id to ensure listener is correctly tied to the room

  // This useEffect ensures the component updates its internal state when the 'room' prop changes
  useEffect(() => {
    setCurrentRoom(room);
  }, [room]); // Depend on the 'room' prop to update state when parent re-renders with a new room object

  const handleClick = () => {
    navigate(createPageUrl(`RoomDetails?id=${currentRoom.id}`));
  };

  const RoomIcon = getRoomIcon(currentRoom.name);
  const activeDevices = currentRoom.appliances?.filter(app => app.status) || [];
  const totalDevices = currentRoom.appliances?.length || 0;
  
  const getDeviceStatusColor = () => {
    if (totalDevices === 0) return "text-gray-400";
    const activePercentage = (activeDevices.length / totalDevices) * 100;
    
    if (activePercentage === 0) return "text-gray-500";
    if (activePercentage <= 50) return "text-yellow-600";
    return "text-green-600";
  };

  return (
    <Card 
      className="glass-card border-0 shadow-lg cursor-pointer hover:shadow-xl transition-all duration-300 group"
      onClick={handleClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {dragHandleProps && (
              <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing" onClick={(e) => e.stopPropagation()}>
                <GripVertical className="w-5 h-5 text-gray-400" />
              </div>
            )}
            
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform">
              <RoomIcon className="w-6 h-6 text-white" />
            </div>
            
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 font-inter group-hover:text-blue-600 transition-colors">
                {currentRoom.name}
              </h3>
              <div className="flex items-center gap-3 mt-1">
                <span className={`text-sm font-medium ${getDeviceStatusColor()} font-inter`}>
                  {activeDevices.length} of {totalDevices} devices active
                </span>
                {currentRoom.occupancy_status && (
                  <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                    Occupied
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {totalDevices > 0 && (
              <div className="text-right">
                <div className="w-16 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(activeDevices.length / totalDevices) * 100}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1 font-inter">
                  {Math.round((activeDevices.length / totalDevices) * 100)}% active
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}