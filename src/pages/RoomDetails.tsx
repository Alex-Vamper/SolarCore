
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User, Room } from "@/entities/all";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import {
  ArrowLeft,
  Home,
  Power,
  Settings as SettingsIcon,
  Trash2,
  Plus,
  ChefHat,
  Bed,
  Bath,
  Car,
  Tv,
  Users,
  TreePine,
  User as UserIcon,
  // Additional room icons
  Gamepad2,
  Dumbbell,
  BookOpen,
  Package,
  Camera,
  Clapperboard,
  Briefcase,
  GraduationCap,
  Stethoscope,
  UtensilsCrossed,
  Coffee,
  Server,
  Building2,
  Warehouse,
  ShoppingCart,
  Shirt,
  Wrench,
  Zap,
  Shield,
  Baby,
  Music,
  Palette,
  Microscope,
  Calculator,
  Globe,
  BookMarked,
  Heart,
  Sofa,
  FlaskConical,
  Archive,
  GripVertical
} from "lucide-react";

import ApplianceControl from "../components/room/ApplianceControl";
import AddDeviceModal from "../components/room/AddDeviceModal";
import RoomSettingsTab from "../components/room/AutomationSettings";

const getRoomIcon = (roomName) => {
  const name = roomName.toLowerCase();
  
  // Home/Residential rooms
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
  
  // Office/Business spaces
  if (name.includes('conference') || name.includes('meeting') || name.includes('boardroom') || name.includes('board')) return Users;
  if (name.includes('reception') || name.includes('lobby') || name.includes('entrance') || name.includes('front desk')) return Building2;
  if (name.includes('break') || name.includes('staff') || name.includes('employee') || name.includes('cafeteria')) return Coffee;
  if (name.includes('warehouse') || name.includes('inventory') || name.includes('stock')) return Warehouse;
  
  // Hospital/Medical
  if (name.includes('examination') || name.includes('exam') || name.includes('consultation') || name.includes('patient')) return Stethoscope;
  if (name.includes('laboratory') || name.includes('lab') || name.includes('testing')) return FlaskConical;
  if (name.includes('surgery') || name.includes('operating') || name.includes('or') || name.includes('theatre')) return Heart;
  if (name.includes('emergency') || name.includes('er') || name.includes('trauma')) return Shield;
  if (name.includes('recovery') || name.includes('ward') || name.includes('icu')) return Bed;
  if (name.includes('pharmacy') || name.includes('medicine') || name.includes('drug')) return Heart;
  if (name.includes('radiology') || name.includes('xray') || name.includes('imaging')) return Microscope;
  if (name.includes('maternity') || name.includes('nursery') || name.includes('pediatric')) return Baby;
  
  // School/Educational
  if (name.includes('classroom') || name.includes('class') || name.includes('lecture') || name.includes('teaching')) return GraduationCap;
  if (name.includes('laboratory') || name.includes('science') || name.includes('chemistry') || name.includes('physics') || name.includes('biology')) return Microscope;
  if (name.includes('computer') || name.includes('it') || name.includes('technology')) return Calculator;
  if (name.includes('administration') || name.includes('admin') || name.includes('principal') || name.includes('head')) return Briefcase;
  if (name.includes('counselor') || name.includes('guidance') || name.includes('psychology')) return Heart;
  if (name.includes('auditorium') || name.includes('assembly') || name.includes('hall')) return Users;
  if (name.includes('cafeteria') || name.includes('canteen') || name.includes('dining hall')) return UtensilsCrossed;
  if (name.includes('dormitory') || name.includes('dorm') || name.includes('hostel') || name.includes('residence')) return Bed;
  
  // Hotel spaces
  if (name.includes('suite') || name.includes('guest') || name.includes('room')) return Bed;
  if (name.includes('restaurant') || name.includes('dining') || name.includes('banquet')) return UtensilsCrossed;
  if (name.includes('spa') || name.includes('wellness') || name.includes('massage')) return Heart;
  if (name.includes('pool') || name.includes('swimming')) return TreePine;
  if (name.includes('ballroom') || name.includes('event') || name.includes('function')) return Users;
  if (name.includes('business center') || name.includes('business')) return Briefcase;
  if (name.includes('concierge') || name.includes('front desk')) return Building2;
  
  // Restaurant/Food service
  if (name.includes('prep') || name.includes('preparation') || name.includes('prep kitchen')) return ChefHat;
  if (name.includes('walk-in') || name.includes('cooler') || name.includes('freezer')) return Package;
  if (name.includes('dishwash') || name.includes('dish') || name.includes('cleaning')) return Shirt;
  if (name.includes('bar') || name.includes('cocktail') || name.includes('beverage')) return Coffee;
  
  return Home; // Default icon
};

