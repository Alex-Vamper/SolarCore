import { useState, useEffect } from "react";
import { User, UserSettings, Room } from "@/entities/all";
import SetupWizard from "./SetupWizard";

interface OnboardingCheckerProps {
  user: any;
  children: React.ReactNode;
}

export default function OnboardingChecker({ user, children }: OnboardingCheckerProps) {
  const [isOnboarded, setIsOnboarded] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkOnboardingStatus();
  }, [user]);

  const checkOnboardingStatus = async () => {
    try {
      // Check if user has completed onboarding in the profiles table
      const userData = await User.me();
      // Check UserSettings for setup_completed status
      const settingsResult = await UserSettings.filter({ created_by: userData.email });
      const hasCompletedSetup = settingsResult.length > 0 && settingsResult[0].setup_completed;
      setIsOnboarded(hasCompletedSetup || false);
    } catch (error) {
      console.error("Error checking onboarding status:", error);
      setIsOnboarded(false);
    }
    setIsLoading(false);
  };

  const handleOnboardingComplete = async (setupData: any) => {
    try {
      // Create rooms
      const roomPromises = setupData.rooms.map((room: any, index: number) => 
        Room.create({
          name: room.name,
          appliances: []
        })
      );
      await Promise.all(roomPromises);

      // Update user settings
      const settingsData = {
        building_type: setupData.buildingType,
        building_name: setupData.buildingName || setupData.buildingType,
        energy_mode: setupData.energySource === 'solar' ? 'solar_only' : 
                    setupData.energySource === 'grid' ? 'grid_only' : 'auto_switch',
        total_rooms: setupData.rooms.length,
        setup_completed: true
      };

      const existingSettings = await UserSettings.filter({ created_by: user.email });
      if (existingSettings.length > 0) {
        await UserSettings.update(existingSettings[0].id, settingsData);
      } else {
        await UserSettings.create(settingsData);
      }
      
      setIsOnboarded(true);
    } catch (error) {
      console.error("Error completing onboarding:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <div className="w-8 h-8 bg-white rounded-full"></div>
          </div>
          <p className="text-gray-600 font-inter">Checking setup...</p>
        </div>
      </div>
    );
  }

  if (!isOnboarded) {
    return <SetupWizard onComplete={handleOnboardingComplete} />;
  }

  return <>{children}</>;
}