const getRoomImage = (roomName) => {
  const name = roomName.toLowerCase();
  
  // Existing Images
  if (name.includes('living') || name.includes('parlor') || name.includes('lounge') || name.includes('sitting') || name.includes('family')) {
    return 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/c1fe55218_TransformYourLivingAreaintoaHappyHaven.jpeg';
  }
  if (name.includes('laundry') || name.includes('utility') || name.includes('wash')) {
    return 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/ed25b7615_UltraLuxeBlackGoldLaundryRoom_LEDCeilingDetailswithStackedAppliances.jpeg';
  }
  if (name.includes('dining') || name.includes('eat')) {
    return 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/9adb83b12_Moderndiningroom_Designadiningroomthatechoesyourpersonality.jpeg';
  }
  if (name.includes('gym') || name.includes('fitness') || name.includes('exercise') || name.includes('workout')) {
    return 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/96be28beb_Modernhomegym.jpeg';
  }
  if (name.includes('bedroom') || name.includes('bed') || name.includes('sleep') || name.includes('master')) {
    return 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/3187b7f75_7bcb330e-f0de-4709-83a4-ef00a7a20f1c.jpeg';
  }
  if (name.includes('kitchen') || name.includes('cook')) {
    return 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/95c80a0b6_ModernInteriorDesignTrendsforContemporaryKitchens_.jpeg';
  }
  if (name.includes('office') || name.includes('study') || name.includes('work') || name.includes('desk')) {
    return 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/8f8eec205_48c73345-027e-482e-98e9-3e989cd26119.jpeg';
  }
  if (name.includes('bathroom') || name.includes('bath') || name.includes('toilet') || name.includes('washroom') || name.includes('restroom')) {
    return 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/400bd623f_BlackBathroomIdeastoElevateYourHomeDecor.jpeg';
  }
  
  // New Images
  if (name.includes('garage') || name.includes('car') || name.includes('parking')) {
    return 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/4705ef9ea_Moderndarkgarage.jpeg';
  }
  if (name.includes('garden') || name.includes('yard') || name.includes('outdoor') || name.includes('exterior') || name.includes('patio') || name.includes('deck')) {
    return 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/3d0eba65c_f4ffa41e-8c1c-497b-9f16-5a99fa548933.jpeg';
  }
  if (name.includes('gaming') || name.includes('game') || name.includes('play')) {
    return 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/1081a667e_CreateYourDreamGamingSetup.jpeg';
  }
  if (name.includes('cinema') || name.includes('movie') || name.includes('theater') || name.includes('theatre')) {
    return 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/83d1171d6_ad3d54eb-961e-47b2-8fde-0ebc12a6f23f.jpeg';
  }
  if (name.includes('music') || name.includes('band') || name.includes('recording') || name.includes('sound')) {
    return 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/a5de1b867_940dcdc5-8e7c-4fa7-b7d9-54eaf4427bbd.jpeg';
  }
  if (name.includes('art') || name.includes('craft') || name.includes('studio') || name.includes('creative')) {
    return 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/da10402af_download2.jpeg';
  }
  if (name.includes('library') || name.includes('reading') || name.includes('book')) {
    return 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/7db31fa8d_ModernAndMasterHomeLibraryDesigns_ThatWillHaveBookLovers_HomeDecorationIdeas.jpeg';
  }
  if (name.includes('storage') || name.includes('store') || name.includes('closet') || name.includes('pantry') || name.includes('attic') || name.includes('basement')) {
    return 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/b691726c0_16AtticStorageIdeas_CleverTipstoTransformYourSpace.jpeg';
  }
  if (name.includes('mechanical') || name.includes('boiler') || name.includes('hvac') || name.includes('electrical')) {
    return 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/15d17745d_download3.jpeg';
  }
  if (name.includes('bar') || name.includes('cocktail') || name.includes('beverage')) {
    return 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/bc129f934_download2.jpeg';
  }

  // Default fallback image
  return 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/c1fe55218_TransformYourLivingAreaintoaHappyHaven.jpeg';
};

export default function RoomDetails() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [room, setRoom] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDeviceModal, setShowAddDeviceModal] = useState(false);
  const [activeTab, setActiveTab] = useState("devices");

  const loadRoom = async () => {
    const pathParts = window.location.pathname.split('/');
    const roomId = pathParts[pathParts.length - 1];

    if (!roomId || roomId === 'room') {
      navigate(createPageUrl("Automation"));
      return;
    }

    setIsLoading(true);
    try {
      const currentUser = await User.me();
      const rooms = await Room.filter({ created_by: currentUser.email });
      const foundRoom = rooms.find(r => r.id === roomId);

      if (!foundRoom) {
        navigate(createPageUrl("Automation"));
        return;
      }

      // If appliances have child_device_ids, sync their states from backend
      if (foundRoom.appliances && foundRoom.appliances.length > 0) {
        const appliancesWithChildIds = foundRoom.appliances.filter(app => app.child_device_id);
        
        if (appliancesWithChildIds.length > 0) {
          const childIds = appliancesWithChildIds.map(app => app.child_device_id);
          
          // Fetch child device states from backend
          const { data: childDevices, error } = await supabase
            .from('child_devices')
            .select('id, state')
            .in('id', childIds);

          if (!error && childDevices) {
            // Update appliances with backend states
            foundRoom.appliances = foundRoom.appliances.map(app => {
              if (app.child_device_id) {
                const childDevice = childDevices.find(cd => cd.id === app.child_device_id);
                if (childDevice && childDevice.state) {
                  const state = childDevice.state as any;
                  return {
                    ...app,
                    status: state.status || false,
                    intensity: state.intensity || app.intensity,
                    color_tint: state.color_tint || app.color_tint,
                    auto_mode: state.auto_mode || app.auto_mode,
                    power_usage: state.power_usage || app.power_usage
                  };
                }
              }
              return app;
            });
          }
        }
      }

      setRoom(foundRoom);
    } catch (error) {
      console.error("Error loading room:", error);
      navigate(createPageUrl("Automation"));
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadRoom();
  }, []);

  // Auto-refresh when voice commands change room/device states
  useAutoRefresh(loadRoom, ['roomStateChanged', 'applianceStateChanged', 'deviceStateChanged']);

  const handleBack = () => {
    navigate(createPageUrl("Automation"));
  };

  const handleDeleteRoom = async () => {
    if (!room) return;

    try {
      await Room.delete(room.id);
      navigate(createPageUrl("Automation"));
    } catch (error) {
      console.error("Error deleting room:", error);
    }
  };

  const handleMasterToggle = async () => {
    if (!room || !room.appliances?.length) return;

    try {
      const allOn = room.appliances.every(app => app.status);
      const updatedAppliances = room.appliances.map(app => ({
        ...app,
        status: !allOn
      }));

      await Room.update(room.id, { appliances: updatedAppliances });
      setRoom(prev => ({ ...prev, appliances: updatedAppliances }));
    } catch (error) {
      console.error("Error toggling all appliances:", error);
    }
  };

  const handleApplianceUpdate = async (applianceId, updates) => {
    if (!room) return;

    try {
      // Find the appliance to update
      const appliance = room.appliances.find(app => app.id === applianceId);
      
      // Update in child_devices table if it has a child_device_id
      if (appliance?.child_device_id) {
        // Build state object with all properties
        const newState = {
          status: updates.status !== undefined ? updates.status : appliance.status,
          intensity: updates.intensity !== undefined ? updates.intensity : appliance.intensity,
          color_tint: updates.color_tint !== undefined ? updates.color_tint : appliance.color_tint,
          auto_mode: updates.auto_mode !== undefined ? updates.auto_mode : appliance.auto_mode,
          power_usage: updates.power_usage !== undefined ? updates.power_usage : appliance.power_usage,
        };

        // Update the child_device state in the backend using the update_child_state RPC
        const { data: updateResult, error } = await supabase.rpc('update_child_state', {
          p_child_id: appliance.child_device_id,
          p_new_state: newState
        }) as any;

        if (error || !updateResult?.success) {
          console.error("Error updating child device:", error || updateResult);
          toast({
            title: "Update Failed",
            description: updateResult?.message || "Failed to sync device state with backend.",
            variant: "destructive"
          });
          return;
        }
      }

      // Update locally in room appliances
      const updatedAppliances = room.appliances.map(app =>
        app.id === applianceId ? { ...app, ...updates } : app
      );

      await Room.update(room.id, { appliances: updatedAppliances });
      setRoom(prev => ({ ...prev, appliances: updatedAppliances }));
      
      // Trigger update event for synchronization
      window.dispatchEvent(new CustomEvent('applianceStateChanged', { 
        detail: { roomId: room.id, applianceId } 
      }));
    } catch (error) {
      console.error("Error updating appliance:", error);
      toast({
        title: "Update Failed", 
        description: "Failed to update device state.",
        variant: "destructive"
      });
    }
  };

  const handleApplianceDelete = async (applianceId) => {
    if (!room) return;

    try {
      // Find the appliance to delete
      const appliance = room.appliances.find(app => app.id === applianceId);
      
      // Delete from child_devices table if it has a child_device_id
      if (appliance?.child_device_id) {
        const { error } = await supabase
          .from('child_devices')
          .delete()
          .eq('id', appliance.child_device_id);

        if (error) {
          console.error("Error deleting child device from backend:", error);
          toast({
            title: "Delete Failed",
            description: "Failed to delete device from backend.",
            variant: "destructive"
          });
          return;
        }
      }

      // Update locally in room appliances
      const updatedAppliances = room.appliances.filter(app => app.id !== applianceId);
      await Room.update(room.id, { appliances: updatedAppliances });
      setRoom(prev => ({ ...prev, appliances: updatedAppliances }));
    } catch (error) {
      console.error("Error deleting appliance:", error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete device.",
        variant: "destructive"
      });
    }
  };

  const handleAddDevice = async (deviceData) => {
    if (!room) return;

    try {
      // Map the device data to appliance format
      const newDevice = {
        id: deviceData.id || `device_${Date.now()}`,
        child_device_id: deviceData.id, // Store the child_device_id for backend sync
        name: deviceData.name,
        type: deviceData.device_class, // Use device_class as the type
        series: deviceData.device_series, // Store the series/model
        device_id: deviceData.esp_id,
        status: false,
        power_usage: 0,
        intensity: 100,
        color_tint: 'white',
        auto_mode: false
      };

      const updatedAppliances = [...(room.appliances || []), newDevice];
      await Room.update(room.id, { appliances: updatedAppliances });
      setRoom(prev => ({ ...prev, appliances: updatedAppliances }));
      setShowAddDeviceModal(false);
      
      toast({
        title: "Device Added",
        description: `${newDevice.name} has been added successfully.`,
      });
    } catch (error) {
      console.error("Error adding device:", error);
      toast({
        title: "Error",
        description: "Failed to add device. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRoomUpdate = async (updates) => {
    if (!room) return;
    try {
      await Room.update(room.id, updates);
      setRoom(prev => ({ ...prev, ...updates }));
    } catch (error) {
      console.error("Error updating room settings:", error);
      loadRoom();
    }
  };

  const onApplianceDragEnd = async (result) => {
    if (!result.destination) return;
    if (!room || !room.appliances) return;

    const items = Array.from(room.appliances);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Optimistically update UI
    setRoom(prev => ({ ...prev, appliances: items }));

    try {
      await Room.update(room.id, { appliances: items as any });
    } catch (error) {
      console.error("Error saving appliance order:", error);
      // Revert on error
      loadRoom();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <div className="w-8 h-8 bg-white rounded-full"></div>
          </div>
          <p className="text-gray-600 font-inter">Loading room details...</p>
        </div>
      </div>
    );
  }

  if (!room) {
    return null;
  }

  const RoomIcon = getRoomIcon(room.name);
  const roomImage = getRoomImage(room.name);
  const activeDevices = room.appliances?.filter(app => app.status) || [];
  const allOn = room.appliances?.length > 0 && room.appliances.every(app => app.status);

  return (
    <div className="space-y-6 pb-24">
      {/* Header Banner - Increased size to match landing page */}
      <div className="relative h-80 bg-gradient-to-br from-blue-400 to-purple-500 rounded-none flex flex-col justify-between text-white shadow-lg">
        <div className="absolute inset-0 rounded-none">
          <img 
            src={roomImage} 
            alt={`${room.name} interior`} 
            className="w-full h-full object-cover rounded-none" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent rounded-none"></div>
        </div>
        
        <div className="relative z-10 flex items-start justify-between p-6">
            <Button variant="ghost" size="icon" onClick={handleBack} className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm">
                <ArrowLeft className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setShowAddDeviceModal(true)} className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm">
                <Plus className="w-6 h-6" />
            </Button>
        </div>

        <div className="relative z-10 p-6">
            <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <RoomIcon className="w-8 h-8 text-white" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold font-inter" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
                        {room.name}
                    </h1>
                    <p className="text-lg font-inter opacity-90" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>
                        {activeDevices.length} of {room.appliances?.length || 0} devices active
                    </p>
                </div>
            </div>
        </div>
      </div>

      <div className="p-4 pb-24">
        <div className="max-w-[1280px] mx-auto space-y-6">
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="devices" className="font-inter">Devices</TabsTrigger>
              <TabsTrigger value="settings" className="font-inter">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="devices" className="space-y-4 mt-4">
              {/* Master Switch Card */}
              <Card className="glass-card border-0 shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold font-inter">Master Switch</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <p className="text-sm text-gray-600 font-inter">Turn On or Off All Devices</p>
                  <Button
                    onClick={handleMasterToggle}
                    disabled={!room.appliances?.length}
                    className={`w-32 ${allOn ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} font-inter disabled:bg-gray-400`}
                  >
                    <Power className="w-4 h-4 mr-2" />
                    {allOn ? 'Turn All Off' : 'Turn All On'}
                  </Button>
                </CardContent>
              </Card>

              {/* Devices List */}
              {room.appliances?.length > 0 ? (
                <DragDropContext onDragEnd={onApplianceDragEnd}>
                  <Droppable droppableId="appliances">
                    {(provided) => (
                      <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                        {room.appliances.map((appliance, index) => (
                          <Draggable key={appliance.id} draggableId={appliance.id} index={index}>
                            {(provided) => (
                              <div ref={provided.innerRef} {...provided.draggableProps}>
                                <ApplianceControl
                                  appliance={appliance}
                                  onUpdate={handleApplianceUpdate}
                                  onDelete={handleApplianceDelete}
                                  dragHandleProps={provided.dragHandleProps}
                                />
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Power className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 font-inter mb-2">No devices added</h3>
                  <p className="text-gray-600 font-inter mb-4">
                    Add your first smart device to get started
                  </p>
                  <Button onClick={() => setShowAddDeviceModal(true)} className="bg-blue-600 hover:bg-blue-700 font-inter">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Device
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="settings" className="space-y-4 mt-4">
              <RoomSettingsTab room={room} onRoomUpdate={handleRoomUpdate} onDeleteRoom={handleDeleteRoom} />
            </TabsContent>
          </Tabs>

          <AddDeviceModal
            isOpen={showAddDeviceModal}
            onClose={() => setShowAddDeviceModal(false)}
            onSave={handleAddDevice}
            roomName={room.name}
            roomId={room.id}
          />
        </div>
      </div>
    </div>
  );
}
